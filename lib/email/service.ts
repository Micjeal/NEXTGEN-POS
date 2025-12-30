import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  html_content: string
  text_content?: string
  category: string
  variables: Record<string, any>
  is_active: boolean
}

export interface EmailLog {
  id: string
  template_id: string
  recipient_email: string
  recipient_name?: string
  subject: string
  status: 'sent' | 'delivered' | 'bounced' | 'complained'
  provider_message_id?: string
  sent_at: string
  error_message?: string
}

export class EmailService {
  /**
   * Send a single email using a template
   */
  async sendEmail(
    templateId: string,
    recipientEmail: string,
    recipientName?: string,
    variables: Record<string, any> = {}
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      console.log('EmailService.sendEmail called with:', { templateId, recipientEmail, recipientName, variables })

      const supabase = await createClient()

      // Fetch template from database
      const { data: template, error: templateError } = await supabase
        .from('email_templates')
        .select('*')
        .eq('id', templateId)
        .eq('is_active', true)
        .single()

      console.log('Template lookup result:', { template: template?.id, templateError })

      if (templateError || !template) {
        console.log('Template not found, checking if demo mode...')
        // If template not found and it's a demo ID, return error
        return { success: false, error: 'Email template not found' }
      }

      // Render template with variables
      const renderedSubject = this.renderTemplate(template.subject, variables)
      const renderedHtml = this.renderTemplate(template.html_content, variables)
      const renderedText = template.text_content
        ? this.renderTemplate(template.text_content, variables)
        : undefined

      // Send email via Resend
      // Use a verified domain or Resend's default for testing
      const fromAddress = process.env.EMAIL_FROM?.includes('gmail.com')
        ? 'onboarding@resend.dev'  // Use Resend's default for gmail testing
        : `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`

      console.log('Sending from:', fromAddress)

      const { data: resendData, error: resendError } = await resend.emails.send({
        from: fromAddress,
        to: recipientName ? `${recipientName} <${recipientEmail}>` : recipientEmail,
        subject: renderedSubject,
        html: renderedHtml,
        text: renderedText,
      })

      if (resendError) {
        console.error('Resend error:', resendError)

        // Log failed email
        await this.logEmail(supabase, {
          template_id: templateId,
          recipient_email: recipientEmail,
          recipient_name: recipientName,
          subject: renderedSubject,
          status: 'bounced',
          error_message: resendError.message,
        })

        // Provide user-friendly error message
        let errorMessage = resendError.message
        if (errorMessage.includes('domain is not verified')) {
          errorMessage = 'Email domain not verified. Please verify your domain on Resend.com or use a different from address.'
        }

        return { success: false, error: errorMessage }
      }

      // Log successful email
      await this.logEmail(supabase, {
        template_id: templateId,
        recipient_email: recipientEmail,
        recipient_name: recipientName,
        subject: renderedSubject,
        status: 'sent',
        provider_message_id: resendData?.id,
      })

      return { success: true, messageId: resendData?.id }
    } catch (error) {
      console.error('Email sending error:', error)
      return { success: false, error: 'Internal server error' }
    }
  }

  /**
   * Send bulk emails using a template
   */
  async sendBulkEmail(
    templateId: string,
    recipients: Array<{ email: string; name?: string; variables?: Record<string, any> }>,
    defaultVariables: Record<string, any> = {}
  ): Promise<{ success: boolean; sent: number; failed: number; errors: string[] }> {
    const results = { success: true, sent: 0, failed: 0, errors: [] as string[] }

    for (const recipient of recipients) {
      const variables = { ...defaultVariables, ...recipient.variables }
      const result = await this.sendEmail(templateId, recipient.email, recipient.name, variables)

      if (result.success) {
        results.sent++
      } else {
        results.failed++
        results.errors.push(`Failed to send to ${recipient.email}: ${result.error}`)
      }

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    return results
  }

  /**
   * Render template with variables
   */
  private renderTemplate(template: string, variables: Record<string, any>): string {
    let rendered = template

    // Replace {{variable}} syntax
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      rendered = rendered.replace(regex, String(value))
    })

    return rendered
  }

  /**
   * Log email sending activity
   */
  private async logEmail(supabase: any, logData: Omit<EmailLog, 'id' | 'sent_at'>): Promise<void> {
    try {
      await supabase.from('email_logs').insert({
        ...logData,
        sent_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Failed to log email:', error)
    }
  }

  /**
   * Get email templates by category
   */
  async getTemplatesByCategory(category: string): Promise<EmailTemplate[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('name')

    if (error) {
      console.error('Error fetching email templates:', error)
      return []
    }

    return data || []
  }

  /**
   * Get all active email templates
   */
  async getAllTemplates(): Promise<EmailTemplate[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching email templates:', error)
      return []
    }

    return data || []
  }
}

// Export singleton instance
export const emailService = new EmailService()