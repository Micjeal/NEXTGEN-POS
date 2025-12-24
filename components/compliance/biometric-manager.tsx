"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Fingerprint, Eye, EyeOff, Camera, Mic, Plus, Trash2, Power, PowerOff } from "lucide-react"

interface BiometricRecord {
  id: string
  biometric_type: string
  device_id?: string
  is_active: boolean
  last_used_at?: string
  created_at: string
}

export function BiometricManager() {
  const [biometricRecords, setBiometricRecords] = useState<BiometricRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showEnrollDialog, setShowEnrollDialog] = useState(false)
  const [enrolling, setEnrolling] = useState(false)
  const [selectedType, setSelectedType] = useState<string>("")
  const [deviceId, setDeviceId] = useState<string>("")
  const [showCamera, setShowCamera] = useState(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const { toast } = useToast()
  const supabase = createClient()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    loadBiometricRecords()
  }, [])

  const loadBiometricRecords = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/biometric')
      const result = await response.json()

      if (!response.ok) throw new Error(result.error)
      setBiometricRecords(result.data || [])
    } catch (error) {
      console.error('Error loading biometric records:', error)
      toast({
        title: "Error",
        description: "Failed to load biometric records",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const enrollBiometric = async () => {
    if (!selectedType) {
      toast({
        title: "Error",
        description: "Please select a biometric type",
        variant: "destructive"
      })
      return
    }

    setEnrolling(true)
    try {
      let biometricData = ""

      switch (selectedType) {
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

      const response = await fetch('/api/biometric', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          biometricType: selectedType,
          biometricData,
          deviceId: deviceId || navigator.userAgent
        })
      })

      const result = await response.json()

      if (!response.ok) throw new Error(result.error)

      toast({
        title: "Success",
        description: "Biometric authentication enrolled successfully",
      })

      setShowEnrollDialog(false)
      setSelectedType("")
      setDeviceId("")
      loadBiometricRecords()
    } catch (error: any) {
      console.error('Error enrolling biometric:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to enroll biometric authentication",
        variant: "destructive"
      })
    } finally {
      setEnrolling(false)
    }
  }

  const captureFingerprint = async (): Promise<string> => {
    // Simulate fingerprint capture
    // In a real implementation, this would use WebAuthn or device APIs
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`fp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
      }, 2000)
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
      setCameraStream(stream)

      return new Promise((resolve, reject) => {
        videoRef.current!.onloadedmetadata = () => {
          const canvas = canvasRef.current!
          const context = canvas.getContext('2d')!

          // Capture frame after 3 seconds to allow user to position
          setTimeout(() => {
            context.drawImage(videoRef.current!, 0, 0, canvas.width, canvas.height)
            const imageData = canvas.toDataURL('image/jpeg', 0.8)

            // Stop camera
            stream.getTracks().forEach(track => track.stop())
            setCameraStream(null)

            resolve(`facial_${Date.now()}_${btoa(imageData).substr(0, 50)}`)
          }, 3000)
        }

        videoRef.current!.onerror = () => {
          stream.getTracks().forEach(track => track.stop())
          setCameraStream(null)
          reject(new Error('Failed to access camera'))
        }
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
            resolve(`voice_${Date.now()}_${btoa(reader.result as string).substr(0, 50)}`)
          }

          reader.readAsDataURL(blob)
        }

        // Record for 3 seconds
        mediaRecorder.start()
        setTimeout(() => {
          mediaRecorder.stop()
          stream.getTracks().forEach(track => track.stop())
        }, 3000)
      })
    } catch (error) {
      throw new Error('Microphone access denied or not available')
    }
  }

  const captureIris = async (): Promise<string> => {
    // Iris scanning requires specialized hardware
    // For demo purposes, simulate the process
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`iris_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
      }, 3000)
    })
  }

  const toggleBiometric = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch('/api/biometric', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive })
      })

      const result = await response.json()

      if (!response.ok) throw new Error(result.error)

      toast({
        title: "Success",
        description: `Biometric authentication ${isActive ? 'enabled' : 'disabled'}`,
      })

      loadBiometricRecords()
    } catch (error: any) {
      console.error('Error toggling biometric:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to update biometric authentication",
        variant: "destructive"
      })
    }
  }

  const deleteBiometric = async (id: string) => {
    if (!confirm('Are you sure you want to delete this biometric authentication?')) {
      return
    }

    try {
      const response = await fetch(`/api/biometric?id=${id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok) throw new Error(result.error)

      toast({
        title: "Success",
        description: "Biometric authentication removed successfully",
      })

      loadBiometricRecords()
    } catch (error: any) {
      console.error('Error deleting biometric:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete biometric authentication",
        variant: "destructive"
      })
    }
  }

  const getBiometricIcon = (type: string) => {
    switch (type) {
      case 'fingerprint': return <Fingerprint className="h-4 w-4" />
      case 'facial': return <Camera className="h-4 w-4" />
      case 'voice': return <Mic className="h-4 w-4" />
      case 'iris': return <Eye className="h-4 w-4" />
      default: return <Fingerprint className="h-4 w-4" />
    }
  }

  const getBiometricLabel = (type: string) => {
    const labels = {
      fingerprint: 'Fingerprint',
      facial: 'Facial Recognition',
      voice: 'Voice Recognition',
      iris: 'Iris Scan'
    }
    return labels[type as keyof typeof labels] || type
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Biometric Authentication</h2>
          <p className="text-muted-foreground">Manage biometric authentication methods</p>
        </div>
        <Dialog open={showEnrollDialog} onOpenChange={setShowEnrollDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Enroll Biometric
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Enroll Biometric Authentication</DialogTitle>
              <DialogDescription>
                Set up biometric authentication for enhanced security
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="biometric-type">Biometric Type</Label>
                <Select value={selectedType} onValueChange={(value) => {
                  setSelectedType(value)
                  setShowCamera(value === 'facial')
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select biometric type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fingerprint">Fingerprint</SelectItem>
                    <SelectItem value="facial">Facial Recognition</SelectItem>
                    <SelectItem value="voice">Voice Recognition</SelectItem>
                    <SelectItem value="iris">Iris Scan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="device-id">Device ID (Optional)</Label>
                <Input
                  id="device-id"
                  value={deviceId}
                  onChange={(e) => setDeviceId(e.target.value)}
                  placeholder="Enter device identifier"
                />
              </div>

              {/* Camera Preview for Facial Recognition */}
              {showCamera && (
                <div className="space-y-2">
                  <Label>Camera Preview</Label>
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
                  <p className="text-sm text-muted-foreground">
                    Make sure your face is well-lit and centered in the frame
                  </p>
                </div>
              )}

              {/* Voice Recording Instructions */}
              {selectedType === 'voice' && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Mic className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">Voice Recording</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Click enroll to start recording. Say a passphrase clearly for 3 seconds.
                  </p>
                </div>
              )}

              {/* Fingerprint Instructions */}
              {selectedType === 'fingerprint' && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Fingerprint className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Fingerprint Scanner</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Place your finger on the fingerprint scanner when prompted.
                  </p>
                </div>
              )}

              {/* Iris Instructions */}
              {selectedType === 'iris' && (
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="h-5 w-5 text-purple-600" />
                    <span className="font-medium">Iris Scanner</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Position your eyes close to the iris scanner lens.
                  </p>
                </div>
              )}

              {/* Hidden canvas for image processing */}
              <canvas ref={canvasRef} className="hidden" width="320" height="240" />

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setShowEnrollDialog(false)
                  setShowCamera(false)
                  setSelectedType("")
                  if (cameraStream) {
                    cameraStream.getTracks().forEach(track => track.stop())
                    setCameraStream(null)
                  }
                }}>
                  Cancel
                </Button>
                <Button onClick={enrollBiometric} disabled={enrolling || !selectedType}>
                  {enrolling ? 'Enrolling...' : 'Enroll Biometric'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            Enrolled Biometrics
          </CardTitle>
          <CardDescription>
            Manage your biometric authentication methods
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : biometricRecords.length === 0 ? (
            <div className="text-center py-8">
              <Fingerprint className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No Biometric Authentication</h3>
              <p className="text-muted-foreground mb-4">Enroll biometric authentication for enhanced security</p>
              <Button onClick={() => setShowEnrollDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Enroll First Biometric
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Enrolled</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {biometricRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getBiometricIcon(record.biometric_type)}
                        {getBiometricLabel(record.biometric_type)}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {record.device_id || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={record.is_active ? "secondary" : "outline"}>
                        {record.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {record.last_used_at ?
                        new Date(record.last_used_at).toLocaleDateString() :
                        'Never'
                      }
                    </TableCell>
                    <TableCell>
                      {new Date(record.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleBiometric(record.id, !record.is_active)}
                        >
                          {record.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteBiometric(record.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}