import { kv } from "@vercel/kv"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Test {
  id: string
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

export default async function HomePage() {
  // Get all test IDs from KV
  const testIds = (await kv.smembers("test:ids")) as string[]

  // Fetch all tests
  const tests: Test[] = []
  for (const id of testIds) {
    const test = (await kv.get(`test:${id}`)) as Test | null
    if (test) {
      tests.push({ ...test, id })
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-5xl font-black text-primary mb-2 tracking-tight">🎮 Practice Tests</h1>
            <p className="text-lg text-muted-foreground">Choose a test and show what you know!</p>
          </div>
          <Link href="/admin">
            <Button variant="outline" size="sm" className="border-2 bg-transparent">
              🔧 Admin
            </Button>
          </Link>
        </div>

        {tests.length === 0 ? (
          <Card className="border-2 border-dashed border-primary/30">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-6xl mb-4">🦖</div>
              <p className="text-muted-foreground text-center mb-4 text-lg">
                No tests yet! Ask a grown-up to create some tests!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {tests.map((test) => (
              <Link key={test.id} href={`/test/${test.id}`}>
                <Card className="hover:shadow-xl transition-all cursor-pointer border-2 hover:border-primary hover:scale-[1.02]">
                  <CardHeader>
                    <CardTitle className="text-xl text-primary">{test.title}</CardTitle>
                    <CardDescription className="text-base">
                      {test.subject && <span className="mr-3">📚 {test.subject}</span>}
                      {test.grade && <span>🎓 Grade {test.grade}</span>}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground font-medium">
                      {test.questions.length} question{test.questions.length !== 1 ? "s" : ""}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
