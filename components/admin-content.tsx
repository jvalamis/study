"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { uploadTestAction, deleteTestAction, getAllTestsAction, getTestResultsCountAction } from "@/app/admin/actions"
import TestBuilder from "@/components/test-builder"
import { X, Pencil, Trash2 } from "lucide-react"

interface Test {
  id: string
  title: string
  subject?: string
  grade?: string
  questions: Array<{
    type: "multiple_choice" | "short_answer" | "numeric" | "spelling"
    prompt: string
    choices?: string[]
    answer: string | number
  }>
}

export default function AdminContent() {
  const [mode, setMode] = useState<"builder" | "upload" | "manage">("builder")
  const [editTest, setEditTest] = useState<Test | null>(null)
  const [tests, setTests] = useState<Test[]>([])
  const [testResultsCounts, setTestResultsCounts] = useState<Record<string, number>>({})
  const [loadingTests, setLoadingTests] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (mode === "manage") {
      loadTests()
    }
  }, [mode])

  const loadTests = async () => {
    setLoadingTests(true)
    try {
      const result = await getAllTestsAction()
      if (result.success && result.tests) {
        setTests(result.tests)
        
        // Load result counts for each test
        const counts: Record<string, number> = {}
        for (const test of result.tests) {
          const countResult = await getTestResultsCountAction(test.id)
          counts[test.id] = countResult.count || 0
        }
        setTestResultsCounts(counts)
      } else {
        setMessage({ type: "error", text: result.error || "Failed to load tests" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to load tests" })
    } finally {
      setLoadingTests(false)
    }
  }

  const handleDelete = async (testId: string, testTitle: string) => {
    const resultsCount = testResultsCounts[testId] || 0
    const hasResults = resultsCount > 0
    
    let confirmMessage = `Are you sure you want to delete "${testTitle}"?`
    if (hasResults) {
      confirmMessage += `\n\n⚠️ WARNING: This test has ${resultsCount} recorded grade${resultsCount !== 1 ? 's' : ''}. All grade data will be permanently deleted. This action cannot be undone.`
    } else {
      confirmMessage += "\n\nThis action cannot be undone."
    }
    
    if (!confirm(confirmMessage)) {
      return
    }

    try {
      const formData = new FormData()
      formData.append("testId", testId)
      const result = await deleteTestAction(formData)

      if (result.error) {
        setMessage({ type: "error", text: result.error })
      } else {
        const deletedCount = result.deletedResultsCount || 0
        const message = deletedCount > 0
          ? `Test deleted successfully! Also deleted ${deletedCount} grade record${deletedCount !== 1 ? 's' : ''}.`
          : "Test deleted successfully!"
        setMessage({ type: "success", text: message })
        loadTests()
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to delete test" })
    }
  }

  const handleEdit = (test: Test) => {
    setEditTest(test)
    setMode("builder")
  }

  const handleSaveComplete = () => {
    setEditTest(null)
    setMode("manage")
    loadTests()
    router.refresh()
  }

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
            onClick={() => {
              setMode("builder")
              setEditTest(null)
            }}
            variant={mode === "builder" ? "default" : "outline"}
            size="lg"
            className="flex-1"
          >
            {editTest ? "✏️ Edit Test" : "🎮 Build Test"}
          </Button>
          <Button
            onClick={() => {
              setMode("upload")
              setEditTest(null)
            }}
            variant={mode === "upload" ? "default" : "outline"}
            size="lg"
            className="flex-1"
          >
            📁 Upload JSON
          </Button>
          <Button
            onClick={() => {
              setMode("manage")
              setEditTest(null)
            }}
            variant={mode === "manage" ? "default" : "outline"}
            size="lg"
            className="flex-1"
          >
            📋 Manage Tests
          </Button>
        </div>

        {message && (
          <div
            className={`p-4 rounded-lg border-2 text-center font-semibold mb-4 ${
              message.type === "success"
                ? "bg-secondary/20 border-secondary text-secondary-foreground"
                : "bg-destructive/20 border-destructive text-destructive-foreground"
            }`}
          >
            {message.text}
          </div>
        )}

        {mode === "builder" ? (
          <TestBuilder editTest={editTest || undefined} onSaveComplete={handleSaveComplete} />
        ) : mode === "manage" ? (
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-2xl">📋 Manage Tests</CardTitle>
              <CardDescription>Edit or delete existing tests</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTests ? (
                <div className="text-center py-8">Loading tests...</div>
              ) : tests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No tests found. Create your first test!
                </div>
              ) : (
                <div className="space-y-3">
                  {tests.map((test) => (
                    <div
                      key={test.id}
                      className="p-4 bg-background rounded-lg border-2 flex justify-between items-start gap-4 hover:border-primary transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg mb-1">{test.title}</h3>
                        <div className="text-sm text-muted-foreground mb-2">
                          {test.subject && <span className="mr-3">📚 {test.subject}</span>}
                          {test.grade && <span>🎓 Grade {test.grade}</span>}
                        </div>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <p>
                            {test.questions.length} question{test.questions.length !== 1 ? "s" : ""}
                          </p>
                          {testResultsCounts[test.id] !== undefined && (
                            <p className={testResultsCounts[test.id] > 0 ? "text-primary font-medium" : ""}>
                              📊 {testResultsCounts[test.id] || 0} grade{testResultsCounts[test.id] !== 1 ? 's' : ''} recorded
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(test)}
                          className="border-2"
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(test.id, test.title)}
                          className="border-2"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
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
