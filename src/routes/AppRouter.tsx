import { ReactElement } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AdminLayout } from '../layouts/AdminLayout'
import { CleaningLayout } from '../layouts/CleaningLayout'
import { VolunteerLayout } from '../layouts/VolunteerLayout'
import { AdminCleanerDetailPage } from '../pages/admin/AdminCleanerDetailPage'
import { AdminCleanersPage } from '../pages/admin/AdminCleanersPage'
import { AdminCheckInPage } from '../pages/admin/AdminCheckInPage'
import { AdminCleaningTasksPage } from '../pages/admin/AdminCleaningTasksPage'
import { AdminAssignmentsPage } from '../pages/admin/AdminAssignmentsPage'
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage'
import { AdminRewardsPage } from '../pages/admin/AdminRewardsPage'
import { AdminRoutineTasksPage } from '../pages/admin/AdminRoutineTasksPage'
import { AdminTasksPage } from '../pages/admin/AdminTasksPage'
import { AdminTm30Page } from '../pages/admin/AdminTm30Page'
import { AdminVolunteerDetailPage } from '../pages/admin/AdminVolunteerDetailPage'
import { AdminVolunteersPage } from '../pages/admin/AdminVolunteersPage'
import { LoginPage } from '../pages/auth/LoginPage'
import { CleaningDashboardPage } from '../pages/cleaning/CleaningDashboardPage'
import { CleaningMyTasksPage } from '../pages/cleaning/CleaningMyTasksPage'
import { CleaningProfilePage } from '../pages/cleaning/CleaningProfilePage'
import { CleaningTasksPage } from '../pages/cleaning/CleaningTasksPage'
import { VolunteerDashboardPage } from '../pages/volunteer/VolunteerDashboardPage'
import { VolunteerMyTasksPage } from '../pages/volunteer/VolunteerMyTasksPage'
import { VolunteerProfilePage } from '../pages/volunteer/VolunteerProfilePage'
import { VolunteerRewardsPage } from '../pages/volunteer/VolunteerRewardsPage'
import { VolunteerTasksPage } from '../pages/volunteer/VolunteerTasksPage'
import { useSessionUser } from '../store/app-store'
import { UserRole } from '../types/models'
import { roleHomePath } from '../utils/constants'

const RequireRole = ({
  role,
  children,
}: {
  role: UserRole
  children: ReactElement
}) => {
  const user = useSessionUser()

  if (!user) return <Navigate to="/" replace />
  if (user.role !== role) return <Navigate to={roleHomePath[user.role]} replace />
  return children
}

export const AppRouter = () => {
  const user = useSessionUser()

  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route path="/" element={<LoginPage />} />

        <Route
          path="/admin"
          element={
            <RequireRole role="admin">
              <AdminLayout />
            </RequireRole>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="tasks" element={<AdminTasksPage />} />
          <Route path="standard-tasks" element={<AdminRoutineTasksPage />} />
          <Route path="assignments" element={<AdminAssignmentsPage />} />
          <Route path="check-in" element={<AdminCheckInPage />} />
          <Route path="tm30" element={<AdminTm30Page />} />
          <Route path="volunteers" element={<AdminVolunteersPage />} />
          <Route path="volunteers/:volunteerId" element={<AdminVolunteerDetailPage />} />
          <Route path="cleaners" element={<AdminCleanersPage />} />
          <Route path="cleaners/:cleanerId" element={<AdminCleanerDetailPage />} />
          <Route path="cleaning-tasks" element={<AdminCleaningTasksPage />} />
          <Route path="rewards" element={<AdminRewardsPage />} />
        </Route>

        <Route
          path="/app"
          element={
            <RequireRole role="volunteer">
              <VolunteerLayout />
            </RequireRole>
          }
        >
          <Route index element={<VolunteerDashboardPage />} />
          <Route path="tasks" element={<VolunteerTasksPage />} />
          <Route path="my-tasks" element={<VolunteerMyTasksPage />} />
          <Route path="rewards" element={<VolunteerRewardsPage />} />
          <Route path="profile" element={<VolunteerProfilePage />} />
        </Route>

        <Route
          path="/cleaning"
          element={
            <RequireRole role="cleaner">
              <CleaningLayout />
            </RequireRole>
          }
        >
          <Route index element={<CleaningDashboardPage />} />
          <Route path="tasks" element={<CleaningTasksPage />} />
          <Route path="my-tasks" element={<CleaningMyTasksPage />} />
          <Route path="profile" element={<CleaningProfilePage />} />
        </Route>

        <Route
          path="*"
          element={<Navigate to={user ? roleHomePath[user.role] : '/'} replace />}
        />
      </Routes>
    </BrowserRouter>
  )
}
