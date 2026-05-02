import { useEffect, useRef, useState } from 'react'
import { Keyboard, X } from 'lucide-react'
import { Button } from '../common/Button'
import { checkinsApi } from '../../lib/checkins'

interface PassportCameraCaptureProps {
  token: string
  onCapture: (file: File) => void
  onCancel: () => void
  onManualEntry: () => void
}

export const PassportCameraCapture = ({
  token,
  onCapture,
  onCancel,
  onManualEntry,
}: PassportCameraCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const guideRef = useRef<HTMLDivElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scanStatus, setScanStatus] = useState('Point the camera at the MRZ area')
  const [isAutoScanning, setIsAutoScanning] = useState(false)
  const autoScanInFlightRef = useRef(false)
  const autoScanStoppedRef = useRef(false)
  const successStreakRef = useRef(0)

  useEffect(() => {
    void startCamera()
    return () => {
      autoScanStoppedRef.current = true
      stopCamera()
    }
  }, [])

  useEffect(() => {
    if (!stream || error) return

    autoScanStoppedRef.current = false
    setScanStatus('Looking for a readable MRZ...')

    const intervalId = window.setInterval(() => {
      void runAutoScan()
    }, 1200)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [stream, error])

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
      setError(null)
    } catch (cameraError) {
      console.error('Camera error:', cameraError)
      setError('Could not access the camera. Please check permissions.')
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
    }
  }

  const createGuideCropFile = (): Promise<File | null> =>
    new Promise((resolve) => {
      if (!videoRef.current || !canvasRef.current || !guideRef.current) {
        resolve(null)
        return
      }

      const video = videoRef.current
      const canvas = canvasRef.current
      const guide = guideRef.current
      const context = canvas.getContext('2d')

      if (!context || !video.videoWidth || !video.videoHeight) {
        resolve(null)
        return
      }

      const videoWidth = video.videoWidth
      const videoHeight = video.videoHeight
      const videoRect = video.getBoundingClientRect()
      const guideRect = guide.getBoundingClientRect()
      const scaleX = videoWidth / videoRect.width
      const scaleY = videoHeight / videoRect.height
      const cropX = Math.max(0, Math.round((guideRect.left - videoRect.left) * scaleX))
      const cropY = Math.max(0, Math.round((guideRect.top - videoRect.top) * scaleY))
      const cropWidth = Math.min(
        Math.round(guideRect.width * scaleX),
        videoWidth - cropX,
      )
      const cropHeight = Math.min(
        Math.round(guideRect.height * scaleY),
        videoHeight - cropY,
      )
      const verticalMargin = Math.max(2, Math.round(cropHeight * 0.03))
      const adjustedCropY = Math.max(0, cropY - verticalMargin)
      const adjustedCropHeight = Math.min(
        cropHeight + verticalMargin * 2,
        videoHeight - adjustedCropY,
      )

      canvas.width = cropWidth
      canvas.height = adjustedCropHeight

      context.drawImage(
        video,
        cropX,
        adjustedCropY,
        cropWidth,
        adjustedCropHeight,
        0,
        0,
        cropWidth,
        adjustedCropHeight,
      )

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(null)
            return
          }

          resolve(new File([blob], 'passport-mrz.jpg', { type: 'image/jpeg' }))
        },
        'image/jpeg',
        0.92,
      )
    })

  const isStrongMrzDetection = async (file: File) => {
    const formData = new FormData()
    formData.append('passportImageMrz', file)
    const result = await checkinsApi.scanMrz(token, formData)

    if (!result.detected || !result.guest) return false

    return Boolean(
      result.guest.passportNo &&
        result.guest.firstName &&
        result.guest.lastName &&
        result.guest.nationality &&
        result.guest.birthDate,
    )
  }

  const runAutoScan = async () => {
    if (autoScanStoppedRef.current || autoScanInFlightRef.current || !stream) return

    autoScanInFlightRef.current = true
    setIsAutoScanning(true)

    try {
      const mrzFile = await createGuideCropFile()
      if (!mrzFile || autoScanStoppedRef.current) return

      const strong = await isStrongMrzDetection(mrzFile)

      if (strong) {
        successStreakRef.current += 1
        setScanStatus(
          successStreakRef.current >= 2
            ? 'MRZ detected. Processing...'
            : 'Good read found. Confirming...',
        )
      } else {
        successStreakRef.current = 0
        setScanStatus('Adjust slightly to improve focus...')
      }

      if (successStreakRef.current >= 2) {
        autoScanStoppedRef.current = true
        stopCamera()
        onCapture(mrzFile)
      }
    } catch (scanError) {
      console.error('Auto MRZ scan error:', scanError)
      successStreakRef.current = 0
      setScanStatus('Trying again...')
    } finally {
      autoScanInFlightRef.current = false
      setIsAutoScanning(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-black">
      <div className="flex items-center justify-between bg-slate-950 px-4 pb-4 pt-[calc(env(safe-area-inset-top)+1rem)] text-white">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-white/60">Passport scanner</p>
          <h3 className="mt-1 font-display text-xl font-semibold">Capture passport</h3>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10"
        >
          <X size={18} />
        </button>
      </div>

      {error ? (
        <div className="px-4 py-4 text-sm text-red-300">{error}</div>
      ) : null}

      <div className="relative flex-1 overflow-hidden">
        <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
        <div className="absolute inset-x-0 bottom-28 flex justify-center px-4 pb-2 sm:bottom-32">
          <div className="w-full max-w-md">
            <div className="absolute -top-14 left-0 right-0">
              <p className="text-center text-xs font-medium text-white drop-shadow-lg sm:text-sm">
                Align MRZ zone with guide
                <br />
                <span className="text-[10px] text-white/90 sm:text-xs">
                  {scanStatus}
                  {isAutoScanning ? ' (scanning...)' : ''}
                </span>
              </p>
            </div>
            <div
              ref={guideRef}
              className="relative rounded-lg border-4 border-dashed border-green-400"
              style={{ aspectRatio: '3.5/1' }}
            >
              <div className="absolute left-0 right-0 top-1/2 h-0 -translate-y-1/2 border-t-2 border-dashed border-green-400/60" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 bg-slate-950 p-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
        <Button
          type="button"
          variant="secondary"
          onClick={onManualEntry}
          className="border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white"
        >
          <Keyboard size={16} className="mr-2" />
          Manual entry
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          className="border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white"
        >
          Cancel
        </Button>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
