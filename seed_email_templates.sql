-- Seed email templates for the POS system

-- Add unique constraint on name if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'email_templates_name_unique') THEN
    ALTER TABLE email_templates ADD CONSTRAINT email_templates_name_unique UNIQUE (name);
  END IF;
END $$;

-- Transaction Receipt Template
INSERT INTO email_templates (name, subject, html_content, text_content, category, variables, is_active, created_by)
VALUES (
  'Transaction Receipt',
  'Your Transaction Receipt - {{invoice_number}}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Transaction Receipt</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #333;">{{store_name}}</h1>
    <p style="color: #666;">{{store_address}}</p>
    <p style="color: #666;">{{store_phone}}</p>
  </div>

  <div style="border: 1px solid #ddd; padding: 20px; margin-bottom: 20px;">
    <h2 style="color: #333; margin-top: 0;">Transaction Receipt</h2>

    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 5px 0;"><strong>Invoice #:</strong></td>
        <td style="text-align: right;">{{invoice_number}}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0;"><strong>Date:</strong></td>
        <td style="text-align: right;">{{transaction_date}}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0;"><strong>Customer:</strong></td>
        <td style="text-align: right;">{{customer_name}}</td>
      </tr>
    </table>
  </div>

  <div style="border: 1px solid #ddd; padding: 20px; margin-bottom: 20px;">
    <h3 style="margin-top: 0;">Items Purchased</h3>
    <pre style="font-family: monospace; white-space: pre-wrap;">{{items}}</pre>
  </div>

  <div style="border: 1px solid #ddd; padding: 20px; margin-bottom: 20px;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 5px 0;"><strong>Subtotal:</strong></td>
        <td style="text-align: right;">${{subtotal}}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0;"><strong>Tax:</strong></td>
        <td style="text-align: right;">${{tax_amount}}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0;"><strong>Discount:</strong></td>
        <td style="text-align: right;">${{discount_amount}}</td>
      </tr>
      <tr style="border-top: 1px solid #ddd;">
        <td style="padding: 10px 0;"><strong>Total:</strong></td>
        <td style="text-align: right; font-size: 18px;"><strong>${{total}}</strong></td>
      </tr>
      <tr>
        <td style="padding: 5px 0;"><strong>Payment Method:</strong></td>
        <td style="text-align: right;">{{payment_method}}</td>
      </tr>
    </table>
  </div>

  <div style="text-align: center; color: #666; margin-top: 30px;">
    <p>Thank you for your business!</p>
    <p>Please keep this receipt for your records.</p>
  </div>
</body>
</html>',
  'Transaction Receipt - {{invoice_number}}

{{store_name}}
{{store_address}}
{{store_phone}}

Invoice #: {{invoice_number}}
Date: {{transaction_date}}
Customer: {{customer_name}}

Items Purchased:
{{items}}

Subtotal: ${{subtotal}}
Tax: ${{tax_amount}}
Discount: ${{discount_amount}}
Total: ${{total}}
Payment Method: {{payment_method}}

Thank you for your business!
Please keep this receipt for your records.',
  'welcome',
  '["customer_name", "invoice_number", "transaction_date", "items", "subtotal", "tax_amount", "discount_amount", "total", "payment_method", "store_name", "store_address", "store_phone"]',
  true,
  null
) ON CONFLICT (name) DO NOTHING;

-- Transaction Alert Template
INSERT INTO email_templates (name, subject, html_content, text_content, category, variables, is_active, created_by)
VALUES (
  'Transaction Alert',
  'New Sale Alert - {{invoice_number}}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Transaction Alert</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #333;">Sale Alert</h1>
  </div>

  <div style="border: 1px solid #ddd; padding: 20px; margin-bottom: 20px;">
    <h2 style="color: #333; margin-top: 0;">New Transaction</h2>

    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 5px 0;"><strong>Invoice #:</strong></td>
        <td style="text-align: right;">{{invoice_number}}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0;"><strong>Date:</strong></td>
        <td style="text-align: right;">{{transaction_date}}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0;"><strong>Customer:</strong></td>
        <td style="text-align: right;">{{customer_name}}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0;"><strong>Cashier:</strong></td>
        <td style="text-align: right;">{{cashier_name}}</td>
      </tr>
    </table>
  </div>

  <div style="border: 1px solid #ddd; padding: 20px; margin-bottom: 20px;">
    <h3 style="margin-top: 0;">Items Sold</h3>
    <pre style="font-family: monospace; white-space: pre-wrap;">{{items}}</pre>
  </div>

  <div style="border: 1px solid #ddd; padding: 20px; margin-bottom: 20px;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 5px 0;"><strong>Subtotal:</strong></td>
        <td style="text-align: right;">${{subtotal}}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0;"><strong>Tax:</strong></td>
        <td style="text-align: right;">${{tax_amount}}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0;"><strong>Discount:</strong></td>
        <td style="text-align: right;">${{discount_amount}}</td>
      </tr>
      <tr style="border-top: 1px solid #ddd;">
        <td style="padding: 10px 0;"><strong>Total:</strong></td>
        <td style="text-align: right; font-size: 18px;"><strong>${{total}}</strong></td>
      </tr>
      <tr>
        <td style="padding: 5px 0;"><strong>Payment Method:</strong></td>
        <td style="text-align: right;">{{payment_method}}</td>
      </tr>
    </table>
  </div>

  <div style="text-align: center; color: #666; margin-top: 30px;">
    <p>This is an automated notification of a new sale transaction.</p>
  </div>
</body>
</html>',
  'Transaction Alert - {{invoice_number}}

New Transaction

Invoice #: {{invoice_number}}
Date: {{transaction_date}}
Customer: {{customer_name}}
Cashier: {{cashier_name}}

Items Sold:
{{items}}

Subtotal: ${{subtotal}}
Tax: ${{tax_amount}}
Discount: ${{discount_amount}}
Total: ${{total}}
Payment Method: {{payment_method}}

This is an automated notification of a new sale transaction.',
  'alerts',
  '["staff_name", "invoice_number", "transaction_date", "customer_name", "items", "subtotal", "tax_amount", "discount_amount", "total", "payment_method", "cashier_name"]',
  true,
  null
) ON CONFLICT (name) DO NOTHING;