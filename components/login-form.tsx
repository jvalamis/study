"use client"

import { useState } from "react"
import { loginAction } from "@/app/admin/login/actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function LoginForm() {
  const [error, setError] = useState("")

  async function handleSubmit(formData: FormData) {
    const result = await loginAction(formData)
    if (result?.error) {
      setError(result.error)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Admin Login</CardTitle>
        <CardDescription>Enter the admin password to continue</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div>
            <Input type="password" name="password" placeholder="Admin password" required className="w-full" />
            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
          </div>
          <Button type="submit" className="w-full">
            Login
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
