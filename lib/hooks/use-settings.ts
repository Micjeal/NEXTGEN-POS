"use client"

import { useState, useEffect } from 'react'

interface SystemSettings {
  systemName: string
  systemDescription: string
  businessAddress: string
  businessPhone: string
  businessEmail: string
  taxNumber: string
  storeLogo: string
  currency: string
  timezone: string
  lowStockThreshold: number
  criticalStockThreshold: number
  autoReorderEnabled: boolean
  defaultReorderQuantity: number
  receiptHeader: string
  receiptFooter: string
  showLogoOnReceipt: boolean
  includeTaxDetails: boolean
  receiptPaperSize: string
  paymentGatewayEnabled: boolean
  barcodeScannerEnabled: boolean
  emailIntegrationEnabled: boolean
  smsIntegrationEnabled: boolean
  enableNotifications: boolean
  enableAuditLog: boolean
  autoBackup: boolean
  maintenanceMode: boolean
}

const defaultSettings: SystemSettings = {
  systemName: "POS System",
  systemDescription: "Supermarket Management System",
  businessAddress: "",
  businessPhone: "",
  businessEmail: "",
  taxNumber: "",
  storeLogo: "",
  currency: "UGX",
  timezone: "Africa/Kampala",
  lowStockThreshold: 10,
  criticalStockThreshold: 5,
  autoReorderEnabled: false,
  defaultReorderQuantity: 50,
  receiptHeader: "Thank you for shopping with us!",
  receiptFooter: "Visit us again soon!",
  showLogoOnReceipt: true,
  includeTaxDetails: true,
  receiptPaperSize: "80mm",
  paymentGatewayEnabled: true,
  barcodeScannerEnabled: true,
  emailIntegrationEnabled: false,
  smsIntegrationEnabled: false,
  enableNotifications: true,
  enableAuditLog: true,
  autoBackup: false,
  maintenanceMode: false,
}

export function useSettings() {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
      // Keep defaults
    } finally {
      setLoading(false)
    }
  }

  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
  }

  return {
    settings,
    loading,
    updateSettings,
    reloadSettings: loadSettings
  }
}