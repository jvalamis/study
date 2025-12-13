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
    const deleteResults = formData.get("deleteResults") === "true"

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

    // Check for existing results
    const resultsCount = await getTestResultsCountAction(testId)
    const hasResults = resultsCount.count > 0
    let deletedCount = 0

    // Delete results if requested
    if (deleteResults && hasResults) {
      deletedCount = await deleteTestResults(testId)
    }

    // Update test in Redis
    await redis.set(`test:${testId}`, testData)

    return { success: true, testId, hadResults: hasResults, deletedResults: deletedCount > 0, deletedResultsCount: deletedCount }
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

    // Check for existing results and delete them
    const resultsCount = await deleteTestResults(testId)

    // Delete test from Redis
    await redis.del(`test:${testId}`)

    // Remove ID from set of all test IDs
    await redis.srem("test:ids", testId)

    return { success: true, deletedResultsCount: resultsCount }
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

export async function saveTestResultAction(formData: FormData) {
  try {
    const testId = formData.get("testId") as string
    const resultDataString = formData.get("resultData") as string
    const resultData = JSON.parse(resultDataString)

    if (!testId || !resultData) {
      return { error: "Test ID and result data are required" }
    }

    // Generate unique result ID
    const resultId = nanoid(10)
    const timestamp = new Date().toISOString()

    // Save result with timestamp
    const result = {
      ...resultData,
      resultId,
      testId,
      timestamp,
    }

    // Store individual result
    await redis.set(`test:${testId}:result:${resultId}`, result)

    // Add to list of results for this test
    await redis.sadd(`test:${testId}:results`, resultId)

    return { success: true, resultId }
  } catch (error) {
    console.error("Error saving test result:", error)
    return { error: error instanceof Error ? error.message : "Failed to save test result" }
  }
}

export async function getTestResultsCountAction(testId: string) {
  try {
    const resultIds = ((await redis.smembers(`test:${testId}:results`)) as string[]) || []
    return { success: true, count: resultIds.length }
  } catch (error) {
    console.error("Error getting test results count:", error)
    return { success: true, count: 0 }
  }
}

async function deleteTestResults(testId: string) {
  try {
    // Get all result IDs for this test
    const resultIds = ((await redis.smembers(`test:${testId}:results`)) as string[]) || []

    // Delete each result
    for (const resultId of resultIds) {
      await redis.del(`test:${testId}:result:${resultId}`)
    }

    // Delete the results set
    await redis.del(`test:${testId}:results`)

    return resultIds.length
  } catch (error) {
    console.error("Error deleting test results:", error)
    return 0
  }
}
