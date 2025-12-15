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
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/a29c59c1-58df-41fe-a303-6013db00baae',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions.ts:131',message:'saveTestResultAction entry',data:{testId,hasResultData:!!resultDataString,resultDataLength:resultDataString?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    let resultData
    try {
      resultData = JSON.parse(resultDataString)
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/a29c59c1-58df-41fe-a303-6013db00baae',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions.ts:135',message:'JSON parse success',data:{hasResultData:!!resultData},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
    } catch (parseError) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/a29c59c1-58df-41fe-a303-6013db00baae',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions.ts:138',message:'JSON parse error',data:{error:parseError instanceof Error?parseError.message:String(parseError)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      return { error: "Invalid result data format" }
    }

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

export async function getTestResultsAction(testId: string) {
  try {
    // Get all result IDs for this test
    const resultIds = ((await redis.smembers(`test:${testId}:results`)) as string[]) || []

    // Fetch all results
    const results = []
    for (const resultId of resultIds) {
      try {
        const result = (await redis.get(`test:${testId}:result:${resultId}`)) as any
        if (result) {
          results.push(result)
        }
      } catch (error) {
        console.error(`Error fetching result ${resultId}:`, error)
      }
    }

    // Sort by timestamp (newest first)
    results.sort((a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0
      // Handle invalid dates
      const validTimeA = isNaN(timeA) ? 0 : timeA
      const validTimeB = isNaN(timeB) ? 0 : timeB
      return validTimeB - validTimeA
    })

    // Calculate statistics
    const percentages = results.map((r: any) => r.percentage || 0)
    const average = percentages.length > 0
      ? Math.round(percentages.reduce((a: number, b: number) => a + b, 0) / percentages.length)
      : 0
    const highest = percentages.length > 0 ? Math.max(...percentages) : 0
    const lowest = percentages.length > 0 ? Math.min(...percentages) : 0

    return {
      success: true,
      results,
      statistics: {
        total: results.length,
        average,
        highest,
        lowest,
      },
    }
  } catch (error) {
    console.error("Error fetching test results:", error)
    return { error: error instanceof Error ? error.message : "Failed to fetch test results" }
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
