import { useMemo, useState } from 'react'
import { ChevronDown, Plus, Search, Trash2, UserCog, UserRoundSearch } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CleanerEditorModal } from '../../components/admin/CleanerEditorModal'
import { Button } from '../../components/common/Button'
import { EmptyState } from '../../components/common/EmptyState'
import { Panel } from '../../components/common/Panel'
import { SectionHeader } from '../../components/common/SectionHeader'
import { useAppStore, useCleanerUsers } from '../../store/app-store'
import { User } from '../../types/models'

export const AdminCleanersPage = () => {
  const cleaners = useCleanerUsers()
  const createCleaner = useAppStore((state) => state.createCleaner)
  const updateCleaner = useAppStore((state) => state.updateCleaner)
  const toggleCleaner = useAppStore((state) => state.toggleCleaner)
  const deleteCleaner = useAppStore((state) => state.deleteCleaner)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedCleaner, setSelectedCleaner] = useState<User | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const filtered = useMemo(
    () =>
      cleaners.filter((cleaner) => {
        const matchesSearch = cleaner.name.toLowerCase().includes(search.toLowerCase())
        const matchesStatus =
          statusFilter === 'all' || (statusFilter === 'active' ? cleaner.isActive : !cleaner.isActive)
        return matchesSearch && matchesStatus
      }),
    [cleaners, search, statusFilter],
  )

  return (
    <div className="grid gap-6">
      <SectionHeader
        eyebrow="Cleaning service"
        title="Cleaning staff"
        description="Manage cleaners separately from volunteers, with their own access credentials and task history."
        action={
          <Button
            onClick={() => {
              setSelectedCleaner(null)
              setModalOpen(true)
            }}
          >
            <Plus size={16} className="mr-2" />
            Create cleaner
          </Button>
        }
      />
      <Panel className="p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
          <label className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search cleaner by name"
              className="w-full rounded-2xl border-slate-200 pl-11"
            />
          </label>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as 'all' | 'active' | 'inactive')}
            className="rounded-2xl border-slate-200"
          >
            <option value="all">All statuses</option>
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
          </select>
        </div>
      </Panel>
      <div className="grid gap-3">
        {filtered.length ? (
          filtered.map((cleaner) => (
            <Panel key={cleaner.id} className="overflow-hidden rounded-[24px]">
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink text-sm font-bold text-white">
                      {cleaner.avatar}
                    </div>
                    <p className="truncate font-display text-lg font-semibold text-ink">{cleaner.name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${cleaner.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {cleaner.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <div className="rounded-2xl bg-slate-100 p-2 text-slate-500 transition group-open:rotate-180">
                      <ChevronDown size={16} />
                    </div>
                  </div>
                </summary>
                <div className="border-t border-slate-100 px-5 pb-5 pt-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-ink">{cleaner.title}</p>
                      <p className="mt-1 text-sm text-slate-500">{cleaner.shift}</p>
                    </div>
                    <div className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700">
                      {cleaner.completedTasks} completed tasks
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Link to={`/admin/cleaners/${cleaner.id}`}>
                      <Button variant="secondary" size="sm">
                        <UserRoundSearch size={15} className="mr-2" />
                        View profile
                      </Button>
                    </Link>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setSelectedCleaner(cleaner)
                        setModalOpen(true)
                      }}
                    >
                      <UserCog size={15} className="mr-2" />
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => toggleCleaner(cleaner.id)}>
                      {cleaner.isActive ? 'Disable' : 'Enable'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (!window.confirm(`Delete ${cleaner.name} permanently?`)) return
                        void deleteCleaner(cleaner.id)
                      }}
                    >
                      <Trash2 size={15} className="mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </details>
            </Panel>
          ))
        ) : (
          <EmptyState
            icon={<UserRoundSearch />}
            title="No cleaners match these filters"
            description="Try another search or status filter."
          />
        )}
      </div>
      <CleanerEditorModal
        key={`${selectedCleaner?.id ?? 'new'}-${modalOpen ? 'open' : 'closed'}`}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        cleaner={selectedCleaner}
        onSubmit={(input) => {
          if (selectedCleaner) {
            void updateCleaner(selectedCleaner.id, input)
            return
          }
          void createCleaner(input)
        }}
      />
    </div>
  )
}
