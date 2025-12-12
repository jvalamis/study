"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { uploadTestAction } from "@/app/admin/actions"
import { X, Plus } from "lucide-react"

interface Question {
  type: "multiple_choice" | "short_answer" | "numeric" | "spelling"
  prompt: string
  choices?: string[]
  answer: string
}

export default function TestBuilder() {
  const [title, setTitle] = useState("")
  const [subject, setSubject] = useState("")
  const [grade, setGrade] = useState("")
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    type: "multiple_choice",
    prompt: "",
    choices: ["", "", ""],
    answer: "",
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const router = useRouter()

  console.log("[v0] Test Builder State:", {
    title,
    questionsCount: questions.length,
    questions,
    canSave: !saving && questions.length > 0 && !!title,
  })

  const addQuestion = () => {
    if (!currentQuestion.prompt || !currentQuestion.answer) {
      setMessage({ type: "error", text: "Please fill in the question and answer!" })
      return
    }

    if (
      currentQuestion.type === "multiple_choice" &&
      (!currentQuestion.choices || currentQuestion.choices.filter((c) => c.trim()).length < 2)
    ) {
      setMessage({ type: "error", text: "Multiple choice needs at least 2 choices!" })
      return
    }

    console.log("[v0] Adding question:", currentQuestion)
    const newQuestions = [...questions, currentQuestion]
    console.log("[v0] New questions array:", newQuestions)

    setQuestions(newQuestions)
    setCurrentQuestion({
      type: "multiple_choice",
      prompt: "",
      choices: ["", "", ""],
      answer: "",
    })
    setMessage({ type: "success", text: "Question added! 🎉" })
    setTimeout(() => setMessage(null), 2000)
  }

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index))
  }

  const saveTest = async () => {
    if (!title || questions.length === 0) {
      setMessage({ type: "error", text: "Add a title and at least one question!" })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const testData = {
        title,
        subject: subject || undefined,
        grade: grade || undefined,
        questions,
      }

      const formData = new FormData()
      formData.append("testData", JSON.stringify(testData))

      const result = await uploadTestAction(formData)

      if (result.error) {
        setMessage({ type: "error", text: result.error })
      } else {
        setMessage({ type: "success", text: "Test saved! Redirecting..." })
        setTimeout(() => {
          window.location.href = "/"
        }, 1500)
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to save test" })
    } finally {
      setSaving(false)
    }
  }

  const updateChoice = (index: number, value: string) => {
    const newChoices = [...(currentQuestion.choices || [])]
    newChoices[index] = value
    setCurrentQuestion({ ...currentQuestion, choices: newChoices })
  }

  const addChoice = () => {
    setCurrentQuestion({
      ...currentQuestion,
      choices: [...(currentQuestion.choices || []), ""],
    })
  }

  return (
    <div className="space-y-6">
      {/* Test Info Card */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-card to-primary/5">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">📝 Test Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title" className="text-base font-semibold">
              Test Title *
            </Label>
            <Input
              id="title"
              placeholder="Example: Week 5 Spelling Words"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-2 text-lg border-2"
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="subject" className="text-base font-semibold">
                Subject
              </Label>
              <Input
                id="subject"
                placeholder="Example: Spelling"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-2 border-2"
              />
            </div>
            <div>
              <Label htmlFor="grade" className="text-base font-semibold">
                Grade
              </Label>
              <Input
                id="grade"
                placeholder="Example: 1"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="mt-2 border-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Question Card */}
      <Card className="border-2 border-secondary/20 bg-gradient-to-br from-card to-secondary/5">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">➕ Add Question</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="question-type" className="text-base font-semibold">
              Question Type
            </Label>
            <Select
              value={currentQuestion.type}
              onValueChange={(value: "multiple_choice" | "short_answer" | "numeric" | "spelling") => {
                setCurrentQuestion({
                  type: value,
                  prompt: currentQuestion.prompt,
                  choices: value === "multiple_choice" ? ["", "", ""] : undefined,
                  answer: "",
                })
              }}
            >
              <SelectTrigger className="mt-2 border-2 text-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="multiple_choice">🎯 Multiple Choice</SelectItem>
                <SelectItem value="short_answer">✍️ Short Answer</SelectItem>
                <SelectItem value="numeric">🔢 Number Answer</SelectItem>
                <SelectItem value="spelling">🔊 Spelling (Read Aloud)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="prompt" className="text-base font-semibold">
              {currentQuestion.type === "spelling" ? "Word to Spell *" : "Question *"}
            </Label>
            <Textarea
              id="prompt"
              placeholder={
                currentQuestion.type === "spelling"
                  ? "Enter the word (it will be read aloud)..."
                  : "Type your question here..."
              }
              value={currentQuestion.prompt}
              onChange={(e) => setCurrentQuestion({ ...currentQuestion, prompt: e.target.value })}
              className="mt-2 min-h-24 text-lg border-2"
            />
            {currentQuestion.type === "spelling" && (
              <p className="text-sm text-muted-foreground mt-2">
                💡 The word will be spoken aloud, and the student will type what they hear!
              </p>
            )}
          </div>

          {currentQuestion.type === "multiple_choice" && (
            <div>
              <Label className="text-base font-semibold">Answer Choices *</Label>
              <div className="space-y-2 mt-2">
                {currentQuestion.choices?.map((choice, index) => (
                  <Input
                    key={index}
                    placeholder={`Choice ${index + 1}`}
                    value={choice}
                    onChange={(e) => updateChoice(index, e.target.value)}
                    className="border-2 text-lg"
                  />
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addChoice}
                  className="w-full border-2 border-dashed bg-transparent"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another Choice
                </Button>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="answer" className="text-base font-semibold">
              {currentQuestion.type === "spelling" ? "Correct Spelling *" : "Correct Answer *"}
            </Label>
            {currentQuestion.type === "multiple_choice" ? (
              <Select
                value={currentQuestion.answer}
                onValueChange={(value) => setCurrentQuestion({ ...currentQuestion, answer: value })}
              >
                <SelectTrigger className="mt-2 border-2 text-lg">
                  <SelectValue placeholder="Select the correct answer" />
                </SelectTrigger>
                <SelectContent>
                  {currentQuestion.choices
                    ?.filter((c) => c.trim())
                    .map((choice, index) => (
                      <SelectItem key={index} value={choice}>
                        {choice}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="answer"
                placeholder={
                  currentQuestion.type === "spelling"
                    ? "The correct spelling"
                    : currentQuestion.type === "numeric"
                      ? "Type the correct answer"
                      : "Type the correct answer"
                }
                value={currentQuestion.answer}
                onChange={(e) => setCurrentQuestion({ ...currentQuestion, answer: e.target.value })}
                className="mt-2 border-2 text-lg"
                type={currentQuestion.type === "numeric" ? "number" : "text"}
              />
            )}
          </div>

          <Button onClick={addQuestion} className="w-full" size="lg">
            <Plus className="w-5 h-5 mr-2" />
            Add This Question
          </Button>
        </CardContent>
      </Card>

      {/* Questions List */}
      {questions.length > 0 && (
        <Card className="border-2 border-accent/20 bg-gradient-to-br from-card to-accent/5">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center justify-between">
              <span className="flex items-center gap-2">📋 Questions ({questions.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {questions.map((q, index) => (
              <div key={index} className="p-4 bg-background rounded-lg border-2 flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-muted-foreground mb-1">
                    Question {index + 1} •{" "}
                    {q.type === "multiple_choice"
                      ? "Multiple Choice"
                      : q.type === "short_answer"
                        ? "Short Answer"
                        : q.type === "spelling"
                          ? "Spelling"
                          : "Number"}
                  </p>
                  <p className="font-medium mb-2 break-words">{q.prompt}</p>
                  <p className="text-sm text-secondary">
                    <span className="font-semibold">Answer:</span> {q.answer}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeQuestion(index)}
                  className="hover:bg-destructive/10 hover:text-destructive shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg border-2 text-center font-semibold ${
            message.type === "success"
              ? "bg-secondary/20 border-secondary text-secondary-foreground"
              : "bg-destructive/20 border-destructive text-destructive-foreground"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Save Button */}
      <div className="space-y-2">
        {(!title || questions.length === 0) && (
          <p className="text-sm text-muted-foreground text-center">
            {!title && questions.length === 0 && "⚠️ Please add a test title and at least one question"}
            {!title && questions.length > 0 && "⚠️ Please add a test title"}
            {title && questions.length === 0 && "⚠️ Please add at least one question"}
          </p>
        )}
        <Button onClick={saveTest} disabled={saving || questions.length === 0 || !title} className="w-full" size="lg">
          {saving ? "Saving..." : `💾 Save Test (${questions.length} questions)`}
        </Button>
      </div>
    </div>
  )
}
