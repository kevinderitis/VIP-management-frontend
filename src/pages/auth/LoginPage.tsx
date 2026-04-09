import { FormEvent, useState } from 'react'
import { ArrowRight, Download, KeyRound, ShieldCheck, Sparkles, Trophy, UserRound } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import { Button } from '../../components/common/Button'
import { usePwaInstallPrompt } from '../../hooks/usePwaInstallPrompt'
import { useAppStore, useSessionUser } from '../../store/app-store'
import { roleHomePath } from '../../utils/constants'

export const LoginPage = () => {
  const login = useAppStore((state) => state.login)
  const sessionUser = useSessionUser()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [installMessage, setInstallMessage] = useState('')
  const pwaInstall = usePwaInstallPrompt()

  if (sessionUser) {
    return <Navigate to={roleHomePath[sessionUser.role]} replace />
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await login(identifier, password)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not sign in.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAndroidInstall = async () => {
    const outcome = await pwaInstall.install()
    setInstallMessage(outcome === 'accepted' ? 'App installation started.' : 'Installation was dismissed.')
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(245,158,11,0.12),_transparent_28%),linear-gradient(180deg,_#f8fbfc_0%,_#edf4f7_100%)] px-4 py-5 sm:py-8 lg:px-6 lg:py-10">
      <div className="mx-auto grid min-h-[calc(100vh-2.5rem)] w-full max-w-[1240px] items-stretch gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(420px,520px)]">
        <section className="relative hidden overflow-hidden rounded-[38px] bg-admin px-7 py-8 text-white shadow-soft sm:px-10 sm:py-10 lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.16),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(45,212,191,0.18),_transparent_26%)]" />
          <div className="relative">
            <p className="text-xs uppercase tracking-[0.34em] text-white/60">VolunteerFlow Hostel</p>
            <h1 className="mt-5 max-w-xl font-display text-4xl font-semibold leading-tight sm:text-5xl">
              Sign in to your hostel workspace.
            </h1>
            <p className="mt-4 max-w-xl text-base text-white/75">
              One place for volunteer schedules, live task coordination, points, and rewards with a calm,
              practical experience on every device.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[28px] border border-white/10 bg-white/10 p-5 backdrop-blur">
                <ShieldCheck className="text-lagoon" />
                <p className="mt-4 font-display text-xl font-semibold">Structured operations</p>
                <p className="mt-2 text-sm text-white/70">
                  Publish tasks on time and keep volunteer work organized shift by shift.
                </p>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-white/10 p-5 backdrop-blur">
                <Trophy className="text-amber-300" />
                <p className="mt-4 font-display text-xl font-semibold">Motivating progress</p>
                <p className="mt-2 text-sm text-white/70">
                  Points, rewards, and history stay visible without making the app feel heavy.
                </p>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-white/10 p-5 backdrop-blur">
                <Sparkles className="text-sky-200" />
                <p className="mt-4 font-display text-xl font-semibold">Fast for volunteers</p>
                <p className="mt-2 text-sm text-white/70">
                  A mobile-first flow that makes it easy to check today’s work and act quickly.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center">
          <div className="w-full rounded-[32px] border border-white/70 bg-white/92 p-6 shadow-soft backdrop-blur sm:p-8 lg:rounded-[38px] lg:p-8">
            <div className="mx-auto max-w-md">
              <p className="text-xs uppercase tracking-[0.28em] text-teal">Secure access</p>
              <h2 className="mt-3 font-display text-3xl font-semibold text-ink sm:text-4xl">
                Welcome back
              </h2>
              <p className="mt-3 text-sm text-slate-500">
                Sign in with the username and password provided by the hostel admin.
              </p>
              <div className="mt-4 rounded-[22px] bg-mist px-4 py-3 text-sm text-slate-600 lg:hidden">
                Volunteers use this login to enter their mobile workspace quickly and safely.
              </div>

              {pwaInstall.shouldShowInstallCard ? (
                <div className="mt-5 rounded-[24px] border border-teal/15 bg-[linear-gradient(180deg,_#f3fbfb_0%,_#eef7f8_100%)] px-4 py-4 text-sm text-slate-600 lg:hidden">
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl bg-white p-2 text-teal shadow-soft">
                      <Download size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-ink">Install the mobile app</p>
                      <p className="mt-1">
                        This is for volunteers and cleaning staff. Admins should continue using the web backoffice.
                      </p>

                      {pwaInstall.canInstallOnAndroid ? (
                        <div className="mt-3 grid gap-2">
                          <Button type="button" variant="secondary" onClick={() => void handleAndroidInstall()}>
                            Install on Android
                          </Button>
                          <p className="text-xs text-slate-500">
                            Use the installed app for faster access, notifications, and a full-screen mobile experience.
                          </p>
                        </div>
                      ) : null}

                      {pwaInstall.shouldShowIOSInstructions ? (
                        <div className="mt-3 rounded-[20px] bg-white/80 px-4 py-3">
                          <p className="font-medium text-ink">Install on iPhone</p>
                          <p className="mt-1 text-xs text-slate-500">
                            In Safari, tap the Share button and choose <span className="font-semibold text-ink">Add to Home Screen</span>.
                          </p>
                        </div>
                      ) : null}

                      {installMessage ? <p className="mt-3 text-xs font-medium text-teal">{installMessage}</p> : null}
                    </div>
                  </div>
                </div>
              ) : null}

              <form onSubmit={handleSubmit} className="mt-8 grid gap-4">
                <label className="grid gap-2 text-sm font-medium text-ink">
                  Username
                  <div className="flex items-center gap-3 rounded-[24px] border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <UserRound size={18} className="text-slate-400" />
                    <input
                      required
                      value={identifier}
                      onChange={(event) => setIdentifier(event.target.value)}
                      placeholder="Enter your username"
                      className="w-full border-0 bg-transparent p-0 text-base text-ink placeholder:text-slate-400 focus:outline-none focus:ring-0"
                    />
                  </div>
                </label>

                <label className="grid gap-2 text-sm font-medium text-ink">
                  Password
                  <div className="flex items-center gap-3 rounded-[24px] border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <KeyRound size={18} className="text-slate-400" />
                    <input
                      required
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Enter your password"
                      className="w-full border-0 bg-transparent p-0 text-base text-ink placeholder:text-slate-400 focus:outline-none focus:ring-0"
                    />
                  </div>
                </label>

                {error ? (
                  <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                    {error}
                  </div>
                ) : null}

                <Button type="submit" disabled={isSubmitting} className="mt-2 w-full justify-center">
                  {isSubmitting ? 'Signing in...' : 'Sign in'}
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              </form>

              <div className="mt-6 hidden rounded-[24px] bg-mist px-4 py-4 text-sm text-slate-600 lg:block">
                Volunteers and admins access the same platform with different views based on their role.
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
