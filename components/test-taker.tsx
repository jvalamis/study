"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Volume2 } from "lucide-react"
import { saveTestResultAction } from "@/app/admin/actions"

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
  const [savingGrade, setSavingGrade] = useState(false)
  const [voicesLoaded, setVoicesLoaded] = useState(false)
  const router = useRouter()

  // Safety check: ensure test has questions and current question exists
  if (!test.questions || test.questions.length === 0) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <Card className="border-2 border-red-300">
            <CardContent className="p-8 text-center">
              <p className="text-lg text-red-600">This test has no questions. Please contact the administrator.</p>
              <Button onClick={() => router.push("/")} className="mt-4">
                Back to Tests
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  const question = test.questions[currentQuestion]
  const isLastQuestion = currentQuestion === test.questions.length - 1

  // Safety check: ensure question exists
  if (!question) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <Card className="border-2 border-red-300">
            <CardContent className="p-8 text-center">
              <p className="text-lg text-red-600">Question not found. Please contact the administrator.</p>
              <Button onClick={() => router.push("/")} className="mt-4">
                Back to Tests
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  // Load voices when component mounts (voices may not be available immediately)
  useEffect(() => {
    if ("speechSynthesis" in window) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices()
        if (voices.length > 0) {
          setVoicesLoaded(true)
        }
      }
      
      // Try loading immediately
      loadVoices()
      
      // Some browsers load voices asynchronously
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices
      }
      
      return () => {
        if (window.speechSynthesis.onvoiceschanged) {
          window.speechSynthesis.onvoiceschanged = null
        }
      }
    }
  }, [])

  useEffect(() => {
    if (question && question.type === "spelling" && question.prompt) {
      // Small delay to ensure voices are ready, or use immediately if not loaded yet
      const timer = setTimeout(() => {
        speakWord(question.prompt)
      }, voicesLoaded ? 100 : 500)
      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion, question?.type, question?.prompt, voicesLoaded])

  const speakWord = (word: string) => {
    if ("speechSynthesis" in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(word)
      
      // Get available voices and select a child-friendly one with clear enunciation
      const voices = window.speechSynthesis.getVoices()
      
      if (voices.length > 0) {
        // Priority list of voices known for clear enunciation and kid-friendly tone
        // These voices are typically clearer and enunciate better
        const voicePriority = [
          // Google voices (usually very clear)
          'google us english female',
          'google uk english female',
          'google us english',
          'google uk english',
          // Microsoft voices (clear and friendly)
          'zira', // Microsoft Zira - very clear
          'samantha', // macOS - clear and friendly
          'karen', // macOS - Australian, clear
          'susan', // macOS - British, clear
          'hazel', // macOS - British, clear
          'victoria', // macOS - clear
          'siri', // iOS - clear
          'siri enhanced', // iOS - enhanced clarity
          // Other clear voices
          'female',
          'alex', // macOS - clear
          'daniel', // macOS - British, clear
        ]
        
        // Find the best matching voice
        let selectedVoice = null
        
        // First, try to find exact matches from priority list
        for (const priorityName of voicePriority) {
          const match = voices.find(voice => {
            const name = voice.name.toLowerCase()
            const lang = voice.lang.toLowerCase()
            return name.includes(priorityName) && lang.includes('en')
          })
          if (match) {
            selectedVoice = match
            break
          }
        }
        
        // If no priority match, prefer voices with "enhanced", "premium", or "neural" in name
        if (!selectedVoice) {
          const enhancedVoices = voices.filter(voice => {
            const name = voice.name.toLowerCase()
            const lang = voice.lang.toLowerCase()
            return (
              lang.includes('en') &&
              (name.includes('enhanced') ||
               name.includes('premium') ||
               name.includes('neural') ||
               name.includes('natural'))
            )
          })
          if (enhancedVoices.length > 0) {
            selectedVoice = enhancedVoices[0]
          }
        }
        
        // If still no match, prefer female English voices (generally clearer for kids)
        if (!selectedVoice) {
          const femaleEnglishVoices = voices.filter(voice => {
            const name = voice.name.toLowerCase()
            const lang = voice.lang.toLowerCase()
            return lang.includes('en') && name.includes('female')
          })
          if (femaleEnglishVoices.length > 0) {
            selectedVoice = femaleEnglishVoices[0]
          }
        }
        
        // Fallback to any English voice
        if (!selectedVoice) {
          const englishVoices = voices.filter(v => v.lang.toLowerCase().includes('en'))
          if (englishVoices.length > 0) {
            selectedVoice = englishVoices[0]
          } else {
            selectedVoice = voices[0]
          }
        }
        
        if (selectedVoice) {
          utterance.voice = selectedVoice
        }
      }
      
      // Optimize for children: slower rate for better comprehension, clear enunciation
      utterance.rate = 0.7 // Slower for better word recognition and comprehension
      utterance.pitch = 1.0 // Neutral pitch for clarity (not too high or low)
      utterance.volume = 1.0 // Full volume
      utterance.lang = 'en-US' // Ensure US English pronunciation for consistency
      
      // Add slight pause between words if multiple words
      const words = word.trim().split(/\s+/)
      if (words.length > 1) {
        // For multi-word phrases, add commas to create natural pauses
        utterance.text = words.join(', ')
      }
      
      window.speechSynthesis.speak(utterance)
    }
  }

  const handleAnswer = (value: string | number) => {
    const newAnswers = [...answers]
    newAnswers[currentQuestion] = value
    setAnswers(newAnswers)
  }

  const handleNext = async () => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/a29c59c1-58df-41fe-a303-6013db00baae',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test-taker.tsx:133',message:'handleNext called',data:{isLastQuestion,answersLength:answers.length,questionsLength:test.questions.length,currentQuestion},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    if (isLastQuestion) {
      // Calculate results and save grade
      const { correct, total, results } = calculateResults()
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/a29c59c1-58df-41fe-a303-6013db00baae',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test-taker.tsx:137',message:'calculateResults result in handleNext',data:{correct,total,resultsLength:results.length,answersLength:answers.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      const percentage = Math.round((correct / total) * 100)
      
      setSavingGrade(true)
      try {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/a29c59c1-58df-41fe-a303-6013db00baae',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test-taker.tsx:143',message:'Before mapping answers',data:{answersLength:answers.length,resultsLength:results.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        const formData = new FormData()
        formData.append("testId", testId)
        const answerData = answers.map((ans, idx) => {
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/a29c59c1-58df-41fe-a303-6013db00baae',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test-taker.tsx:148',message:'Mapping answer',data:{idx,hasResult:!!results[idx],answerType:typeof ans},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          return {
            questionIndex: idx,
            answer: ans,
            isCorrect: results[idx]?.isCorrect || false,
          }
        })
        formData.append("resultData", JSON.stringify({
          correct,
          total,
          percentage,
          answers: answerData,
        }))
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/a29c59c1-58df-41fe-a303-6013db00baae',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test-taker.tsx:157',message:'Before saveTestResultAction',data:{testId,answerDataLength:answerData.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        await saveTestResultAction(formData)
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/a29c59c1-58df-41fe-a303-6013db00baae',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test-taker.tsx:160',message:'After saveTestResultAction success',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
      } catch (error) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/a29c59c1-58df-41fe-a303-6013db00baae',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test-taker.tsx:162',message:'Error saving grade',data:{error:error instanceof Error?error.message:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        console.error("Error saving grade:", error)
        // Continue even if saving fails
      } finally {
        setSavingGrade(false)
        setSubmitted(true)
      }
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
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/a29c59c1-58df-41fe-a303-6013db00baae',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test-taker.tsx:173',message:'calculateResults entry',data:{questionsLength:test.questions.length,answersLength:answers.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    let correct = 0
    const results = test.questions.map((q, idx) => {
      const userAnswer = answers[idx]
      const correctAnswer = q.answer
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/a29c59c1-58df-41fe-a303-6013db00baae',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test-taker.tsx:178',message:'Comparing answers',data:{idx,userAnswer,correctAnswer,userAnswerType:typeof userAnswer,correctAnswerType:typeof correctAnswer},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      // Handle numeric comparison: compare numbers directly, strings with case-insensitive trim
      let isCorrect: boolean
      if (typeof userAnswer === "number" && typeof correctAnswer === "number") {
        isCorrect = userAnswer === correctAnswer
      } else if (q.type === "numeric") {
        // For numeric questions, compare as numbers (handle string "5" vs number 5)
        isCorrect = Number(userAnswer) === Number(correctAnswer) && !isNaN(Number(userAnswer)) && !isNaN(Number(correctAnswer))
      } else {
        // For text answers, compare as strings (case-insensitive, trimmed)
        isCorrect = String(userAnswer).toLowerCase().trim() === String(correctAnswer).toLowerCase().trim()
      }
      if (isCorrect) correct++
      return { isCorrect, userAnswer, correctAnswer, question: q }
    })
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/a29c59c1-58df-41fe-a303-6013db00baae',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test-taker.tsx:183',message:'calculateResults exit',data:{correct,total:test.questions.length,resultsLength:results.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    return { correct, total: test.questions.length, results }
  }

  if (submitted) {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/a29c59c1-58df-41fe-a303-6013db00baae',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test-taker.tsx:185',message:'Submitted view - before calculateResults',data:{answersLength:answers.length,questionsLength:test.questions.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    const { correct, total, results } = calculateResults()
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/a29c59c1-58df-41fe-a303-6013db00baae',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test-taker.tsx:188',message:'Submitted view - after calculateResults',data:{correct,total,resultsLength:results.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    const percentage = Math.round((correct / total) * 100)
    
    // Note: Grade was already saved in handleNext

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
              <div className="space-y-3">
                <div className="text-center">
                  <CardTitle className="text-2xl mb-1">🔊 Listen and Spell</CardTitle>
                </div>
                <Button
                  onClick={() => speakWord(question.prompt)}
                  size="lg"
                  className="w-full text-lg h-12 bg-primary hover:bg-primary/90"
                  variant="default"
                >
                  <Volume2 className="w-5 h-5 mr-2" />
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

            {question.type === "short_answer" && (
              <Input
                type="text"
                value={String(answers[currentQuestion])}
                onChange={(e) => handleAnswer(e.target.value)}
                placeholder="Type your answer here"
                className="text-lg"
              />
            )}

            {question.type === "spelling" && (
              <div className="space-y-6">
                <Input
                  type="text"
                  value={String(answers[currentQuestion])}
                  onChange={(e) => handleAnswer(e.target.value)}
                  placeholder="Type the word you heard..."
                  className="text-3xl font-bold text-center h-20 border-4 border-primary/30 focus:border-primary focus:ring-4 focus:ring-primary/20"
                  autoFocus={true}
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
            )}

            {question.type === "numeric" && (
              <Input
                type="number"
                value={answers[currentQuestion] === "" || answers[currentQuestion] === undefined ? "" : answers[currentQuestion]}
                onChange={(e) => {
                  const value = e.target.value
                  // Convert to number if not empty and valid, otherwise keep as empty string
                  if (value === "" || value === null || value === undefined) {
                    handleAnswer("")
                  } else {
                    const numValue = Number(value)
                    handleAnswer(isNaN(numValue) ? "" : numValue)
                  }
                }}
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
              <Button 
                onClick={handleNext} 
                disabled={
                  answers[currentQuestion] === "" || 
                  answers[currentQuestion] === undefined || 
                  answers[currentQuestion] === null ||
                  (question.type === "numeric" && (answers[currentQuestion] === "" || isNaN(Number(answers[currentQuestion]))))
                } 
                className="flex-1"
              >
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
