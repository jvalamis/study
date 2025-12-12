import { kv } from "@vercel/kv"
import { notFound } from "next/navigation"
import TestTaker from "@/components/test-taker"

interface Test {
  title: string
  subject?: string
  grade?: string
  questions: Array<{
    type: "multiple_choice" | "short_answer" | "numeric"
    prompt: string
    choices?: string[]
    answer: string | number
  }>
}

export default async function TestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const test = (await kv.get(`test:${id}`)) as Test | null

  if (!test) {
    notFound()
  }

  return <TestTaker test={test} testId={id} />
}
