"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Volume2 } from "lucide-react"

interface Question {
  type: "multiple_choice" | "short_answer" | "numeric" | "spelling"
  prompt: string
  choices?: string[]
  answer: string | number
}

interface Test {
  title: string
  subject?: string
  grade?: string
  questions: Question[]
}

export default function TestTaker({ test, testId }: { test: Test; testId: string }) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<(string | number)[]>(Array(test.questions.length).fill(""))
  const [submitted, setSubmitted] = useState(false)
  const router = useRouter()

  const question = test.questions[currentQuestion]
  const isLastQuestion = currentQuestion === test.questions.length - 1

  useEffect(() => {
    if (question.type === "spelling") {
      speakWord(question.prompt)
    }
  }, [currentQuestion, question])

  const speakWord = (word: string) => {
    if ("speechSynthesis" in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(word)
      utterance.rate = 0.8 // Slightly slower for kids
      utterance.pitch = 1
      utterance.volume = 1
      window.speechSynthesis.speak(utterance)
    }
  }

  const handleAnswer = (value: string | number) => {
    const newAnswers = [...answers]
    newAnswers[currentQuestion] = value
    setAnswers(newAnswers)
  }

  const handleNext = () => {
    if (isLastQuestion) {
      setSubmitted(true)
    } else {
      setCurrentQuestion(currentQuestion + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const calculateResults = () => {
    let correct = 0
    const results = test.questions.map((q, idx) => {
      const userAnswer = answers[idx]
      const correctAnswer = q.answer
      const isCorrect = String(userAnswer).toLowerCase().trim() === String(correctAnswer).toLowerCase().trim()
      if (isCorrect) correct++
      return { isCorrect, userAnswer, correctAnswer, question: q }
    })
    return { correct, total: test.questions.length, results }
  }

  if (submitted) {
    const { correct, total, results } = calculateResults()
    const percentage = Math.round((correct / total) * 100)

    return (
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50 p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <Card className="mb-6 border-2">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl text-indigo-900">Test Complete!</CardTitle>
              <CardDescription className="text-lg">
                You scored {correct} out of {total} ({percentage}%)
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-6xl mb-4">{percentage >= 80 ? "🌟" : percentage >= 60 ? "👍" : "💪"}</div>
              <p className="text-muted-foreground">
                {percentage >= 80
                  ? "Excellent work!"
                  : percentage >= 60
                    ? "Good job! Keep practicing!"
                    : "Keep trying! Practice makes perfect!"}
              </p>
            </CardContent>
          </Card>

          <div className="space-y-4 mb-6">
            {results.map((result, idx) => (
              <Card
                key={idx}
                className={result.isCorrect ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"}
              >
                <CardHeader>
                  <CardTitle className="text-lg flex items-start gap-2">
                    <span>{result.isCorrect ? "✓" : "✗"}</span>
                    <span className="flex-1">
                      {result.question.type === "spelling" ? "Spell" : "Question"} {idx + 1}: {result.question.prompt}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <span className="font-medium">Your answer: </span>
                    <span className={result.isCorrect ? "text-green-700" : "text-red-700"}>
                      {result.userAnswer || "(no answer)"}
                    </span>
                  </div>
                  {!result.isCorrect && (
                    <div>
                      <span className="font-medium">Correct answer: </span>
                      <span className="text-green-700">{result.correctAnswer}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex gap-3 justify-center">
            <Button onClick={() => router.push("/")} variant="outline">
              Back to Tests
            </Button>
            <Button onClick={() => window.location.reload()}>Take Again</Button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-indigo-900 mb-2">{test.title}</h1>
          <p className="text-indigo-700">
            Question {currentQuestion + 1} of {test.questions.length}
          </p>
        </div>

        <Card>
          <CardHeader>
            {question.type === "spelling" ? (
              <div className="space-y-4">
                <CardTitle className="text-xl">Listen and spell the word</CardTitle>
                <Button
                  onClick={() => speakWord(question.prompt)}
                  size="lg"
                  className="w-full text-lg"
                  variant="secondary"
                >
                  <Volume2 className="w-6 h-6 mr-2" />
                  Play Word Again
                </Button>
              </div>
            ) : (
              <CardTitle className="text-xl">{question.prompt}</CardTitle>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {question.type === "multiple_choice" && question.choices && (
              <RadioGroup value={String(answers[currentQuestion])} onValueChange={handleAnswer}>
                <div className="space-y-3">
                  {question.choices.map((choice, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <RadioGroupItem value={choice} id={`choice-${idx}`} />
                      <Label htmlFor={`choice-${idx}`} className="flex-1 cursor-pointer">
                        {choice}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            )}

            {(question.type === "short_answer" || question.type === "spelling") && (
              <Input
                type="text"
                value={String(answers[currentQuestion])}
                onChange={(e) => handleAnswer(e.target.value)}
                placeholder={question.type === "spelling" ? "Type the word you heard" : "Type your answer here"}
                className="text-lg"
                autoFocus={question.type === "spelling"}
              />
            )}

            {question.type === "numeric" && (
              <Input
                type="number"
                value={String(answers[currentQuestion])}
                onChange={(e) => handleAnswer(e.target.value)}
                placeholder="Enter a number"
                className="text-lg"
              />
            )}

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
                variant="outline"
                className="flex-1 bg-transparent"
              >
                Previous
              </Button>
              <Button onClick={handleNext} disabled={!answers[currentQuestion]} className="flex-1">
                {isLastQuestion ? "Submit Test" : "Next Question"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 flex gap-2 justify-center flex-wrap">
          {test.questions.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentQuestion(idx)}
              className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                idx === currentQuestion
                  ? "bg-indigo-600 text-white"
                  : answers[idx]
                    ? "bg-indigo-200 text-indigo-900"
                    : "bg-gray-200 text-gray-600"
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>
    </main>
  )
}
