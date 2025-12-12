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
    console.error("Error uploading test:", error)
    return { error: error instanceof Error ? error.message : "Failed to upload test" }
  }
}

export async function updateTestAction(formData: FormData) {
  try {
    const testId = formData.get("testId") as string
    const testDataString = formData.get("testData") as string
    const testData = JSON.parse(testDataString)

    // Validate test data
    if (!testData.title || !testData.questions || !Array.isArray(testData.questions)) {
      return { error: "Invalid test format: must have title and questions array" }
    }

    if (!testId) {
      return { error: "Test ID is required" }
    }

    // Check if test exists
    const existingTest = await redis.get(`test:${testId}`)
    if (!existingTest) {
      return { error: "Test not found" }
    }

    // Update test in Redis
    await redis.set(`test:${testId}`, testData)

    return { success: true, testId }
  } catch (error) {
    console.error("Error updating test:", error)
    return { error: error instanceof Error ? error.message : "Failed to update test" }
  }
}

export async function deleteTestAction(formData: FormData) {
  try {
    const testId = formData.get("testId") as string

    if (!testId) {
      return { error: "Test ID is required" }
    }

    // Check if test exists
    const existingTest = await redis.get(`test:${testId}`)
    if (!existingTest) {
      return { error: "Test not found" }
    }

    // Delete test from Redis
    await redis.del(`test:${testId}`)

    // Remove ID from set of all test IDs
    await redis.srem("test:ids", testId)

    return { success: true }
  } catch (error) {
    console.error("Error deleting test:", error)
    return { error: error instanceof Error ? error.message : "Failed to delete test" }
  }
}

export async function getAllTestsAction() {
  try {
    // Get all test IDs from Redis
    const testIds = ((await redis.smembers("test:ids")) as string[]) || []

    // Fetch all tests
    const tests = []
    for (const id of testIds) {
      try {
        const test = (await redis.get(`test:${id}`)) as any
        if (test) {
          tests.push({ ...test, id })
        }
      } catch (error) {
        console.error(`Error fetching test ${id}:`, error)
      }
    }

    return { success: true, tests }
  } catch (error) {
    console.error("Error fetching tests:", error)
    return { error: error instanceof Error ? error.message : "Failed to fetch tests" }
  }
}
