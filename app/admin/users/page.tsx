import { getAdminUsers } from "@/lib/api/admin"
import UsersClient from "./users-client"

export default async function AdminUsersPage() {
  const initialUsers = await getAdminUsers()

  return <UsersClient initialUsers={initialUsers} />
}
