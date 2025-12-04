/**
 * Validates the environment variables required for running Neopilot Code
 * based on the selected provider (Neopilot API, AWS Bedrock, Google Vertex AI, or Microsoft Foundry)
 */
export function validateEnvironmentVariables() {
  const useBedrock = process.env.NEOPILOT_USE_BEDROCK === "1";
  const useVertex = process.env.NEOPILOT_USE_VERTEX === "1";
  const useFoundry = process.env.NEOPILOT_USE_FOUNDRY === "1";
  const anthropicApiKey = process.env.NEOPILOT_API_KEY;
  const neopilotOAuthToken = process.env.NEOPILOT_OAUTH_TOKEN;

  const errors: string[] = [];

  // Check for mutual exclusivity between providers
  const activeProviders = [useBedrock, useVertex, useFoundry].filter(Boolean);
  if (activeProviders.length > 1) {
    errors.push(
      "Cannot use multiple providers simultaneously. Please set only one of: NEOPILOT_USE_BEDROCK, NEOPILOT_USE_VERTEX, or NEOPILOT_USE_FOUNDRY.",
    );
  }

  if (!useBedrock && !useVertex && !useFoundry) {
    if (!anthropicApiKey && !neopilotOAuthToken) {
      errors.push(
        "Either NEOPILOT_API_KEY or NEOPILOT_OAUTH_TOKEN is required when using direct Neopilot API.",
      );
    }
  } else if (useBedrock) {
    const awsRegion = process.env.AWS_REGION;
    const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const awsBearerToken = process.env.AWS_BEARER_TOKEN_BEDROCK;

    // AWS_REGION is always required for Bedrock
    if (!awsRegion) {
      errors.push("AWS_REGION is required when using AWS Bedrock.");
    }

    // Either bearer token OR access key credentials must be provided
    const hasAccessKeyCredentials = awsAccessKeyId && awsSecretAccessKey;
    const hasBearerToken = awsBearerToken;

    if (!hasAccessKeyCredentials && !hasBearerToken) {
      errors.push(
        "Either AWS_BEARER_TOKEN_BEDROCK or both AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are required when using AWS Bedrock.",
      );
    }
  } else if (useVertex) {
    const requiredVertexVars = {
      NEOPILOT_VERTEX_PROJECT_ID: process.env.NEOPILOT_VERTEX_PROJECT_ID,
      NEOPILOT_ML_REGION: process.env.NEOPILOT_ML_REGION,
    };

    Object.entries(requiredVertexVars).forEach(([key, value]) => {
      if (!value) {
        errors.push(`${key} is required when using Google Vertex AI.`);
      }
    });
  } else if (useFoundry) {
    const foundryResource = process.env.NEOPILOT_FOUNDRY_RESOURCE;
    const foundryBaseUrl = process.env.NEOPILOT_FOUNDRY_BASE_URL;

    // Either resource name or base URL is required
    if (!foundryResource && !foundryBaseUrl) {
      errors.push(
        "Either NEOPILOT_FOUNDRY_RESOURCE or NEOPILOT_FOUNDRY_BASE_URL is required when using Microsoft Foundry.",
      );
    }
  }

  if (errors.length > 0) {
    const errorMessage = `Environment variable validation failed:\n${errors.map((e) => `  - ${e}`).join("\n")}`;
    throw new Error(errorMessage);
  }
}
