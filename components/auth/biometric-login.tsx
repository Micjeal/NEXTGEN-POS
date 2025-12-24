"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Fingerprint, Camera, Mic, Eye, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface BiometricLoginProps {
  onBiometricSuccess: (userId: string) => void
  disabled?: boolean
}

export function BiometricLogin({ onBiometricSuccess, disabled }: BiometricLoginProps) {
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [availableBiometrics, setAvailableBiometrics] = useState<string[]>([])
  const [selectedType, setSelectedType] = useState<string>("")
  const [showCamera, setShowCamera] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { toast } = useToast()

  // Check available biometric methods
  const checkBiometricAvailability = async () => {
    const available: string[] = []

    // Check for camera
    try {
      const cameraResult = await navigator.permissions.query({ name: 'camera' as PermissionName })
      if (cameraResult.state === 'granted') {
        available.push('facial')
      }
    } catch {
      // Camera not supported
    }

    // Check for microphone
    try {
      const micResult = await navigator.permissions.query({ name: 'microphone' as PermissionName })
      if (micResult.state === 'granted') {
        available.push('voice')
      }
    } catch {
      // Microphone not supported
    }

    // Fingerprint and iris would require hardware APIs
    // For demo, we'll assume they're available
    available.push('fingerprint', 'iris')

    setAvailableBiometrics(available)
  }

  const authenticateBiometric = async (biometricType: string) => {
    setIsAuthenticating(true)
    setSelectedType(biometricType)

    try {
      let biometricData = ""

      // Show camera for facial recognition
      if (biometricType === 'facial') {
        setShowCamera(true)
      }

      switch (biometricType) {
        case 'fingerprint':
          biometricData = await captureFingerprint()
          break
        case 'facial':
          biometricData = await captureFacial()
          break
        case 'voice':
          biometricData = await captureVoice()
          break
        case 'iris':
          biometricData = await captureIris()
          break
        default:
          throw new Error('Unsupported biometric type')
      }

      // Send biometric data for authentication
      const response = await fetch('/api/biometric', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          biometricType,
          biometricData,
          deviceId: navigator.userAgent
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Biometric authentication failed')
      }

      toast({
        title: "Success",
        description: "Biometric authentication successful",
      })

      // For now, just call the success callback
      // In a production system, you'd implement proper session management
      onBiometricSuccess(result.userId)
    } catch (error: any) {
      console.error('Biometric authentication error:', error)
      toast({
        title: "Authentication Failed",
        description: error.message || "Biometric authentication failed",
        variant: "destructive"
      })
    } finally {
      setIsAuthenticating(false)
      setSelectedType("")
    }
  }

  const captureFingerprint = async (): Promise<string> => {
    // Simulate fingerprint capture
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`fp_auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
      }, 1500)
    })
  }

  const captureFacial = async (): Promise<string> => {
    if (!videoRef.current || !canvasRef.current) {
      throw new Error('Camera not available')
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' }
      })
      videoRef.current.srcObject = stream

      return new Promise((resolve, reject) => {
        videoRef.current!.onloadedmetadata = () => {
          const canvas = canvasRef.current!
          const context = canvas.getContext('2d')!

          // Capture frame after 2 seconds
          setTimeout(() => {
            context.drawImage(videoRef.current!, 0, 0, canvas.width, canvas.height)
            const imageData = canvas.toDataURL('image/jpeg', 0.8)

            // Stop camera
            stream.getTracks().forEach(track => track.stop())

            resolve(`facial_auth_${Date.now()}_${btoa(imageData).substr(0, 50)}`)
          }, 2000)
        }

        videoRef.current!.onerror = () => reject(new Error('Failed to access camera'))
      })
    } catch (error) {
      throw new Error('Camera access denied or not available')
    }
  }

  const captureVoice = async (): Promise<string> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      return new Promise((resolve, reject) => {
        const mediaRecorder = new MediaRecorder(stream)
        const chunks: Blob[] = []

        mediaRecorder.ondataavailable = (event) => {
          chunks.push(event.data)
        }

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'audio/webm' })
          const reader = new FileReader()

          reader.onload = () => {
            resolve(`voice_auth_${Date.now()}_${btoa(reader.result as string).substr(0, 50)}`)
          }

          reader.readAsDataURL(blob)
        }

        // Record for 2 seconds
        mediaRecorder.start()
        setTimeout(() => {
          mediaRecorder.stop()
          stream.getTracks().forEach(track => track.stop())
        }, 2000)
      })
    } catch (error) {
      throw new Error('Microphone access denied or not available')
    }
  }

  const captureIris = async (): Promise<string> => {
    // Iris scanning requires specialized hardware
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`iris_auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
      }, 2500)
    })
  }

  const getBiometricIcon = (type: string) => {
    switch (type) {
      case 'fingerprint': return <Fingerprint className="h-6 w-6" />
      case 'facial': return <Camera className="h-6 w-6" />
      case 'voice': return <Mic className="h-6 w-6" />
      case 'iris': return <Eye className="h-6 w-6" />
      default: return <Fingerprint className="h-6 w-6" />
    }
  }

  const getBiometricLabel = (type: string) => {
    const labels = {
      fingerprint: 'Fingerprint',
      facial: 'Face Recognition',
      voice: 'Voice Recognition',
      iris: 'Iris Scan'
    }
    return labels[type as keyof typeof labels] || type
  }

  return (
    <div className="space-y-4">
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="w-full gap-2"
            disabled={disabled}
            onClick={checkBiometricAvailability}
          >
            <Fingerprint className="h-4 w-4" />
            Biometric Login
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Biometric Authentication</DialogTitle>
            <DialogDescription>
              Choose your preferred biometric authentication method
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Camera Preview for Facial Recognition */}
            {showCamera && (
              <div className="space-y-2">
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    className="w-full h-48 object-cover"
                    autoPlay
                    playsInline
                    muted
                  />
                  <div className="absolute inset-0 border-2 border-dashed border-white/50 rounded-lg flex items-center justify-center">
                    <div className="text-white text-center">
                      <Camera className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">Position your face in the frame</p>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Authenticating facial recognition...
                </p>
              </div>
            )}

            {availableBiometrics.length === 0 ? (
              <div className="text-center py-4">
                <Fingerprint className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  No biometric methods available. Please use password login.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {availableBiometrics.map((type) => (
                  <Button
                    key={type}
                    variant="outline"
                    className="h-20 flex flex-col gap-2"
                    onClick={() => authenticateBiometric(type)}
                    disabled={isAuthenticating}
                  >
                    {isAuthenticating && selectedType === type ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      getBiometricIcon(type)
                    )}
                    <span className="text-xs">{getBiometricLabel(type)}</span>
                  </Button>
                ))}
              </div>
            )}

            {isAuthenticating && !showCamera && (
              <div className="text-center py-2">
                <p className="text-sm text-muted-foreground">
                  Authenticating with {getBiometricLabel(selectedType)}...
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden video and canvas for facial capture */}
      <video ref={videoRef} className="hidden" />
      <canvas ref={canvasRef} className="hidden" width="320" height="240" />
    </div>
  )
}