import { useEffect } from 'react'
import { useAppStore } from '../store/app-store'

export const useRealtimeSimulation = () => {
  const runScheduler = useAppStore((state) => state.runScheduler)

  useEffect(() => {
    void runScheduler()
    const interval = window.setInterval(() => {
      void runScheduler()
    }, 12000)

    return () => window.clearInterval(interval)
  }, [runScheduler])
}
