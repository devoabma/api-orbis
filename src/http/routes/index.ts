import type { FastifyInstance } from 'fastify'
import { createComputer } from '../core/computers/create-computer'
import { deleteComputer } from '../core/computers/delete-computer'
import { getAllComputers } from '../core/computers/get-all-computers'
import { placedMaintenance } from '../core/computers/placed-maintenance'
import { takeMaintenance } from '../core/computers/take-maintenance'
import { updateComputer } from '../core/computers/update-computer'
import { activeEmployee } from '../core/employees/active-employee'
import { authenticate } from '../core/employees/authenticate'
import { changePassword } from '../core/employees/change-password'
import { createAccount } from '../core/employees/create-account'
import { getAllEmployees } from '../core/employees/get-all-employees'
import { getProfile } from '../core/employees/get-profile'
import { inactiveEmployee } from '../core/employees/inactive-employee'
import { linkEmployeeToRooms } from '../core/employees/link-employee-to-rooms'
import { requestPasswordRecover } from '../core/employees/request-password-recover'
import { resetPassword } from '../core/employees/reset-password'
import { unlinkEmployeeFromRooms } from '../core/employees/unlink-employee-from-rooms'
import { updateAvatar } from '../core/employees/update-avatar'
import { updateEmployee } from '../core/employees/update-employee'
import { closeSessionByLawyer } from '../core/lawyers/close-session-by-lawyer'
import { getAllReleases } from '../core/lawyers/get-all-releases'
import { releaseComputer } from '../core/lawyers/release-computer'
import { activeRoom } from '../core/rooms/active-room'
import { createRoom } from '../core/rooms/create-room'
import { getAllRooms } from '../core/rooms/get-all-rooms'
import { inactiveRoom } from '../core/rooms/inactive-room'
import { updateRoom } from '../core/rooms/update-room'

export async function appRoutes(app: FastifyInstance) {
  app.register(createAccount, { prefix: '/employees' })
  app.register(authenticate, { prefix: '/employees' })
  app.register(getProfile, { prefix: '/employees' })
  app.register(changePassword, { prefix: '/employees' })
  app.register(requestPasswordRecover, { prefix: '/employees' })
  app.register(resetPassword, { prefix: '/employees' })
  app.register(getAllEmployees, { prefix: '/employees' })
  app.register(inactiveEmployee, { prefix: '/employees' })
  app.register(activeEmployee, { prefix: '/employees' })
  app.register(updateEmployee, { prefix: '/employees' })
  app.register(updateAvatar, { prefix: '/employees' })
  app.register(linkEmployeeToRooms, { prefix: '/employees' })
  app.register(unlinkEmployeeFromRooms, { prefix: '/employees' })

  app.register(createRoom, { prefix: '/rooms' })
  app.register(getAllRooms, { prefix: '/rooms' })
  app.register(updateRoom, { prefix: '/rooms' })
  app.register(inactiveRoom, { prefix: '/rooms' })
  app.register(activeRoom, { prefix: '/rooms' })

  app.register(createComputer, { prefix: '/computers' })
  app.register(getAllComputers, { prefix: '/computers' })
  app.register(updateComputer, { prefix: '/computers' })
  app.register(deleteComputer, { prefix: '/computers' })
  app.register(placedMaintenance, { prefix: '/computers' })
  app.register(takeMaintenance, { prefix: '/computers' })

  app.register(releaseComputer, { prefix: '/lawyers' })
  app.register(closeSessionByLawyer, { prefix: '/lawyers' })
  app.register(getAllReleases, { prefix: '/lawyers' })
}
