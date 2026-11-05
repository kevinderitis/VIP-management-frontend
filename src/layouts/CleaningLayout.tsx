import { useState } from 'react'
import { LogOut, Menu, X } from 'lucide-react'
import { Outlet } from 'react-router-dom'
import { useCleanerI18n } from '../lib/cleaner-i18n'
import { useAppStore, useSessionUser } from '../store/app-store'

export const CleaningLayout = () => {
  const user = useSessionUser()
  const logout = useAppStore((state) => state.logout)
  const { language, setLanguage, t } = useCleanerI18n()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-shell pb-10">
      <div className="mx-auto max-w-2xl px-4 py-4">
        <header className="relative flex items-center justify-between gap-3 rounded-[24px] bg-white p-4 shadow-soft">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal">{t('cleaning')}</p>
            <p className="truncate font-display text-2xl font-semibold text-ink">{user?.name}</p>
          </div>

          <div className="relative shrink-0">
            <button
              type="button"
              aria-label={t('menu')}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((current) => !current)}
              className="flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-slate-100 text-slate-600 active:scale-[0.98]"
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {menuOpen ? (
              <>
                <button
                  type="button"
                  aria-label={t('menu')}
                  onClick={() => setMenuOpen(false)}
                  className="fixed inset-0 z-30 cursor-default"
                />
                <div className="absolute right-0 z-40 mt-2 w-64 rounded-[24px] border border-slate-100 bg-white p-4 text-left shadow-xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {t('language')}
                  </p>
                  <div className="mt-2 grid gap-2">
                    <button
                      type="button"
                      onClick={() => setLanguage('en')}
                      aria-pressed={language === 'en'}
                      className={`flex min-h-[48px] items-center justify-between rounded-2xl px-4 text-left text-lg font-semibold transition ${
                        language === 'en'
                          ? 'bg-teal/15 text-teal ring-2 ring-teal/40'
                          : 'bg-slate-50 text-slate-600'
                      }`}
                    >
                      {t('english')}
                      {language === 'en' ? <span aria-hidden>✓</span> : null}
                    </button>
                    <button
                      type="button"
                      onClick={() => setLanguage('my')}
                      aria-pressed={language === 'my'}
                      className={`flex min-h-[48px] items-center justify-between rounded-2xl px-4 text-left text-lg font-semibold transition ${
                        language === 'my'
                          ? 'bg-teal/15 text-teal ring-2 ring-teal/40'
                          : 'bg-slate-50 text-slate-600'
                      }`}
                    >
                      {t('burmese')}
                      {language === 'my' ? <span aria-hidden>✓</span> : null}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={logout}
                    className="mt-4 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 text-lg font-semibold text-slate-600"
                  >
                    <LogOut size={20} /> {t('logOut')}
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </header>

        <div className="mt-4">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
