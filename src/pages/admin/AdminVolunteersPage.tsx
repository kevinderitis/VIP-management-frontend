import { useMemo, useState } from 'react'
import { BellRing, ChevronDown, Coins, Medal, Plus, Search, Trash2, UserCog, UserRoundSearch } from 'lucide-react'
import { Link } from 'react-router-dom'
import { VolunteerEditorModal } from '../../components/admin/VolunteerEditorModal'
import { AdminToolbar } from '../../components/common/AdminToolbar'
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
  const callVolunteersToOffice = useAppStore((state) => state.callVolunteersToOffice)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedVolunteer, setSelectedVolunteer] = useState<User | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [openManageId, setOpenManageId] = useState<string | null>(null)
  const [selectedVolunteerIds, setSelectedVolunteerIds] = useState<string[]>([])
  const [mobileSelectionMode, setMobileSelectionMode] = useState(false)

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

  const toggleSelection = (volunteerId: string) => {
    setSelectedVolunteerIds((current) =>
      current.includes(volunteerId)
        ? current.filter((value) => value !== volunteerId)
        : [...current, volunteerId],
    )
  }

  const handleOfficeCall = async (volunteerIds: string[]) => {
    if (!volunteerIds.length) return
    await callVolunteersToOffice(volunteerIds)
    setSelectedVolunteerIds((current) => current.filter((id) => !volunteerIds.includes(id)))
    setMobileSelectionMode(false)
  }

  return (
    <div className="grid gap-6">
      <SectionHeader
        eyebrow="People ops"
        title="Volunteer management"
        description="Status, points, active tasks, and fast editing for the team."
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              className="sm:hidden"
              onClick={() => {
                setMobileSelectionMode((current) => {
                  const next = !current
                  if (!next) {
                    setSelectedVolunteerIds([])
                  }
                  return next
                })
              }}
            >
              <BellRing size={16} className="mr-2" />
              {mobileSelectionMode ? 'Cancel call mode' : 'Call selected'}
            </Button>
            <Button
              variant="secondary"
              className="hidden sm:inline-flex"
              disabled={selectedVolunteerIds.length === 0}
              onClick={() => void handleOfficeCall(selectedVolunteerIds)}
            >
              <BellRing size={16} className="mr-2" />
              {selectedVolunteerIds.length > 0 ? `Call selected (${selectedVolunteerIds.length})` : 'Call selected'}
            </Button>
            <Button
              onClick={() => {
                setSelectedVolunteer(null)
                setModalOpen(true)
              }}
            >
              <Plus size={16} className="mr-2" />
              Create volunteer
            </Button>
          </div>
        }
      />
      <AdminToolbar>
      <Panel className="admin-sticky-toolbar p-4">
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
      </AdminToolbar>
      <div className={`grid gap-3 ${mobileSelectionMode && selectedVolunteerIds.length > 0 ? 'pb-28 sm:pb-0' : ''}`}>
        {filteredVolunteers.length ? filteredVolunteers.map((volunteer) => (
          <Panel key={volunteer.id} className="overflow-hidden rounded-[24px]">
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4">
                <div className="flex min-w-0 items-center gap-4">
                  {mobileSelectionMode ? (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        toggleSelection(volunteer.id)
                      }}
                      className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border sm:hidden ${
                        selectedVolunteerIds.includes(volunteer.id)
                          ? 'border-teal bg-teal text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                      aria-label={`Select ${volunteer.name}`}
                    >
                      {selectedVolunteerIds.includes(volunteer.id) ? '✓' : ''}
                    </button>
                  ) : null}
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

                <div className="mt-4 sm:hidden">
                  <div className="grid grid-cols-2 gap-2">
                    <Link to={`/admin/volunteers/${volunteer.id}`}>
                      <Button variant="secondary" size="sm" className="w-full">
                        <UserRoundSearch size={15} className="mr-2" />
                        Profile
                      </Button>
                    </Link>
                    <div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="w-full"
                        onClick={() => setOpenManageId(openManageId === volunteer.id ? null : volunteer.id)}
                      >
                        <UserCog size={15} className="mr-2" />
                        Manage
                      </Button>
                      {openManageId === volunteer.id ? (
                        <div className="mt-2 grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            setSelectedVolunteer(volunteer)
                            setModalOpen(true)
                          }}
                        >
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" className="w-full" onClick={() => toggleVolunteer(volunteer.id)}>
                          {volunteer.isActive ? 'Disable' : 'Enable'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            if (!window.confirm(`Delete ${volunteer.name} permanently?`)) return
                            void deleteVolunteer(volunteer.id)
                          }}
                        >
                          <Trash2 size={15} className="mr-2" />
                          Delete
                        </Button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full"
                      onClick={() => void handleOfficeCall([volunteer.id])}
                    >
                      <BellRing size={15} className="mr-2" />
                      Call to office
                    </Button>
                  </div>
                </div>

                <div className="mt-4 hidden flex-wrap gap-2 sm:flex">
                  <Link to={`/admin/volunteers/${volunteer.id}`}>
                    <Button variant="secondary" size="sm">
                      <UserRoundSearch size={15} className="mr-2" />
                      Profile
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
                  <Button variant="secondary" size="sm" onClick={() => void handleOfficeCall([volunteer.id])}>
                    <BellRing size={15} className="mr-2" />
                    Call to office
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

      {mobileSelectionMode && selectedVolunteerIds.length > 0 ? (
        <div className="fixed inset-x-4 bottom-4 z-30 sm:hidden">
          <div className="rounded-[28px] border border-white/70 bg-white/95 p-3 shadow-soft backdrop-blur">
            <Button className="w-full justify-center" onClick={() => void handleOfficeCall(selectedVolunteerIds)}>
              <BellRing size={16} className="mr-2" />
              {selectedVolunteerIds.length === 1
                ? 'Call selected volunteer'
                : `Call ${selectedVolunteerIds.length} volunteers`}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
