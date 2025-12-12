import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import AdminContent from "@/components/admin-content"

export default async function AdminPage() {
  const cookieStore = await cookies()
  const isAuthenticated = cookieStore.get("admin-auth")?.value === "true"

  if (!isAuthenticated) {
    redirect("/admin/login")
  }

  return <AdminContent />
}
