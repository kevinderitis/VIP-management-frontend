import { useEffect, useMemo, useState } from 'react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

const isStandaloneMode = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)

const getPlatform = () => {
  const userAgent = window.navigator.userAgent.toLowerCase()
  const isIPhone = /iphone|ipad|ipod/.test(userAgent)
  const isAndroid = /android/.test(userAgent)
  return {
    isMobile: isIPhone || isAndroid,
    isIOS: isIPhone,
    isAndroid,
  }
}

export const usePwaInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    setIsInstalled(isStandaloneMode())

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
    }

    const handleInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  const platform = useMemo(getPlatform, [])

  const canInstallOnAndroid = platform.isAndroid && !isInstalled && Boolean(deferredPrompt)
  const shouldShowIOSInstructions = platform.isIOS && !isInstalled
  const shouldShowInstallCard = platform.isMobile && !isInstalled && (canInstallOnAndroid || shouldShowIOSInstructions)

  const install = async () => {
    if (!deferredPrompt) return 'dismissed'
    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    if (choice.outcome === 'accepted') {
      setDeferredPrompt(null)
    }
    return choice.outcome
  }

  return {
    isInstalled,
    isMobile: platform.isMobile,
    isIOS: platform.isIOS,
    isAndroid: platform.isAndroid,
    canInstallOnAndroid,
    shouldShowIOSInstructions,
    shouldShowInstallCard,
    install,
  }
}
