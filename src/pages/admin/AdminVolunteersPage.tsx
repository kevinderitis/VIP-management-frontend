import { useMemo, useState } from 'react'
import { ChevronDown, Coins, Medal, Plus, Search, Trash2, UserCog, UserRoundSearch } from 'lucide-react'
import { Link } from 'react-router-dom'
import { VolunteerEditorModal } from '../../components/admin/VolunteerEditorModal'
import { Button } from '../../components/common/Button'
import { EmptyState } from '../../components/common/EmptyState'
import { Panel } from '../../components/common/Panel'
import { ProgressBar } from '../../components/common/ProgressBar'
import { SectionHeader } from '../../components/common/SectionHeader'
import { useAppStore, useVolunteerUsers } from '../../store/app-store'
import { formatWeekday } from '../../utils/format'
import { User } from '../../types/models'

export const AdminVolunteersPage = () => {
  const volunteers = useVolunteerUsers()
  const createVolunteer = useAppStore((state) => state.createVolunteer)
  const updateVolunteer = useAppStore((state) => state.updateVolunteer)
  const toggleVolunteer = useAppStore((state) => state.toggleVolunteer)
  const deleteVolunteer = useAppStore((state) => state.deleteVolunteer)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedVolunteer, setSelectedVolunteer] = useState<User | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const filteredVolunteers = useMemo(
    () =>
      volunteers.filter((volunteer) => {
        const matchesSearch = volunteer.name.toLowerCase().includes(search.toLowerCase())
        const matchesStatus =
          statusFilter === 'all' ||
          (statusFilter === 'active' ? volunteer.isActive : !volunteer.isActive)
        return matchesSearch && matchesStatus
      }),
    [search, statusFilter, volunteers],
  )

  return (
    <div className="grid gap-6">
      <SectionHeader
        eyebrow="People ops"
        title="Volunteer management"
        description="Status, points, active tasks, and fast editing for the team."
        action={
          <Button
            onClick={() => {
              setSelectedVolunteer(null)
              setModalOpen(true)
            }}
          >
            <Plus size={16} className="mr-2" />
            Create volunteer
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
              placeholder="Search volunteer by name"
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
        {filteredVolunteers.length ? filteredVolunteers.map((volunteer) => (
          <Panel key={volunteer.id} className="overflow-hidden rounded-[24px]">
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink text-sm font-bold text-white">
                    {volunteer.avatar}
                  </div>
                  <p className="truncate font-display text-lg font-semibold text-ink">{volunteer.name}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${volunteer.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {volunteer.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <div className="rounded-2xl bg-slate-100 p-2 text-slate-500 transition group-open:rotate-180">
                    <ChevronDown size={16} />
                  </div>
                </div>
              </summary>

              <div className="border-t border-slate-100 px-5 pb-5 pt-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-ink">{volunteer.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{volunteer.shift} · Off day {formatWeekday(volunteer.offDay ?? 'sunday')}</p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-800">
                    <Coins size={14} />
                    {volunteer.points} points
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Completed</p>
                    <p className="mt-2 font-display text-2xl font-semibold text-ink">{volunteer.completedTasks}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Active tasks</p>
                    <p className="mt-2 font-display text-2xl font-semibold text-ink">{volunteer.activeTaskIds.length}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Badge</p>
                    <p className="mt-2 text-sm font-semibold text-ink">{volunteer.badge ?? 'No badge yet'}</p>
                  </div>
                </div>

                <div className="mt-4 rounded-[24px] bg-mist p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
                    <Medal size={16} />
                    Progress
                  </div>
                  <ProgressBar value={volunteer.points} max={320} className="mt-3" />
                </div>

                <div className="mt-4 flex gap-2">
                  <Link to={`/admin/volunteers/${volunteer.id}`}>
                    <Button variant="secondary" size="sm">
                      <UserRoundSearch size={15} className="mr-2" />
                      View profile
                    </Button>
                  </Link>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSelectedVolunteer(volunteer)
                      setModalOpen(true)
                    }}
                  >
                    <UserCog size={15} className="mr-2" />
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => toggleVolunteer(volunteer.id)}>
                    {volunteer.isActive ? 'Disable' : 'Enable'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (!window.confirm(`Delete ${volunteer.name} permanently?`)) return
                      void deleteVolunteer(volunteer.id)
                    }}
                  >
                    <Trash2 size={15} className="mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </details>
          </Panel>
        )) : (
          <EmptyState
            icon={<UserRoundSearch />}
            title="No volunteers match these filters"
            description="Try another name or status filter to find the volunteer you need."
          />
        )}
      </div>
      <VolunteerEditorModal
        key={`${selectedVolunteer?.id ?? 'new'}-${modalOpen ? 'open' : 'closed'}`}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        volunteer={selectedVolunteer}
        onSubmit={(input) => {
          if (selectedVolunteer) {
            updateVolunteer(selectedVolunteer.id, input)
            return
          }
          createVolunteer(input)
        }}
      />
    </div>
  )
}
