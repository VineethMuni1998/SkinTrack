// Perfect Corp YouCam AI Skin Analysis API Client
// API Documentation: https://yce.perfectcorp.com/document/index.html

interface PerfectCorpConfig {
  apiKey: string;
  baseUrl: string;
}

interface TaskStartResponse {
  data?: {
    task_id: string;
  };
  error_code?: string;
  error_message?: string;
}

interface TaskStatusResponse {
  data?: {
    task_id: string;
    task_status: 'success' | 'processing' | 'error';
    results?: SkinAnalysisAPIResponse;
  };
  error_code?: string;
  error_message?: string;
}

interface SkinAnalysisAPIResponse {
  skin_type?: string;
  confidence?: number;
  concerns?: {
    wrinkles?: number;
    spots?: number;
    redness?: number;
    acne?: number;
    oiliness?: number;
    dark_circles?: number;
    texture?: number;
    moisture?: number;
  };
  [key: string]: any;
}

export interface SkinAnalysisResult {
  skinType: 'DRY' | 'OILY' | 'COMBINATION' | 'NORMAL' | 'UNKNOWN';
  confidence: number;
  concerns: {
    wrinkles: number;
    spots: number;
    redness: number;
    acne: number;
    oiliness: number;
    darkCircles: number;
    texture: number;
    moisture: number;
  };
  rawResponse: any;
}

class PerfectCorpAPIError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'PerfectCorpAPIError';
  }
}

// Validate API configuration
function getConfig(): PerfectCorpConfig {
  const apiKey = process.env.YOUCAM_API_KEY;
  const baseUrl = process.env.YOUCAM_API_BASE_URL || 'https://yce-api-01.makeupar.com';

  if (!apiKey) {
    throw new PerfectCorpAPIError(
      'Perfect Corp API key is not configured',
      'missing_api_key'
    );
  }

  return { apiKey, baseUrl };
}

// Helper: Sleep function for polling
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper: Download and extract ZIP results
async function downloadAndExtractResults(zipUrl: string): Promise<SkinAnalysisAPIResponse> {
  try {
    console.log('Perfect Corp: Downloading ZIP file...');

    // Download the ZIP file
    const response = await fetch(zipUrl);
    if (!response.ok) {
      throw new PerfectCorpAPIError(
        `Failed to download ZIP file (${response.status})`,
        'zip_download_failed',
        response.status
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log('Perfect Corp: ZIP file downloaded, size:', buffer.length, 'bytes');

    // Use JSZip to extract the ZIP file
    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(buffer);

    // List all files in the ZIP for debugging
    const fileNames = Object.keys(zip.files);
    console.log('Perfect Corp: Files in ZIP:', fileNames);

    // Find score_info.json (it might be in a subdirectory)
    let scoreInfoFile = null;
    let scoreInfoPath = '';

    for (const fileName of fileNames) {
      if (fileName.endsWith('score_info.json') || fileName.endsWith('score_info.json/')) {
        scoreInfoFile = zip.files[fileName];
        scoreInfoPath = fileName;
        break;
      }
    }

    if (!scoreInfoFile || scoreInfoFile.dir) {
      console.error('Perfect Corp: Available files:', fileNames);
      throw new PerfectCorpAPIError(
        `score_info.json not found in ZIP file. Available files: ${fileNames.join(', ')}`,
        'missing_score_info'
      );
    }

    console.log('Perfect Corp: Found score_info.json at:', scoreInfoPath);

    const scoreInfoContent = await scoreInfoFile.async('string');
    const scoreData = JSON.parse(scoreInfoContent);

    console.log('Perfect Corp: Extracted and parsed score_info.json');

    return scoreData as SkinAnalysisAPIResponse;
  } catch (error) {
    if (error instanceof PerfectCorpAPIError) {
      throw error;
    }
    throw new PerfectCorpAPIError(
      `Failed to extract ZIP results: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'zip_extraction_failed'
    );
  }
}

// Step 1: Start skin analysis task with image URL
async function startTask(imageUrl: string): Promise<string> {
  const config = getConfig();
  const endpoint = `${config.baseUrl}/s2s/v2.0/task/skin-analysis`;

  console.log('Perfect Corp: Starting skin analysis task');
  console.log('Perfect Corp: Endpoint:', endpoint);
  console.log('Perfect Corp: Image URL:', imageUrl);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        src_file_url: imageUrl,
        dst_actions: [
          "acne",
          "wrinkle",
          "age_spot",
          "redness",
          "oiliness",
          "dark_circle_v2",
          "texture"
        ],
      }),
    });

    console.log('Perfect Corp: Start task response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as TaskStartResponse;
      console.error('Perfect Corp: Start task error:', errorData);

      throw new PerfectCorpAPIError(
        errorData.error_message || `Failed to start task (${response.status})`,
        errorData.error_code || 'start_task_failed',
        response.status
      );
    }

    const data = await response.json() as TaskStartResponse;
    const taskId = data?.data?.task_id;

    if (!taskId) {
      throw new PerfectCorpAPIError(
        'Task ID not found in response',
        'missing_task_id'
      );
    }

    console.log('Perfect Corp: Task started successfully, ID:', taskId);
    return taskId;
  } catch (error) {
    if (error instanceof PerfectCorpAPIError) {
      throw error;
    }
    throw new PerfectCorpAPIError(
      `Failed to start skin analysis task: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'network_error'
    );
  }
}

// Step 2: Poll for task completion
async function pollTask(
  taskId: string,
  options: { intervalMs?: number; maxAttempts?: number } = {}
): Promise<SkinAnalysisAPIResponse> {
  const { intervalMs = 2000, maxAttempts = 300 } = options;
  const config = getConfig();
  const pollUrl = `${config.baseUrl}/s2s/v2.0/task/skin-analysis/${encodeURIComponent(taskId)}`;

  console.log('Perfect Corp: Starting to poll task:', taskId);
  console.log('Perfect Corp: Poll URL:', pollUrl);
  console.log('Perfect Corp: Poll interval:', intervalMs, 'ms, max attempts:', maxAttempts);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(pollUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
        },
      });

      if (!response.ok) {
        console.error('Perfect Corp: Poll request failed with status:', response.status);
        throw new PerfectCorpAPIError(
          `Polling failed (${response.status})`,
          'poll_failed',
          response.status
        );
      }

      const data = await response.json() as TaskStatusResponse;
      const taskStatus = data?.data?.task_status;

      console.log(`Perfect Corp: Poll attempt ${attempt}/${maxAttempts}, status: ${taskStatus}`);
      console.log('Perfect Corp: Full poll response:', JSON.stringify(data, null, 2));

      if (taskStatus === 'success') {
        const results = data?.data?.results;
        if (!results) {
          throw new PerfectCorpAPIError(
            'Results not found in successful response',
            'missing_results'
          );
        }

        // Check if results contain a ZIP URL
        if (results.url) {
          console.log('Perfect Corp: Downloading and extracting ZIP results from:', results.url);
          const extractedData = await downloadAndExtractResults(results.url);
          console.log('Perfect Corp: Task completed successfully');
          return extractedData;
        }

        console.log('Perfect Corp: Task completed successfully');
        return results;
      }

      if (taskStatus === 'error') {
        console.error('Perfect Corp: Task error details:', JSON.stringify(data, null, 2));
        throw new PerfectCorpAPIError(
          data.error_message || 'Task failed',
          data.error_code || 'task_error'
        );
      }

      // Status is 'processing', continue polling
      if (attempt < maxAttempts) {
        await sleep(intervalMs);
      }
    } catch (error) {
      if (error instanceof PerfectCorpAPIError) {
        throw error;
      }
      console.error('Perfect Corp: Poll attempt failed:', error);

      // Only throw on last attempt, otherwise retry
      if (attempt === maxAttempts) {
        throw new PerfectCorpAPIError(
          `Polling failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'poll_error'
        );
      }

      // Wait before retrying
      await sleep(intervalMs);
    }
  }

  throw new PerfectCorpAPIError(
    `Task did not complete within ${maxAttempts} attempts`,
    'timeout'
  );
}

// Infer skin type from Perfect Corp HEALTH scores (higher = better skin health)
// Note: We use health scores directly here, NOT inverted concern scores
function inferSkinType(oilinessHealth: number, textureHealth: number): 'DRY' | 'OILY' | 'COMBINATION' | 'NORMAL' {
  // Low oiliness health = poor oil control = OILY skin
  if (oilinessHealth < 30) {
    return 'OILY';
  }

  // High oiliness health = good oil control = DRY tendency
  // OR low texture health = rough texture = DRY skin
  if (oilinessHealth > 60 || textureHealth < 20) {
    return 'DRY';
  }

  // Medium oiliness with some texture variation = COMBINATION
  if (oilinessHealth >= 30 && oilinessHealth <= 60 && textureHealth < 40) {
    return 'COMBINATION';
  }

  // Balanced health scores = NORMAL skin
  return 'NORMAL';
}

// Calculate confidence based on how clear the skin type determination is
function calculateSkinTypeConfidence(oilinessHealth: number, textureHealth: number, skinType: string): number {
  // Higher confidence for extreme values, lower for borderline cases
  if (skinType === 'OILY' && oilinessHealth < 20) return 90;
  if (skinType === 'OILY' && oilinessHealth < 30) return 75;

  if (skinType === 'DRY' && (oilinessHealth > 70 || textureHealth < 10)) return 90;
  if (skinType === 'DRY' && (oilinessHealth > 60 || textureHealth < 20)) return 75;

  if (skinType === 'COMBINATION') return 70;
  if (skinType === 'NORMAL') return 80;

  return 60; // Default moderate confidence
}

// Mock data for testing
function getMockSkinAnalysis(): SkinAnalysisResult {
  const skinTypes: Array<'DRY' | 'OILY' | 'COMBINATION' | 'NORMAL'> = ['DRY', 'OILY', 'COMBINATION', 'NORMAL'];
  const randomSkinType = skinTypes[Math.floor(Math.random() * skinTypes.length)];

  return {
    skinType: randomSkinType,
    confidence: 75 + Math.random() * 20, // 75-95% confidence
    concerns: {
      wrinkles: Math.floor(Math.random() * 40), // 0-40%
      spots: Math.floor(Math.random() * 50), // 0-50%
      redness: Math.floor(Math.random() * 45), // 0-45%
      acne: Math.floor(Math.random() * 60), // 0-60%
      oiliness: Math.floor(Math.random() * 70), // 0-70%
      darkCircles: Math.floor(Math.random() * 50), // 0-50%
      texture: Math.floor(Math.random() * 40), // 0-40%
      moisture: Math.floor(Math.random() * 80), // 0-80%
    },
    rawResponse: {
      mock: true,
      message: 'This is mock data for testing. Set USE_MOCK_SKIN_ANALYSIS=false to use real API.',
    },
  };
}

// Main function: Analyze skin image
export async function analyzeSkinImage(imageUrl: string): Promise<SkinAnalysisResult> {
  // Check if mock mode is enabled
  const useMock = process.env.USE_MOCK_SKIN_ANALYSIS === 'true';

  if (useMock) {
    console.log('Mock mode enabled - returning test data');
    return getMockSkinAnalysis();
  }

  try {
    // Step 1: Start the analysis task with image URL directly
    const taskId = await startTask(imageUrl);

    // Step 2: Poll for results
    const apiResult = await pollTask(taskId, {
      intervalMs: 2000,  // Poll every 2 seconds
      maxAttempts: 300,  // Max 10 minutes (300 * 2s = 600s)
    });

    // Transform API response to our format
    // The API returns concerns at the top level with ui_score values
    const oiliness = apiResult.oiliness?.ui_score || 0;
    const texture = apiResult.texture?.ui_score || 0;

    // Infer skin type from oiliness and texture scores
    const inferredSkinType = inferSkinType(oiliness, texture);
    const skinTypeConfidence = calculateSkinTypeConfidence(oiliness, texture, inferredSkinType);

    return {
      skinType: inferredSkinType,
      confidence: skinTypeConfidence,
      concerns: {
        // Invert scores: Perfect Corp returns health scores (higher = better)
        // We need concern scores (higher = worse/more severe)
        wrinkles: 100 - (apiResult.wrinkle?.ui_score || 0),
        spots: 100 - (apiResult.age_spot?.ui_score || 0),
        redness: 100 - (apiResult.redness?.ui_score || 0),
        acne: 100 - (apiResult.acne?.ui_score || 0),
        oiliness: 100 - oiliness,
        darkCircles: 100 - (apiResult.dark_circle_v2?.ui_score || 0),
        texture: 100 - texture,
        moisture: 0, // API doesn't return moisture in this response
      },
      rawResponse: apiResult,
    };
  } catch (error) {
    if (error instanceof PerfectCorpAPIError) {
      throw error;
    }
    throw new PerfectCorpAPIError(
      `Skin analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'analysis_failed'
    );
  }
}

// Validate API configuration (can be called to check if API is properly configured)
export function validateApiConfiguration(): boolean {
  try {
    getConfig();
    return true;
  } catch {
    return false;
  }
}

// Export error class for error handling
export { PerfectCorpAPIError };
