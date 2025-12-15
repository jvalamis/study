import { redis } from "@/lib/redis"
import { notFound } from "next/navigation"
import TestTaker from "@/components/test-taker"

interface Test {
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

export default async function TestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const test = (await redis.get(`test:${id}`)) as Test | null

  if (!test) {
    notFound()
  }

  // Validate test has questions
  if (!test.questions || test.questions.length === 0) {
    notFound()
  }

  return <TestTaker test={test} testId={id} />
}
