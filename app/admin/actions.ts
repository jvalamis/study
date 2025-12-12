"use server"

import { redis } from "@/lib/redis"
import { nanoid } from "nanoid"

export async function uploadTestAction(formData: FormData) {
  try {
    const testDataString = formData.get("testData") as string
    const testData = JSON.parse(testDataString)

    // Validate test data
    if (!testData.title || !testData.questions || !Array.isArray(testData.questions)) {
      return { error: "Invalid test format: must have title and questions array" }
    }

    // Generate unique ID
    const testId = nanoid(10)

    // Save test to Redis
    await redis.set(`test:${testId}`, testData)

    // Add ID to set of all test IDs
    await redis.sadd("test:ids", testId)

    return { success: true, testId }
  } catch (error) {
    return { error: "Failed to upload test" }
  }
}
