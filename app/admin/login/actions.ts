"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function loginAction(formData: FormData) {
  const password = formData.get("password") as string
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123"

  if (password === adminPassword) {
    const cookieStore = await cookies()
    cookieStore.set("admin-auth", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24, // 24 hours
    })
    redirect("/admin")
  }

  return { error: "Invalid password" }
}
