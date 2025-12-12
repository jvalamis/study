"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { uploadTestAction } from "@/app/admin/actions"
import TestBuilder from "@/components/test-builder"

export default function AdminContent() {
  const [mode, setMode] = useState<"builder" | "upload">("builder")
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const router = useRouter()

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      await processFile(file)
    }
  }

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await processFile(file)
    }
  }

  const processFile = async (file: File) => {
    if (!file.name.endsWith(".json")) {
      setMessage({ type: "error", text: "Please upload a JSON file" })
      return
    }

    setUploading(true)
    setMessage(null)

    try {
      const text = await file.text()
      const json = JSON.parse(text)

      const formData = new FormData()
      formData.append("testData", JSON.stringify(json))

      const result = await uploadTestAction(formData)

      if (result.error) {
        setMessage({ type: "error", text: result.error })
      } else {
        setMessage({ type: "success", text: "Test uploaded successfully!" })
        setTimeout(() => router.refresh(), 1000)
      }
    } catch (error) {
      setMessage({ type: "error", text: "Invalid JSON file" })
    } finally {
      setUploading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-5xl font-black text-primary mb-2 tracking-tight">🦖 Test Command Center</h1>
          <p className="text-lg text-muted-foreground">Create awesome tests for practice!</p>
        </div>

        <div className="flex gap-3 mb-6">
          <Button
            onClick={() => setMode("builder")}
            variant={mode === "builder" ? "default" : "outline"}
            size="lg"
            className="flex-1"
          >
            🎮 Build Test
          </Button>
          <Button
            onClick={() => setMode("upload")}
            variant={mode === "upload" ? "default" : "outline"}
            size="lg"
            className="flex-1"
          >
            📁 Upload JSON
          </Button>
        </div>

        {mode === "builder" ? (
          <TestBuilder />
        ) : (
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Upload Test</CardTitle>
              <CardDescription>Drag and drop a JSON file or click to browse</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                  dragActive ? "border-primary bg-primary/10" : "border-border"
                }`}
              >
                <input
                  type="file"
                  accept=".json"
                  onChange={handleChange}
                  className="hidden"
                  id="file-upload"
                  disabled={uploading}
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="space-y-4">
                    <div className="text-4xl">📁</div>
                    <div>
                      <p className="text-lg font-medium">{uploading ? "Uploading..." : "Drop JSON file here"}</p>
                      <p className="text-sm text-muted-foreground">or click to browse</p>
                    </div>
                  </div>
                </label>
              </div>

              {message && (
                <div
                  className={`mt-4 p-3 rounded ${
                    message.type === "success"
                      ? "bg-secondary/20 text-secondary-foreground"
                      : "bg-destructive/20 text-destructive-foreground"
                  }`}
                >
                  {message.text}
                </div>
              )}

              <div className="mt-6 p-4 bg-muted rounded text-sm">
                <p className="font-medium mb-2">Expected JSON format:</p>
                <pre className="text-xs overflow-x-auto">
                  {`{
  "title": "Math Quiz",
  "subject": "Mathematics",
  "grade": "5",
  "questions": [
    {
      "type": "multiple_choice",
      "prompt": "What is 2 + 2?",
      "choices": ["3", "4", "5"],
      "answer": "4"
    }
  ]
}`}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}

        <Button variant="outline" className="mt-6 bg-transparent" onClick={() => router.push("/")}>
          ← Back to Tests
        </Button>
      </div>
    </main>
  )
}
