import { useState } from 'react'
import { CalendarRange, CopyPlus, Plus, Trash2 } from 'lucide-react'
import { AssignmentModal } from '../../components/admin/AssignmentModal'
import { GroupEditorModal } from '../../components/admin/GroupEditorModal'
import { Button } from '../../components/common/Button'
import { Panel } from '../../components/common/Panel'
import { SectionHeader } from '../../components/common/SectionHeader'
import { useAppStore } from '../../store/app-store'
import { TaskGroup } from '../../types/models'

export const AdminGroupsPage = () => {
  const groups = useAppStore((state) => state.groups)
  const createGroup = useAppStore((state) => state.createGroup)
  const updateGroup = useAppStore((state) => state.updateGroup)
  const toggleGroup = useAppStore((state) => state.toggleGroup)
  const deleteGroup = useAppStore((state) => state.deleteGroup)
  const assignGroup = useAppStore((state) => state.assignGroup)
  const [editorOpen, setEditorOpen] = useState(false)
  const [assignmentOpen, setAssignmentOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<TaskGroup | null>(null)

  return (
    <div className="grid gap-6">
      <SectionHeader
        eyebrow="Reusable packs"
        title="Task packs and seasons"
        description="Reusable templates ready to duplicate and assign in bulk."
        action={
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => setAssignmentOpen(true)}>
              <CalendarRange size={16} className="mr-2" />
              Assign pack
            </Button>
            <Button
              onClick={() => {
                setSelectedGroup(null)
                setEditorOpen(true)
              }}
            >
              <Plus size={16} className="mr-2" />
              Create pack
            </Button>
          </div>
        }
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {groups.map((group) => (
          <Panel key={group.id} className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {group.isActive ? 'Active' : 'Inactive'}
                </div>
                <h3 className="mt-3 font-display text-2xl font-semibold text-ink">{group.name}</h3>
                <p className="mt-2 text-sm text-slate-500">{group.description}</p>
              </div>
              <button
                onClick={() => toggleGroup(group.id)}
                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-500"
              >
                {group.isActive ? 'Disable' : 'Enable'}
              </button>
            </div>
            <div className="mt-5 grid gap-3">
              {group.templates.map((template) => (
                <div key={template.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink">{template.title}</p>
                      <p className="text-xs text-slate-500">Day {template.dayOffset} · {template.startTime} - {template.endTime}</p>
                    </div>
                    <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-800">
                      {template.points} pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSelectedGroup(group)
                  setEditorOpen(true)
                }}
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  createGroup({
                    name: `${group.name} Copy`,
                    description: group.description,
                    durationDays: group.durationDays,
                    templates: group.templates,
                  })
                }
              >
                <CopyPlus size={15} className="mr-2" />
                Duplicate
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (!window.confirm(`Delete "${group.name}" permanently?`)) return
                  void deleteGroup(group.id)
                }}
              >
                <Trash2 size={15} className="mr-2" />
                Delete
              </Button>
            </div>
          </Panel>
        ))}
      </div>

      <GroupEditorModal
        key={`${selectedGroup?.id ?? 'new'}-${editorOpen ? 'open' : 'closed'}`}
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        group={selectedGroup}
        onSubmit={(input) => {
          if (selectedGroup) {
            updateGroup(selectedGroup.id, input)
            return
          }
          createGroup(input)
        }}
      />
      <AssignmentModal
        open={assignmentOpen}
        onClose={() => setAssignmentOpen(false)}
        groups={groups}
        onSubmit={assignGroup}
      />
    </div>
  )
}
