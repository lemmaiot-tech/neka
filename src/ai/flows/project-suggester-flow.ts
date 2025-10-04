
'use server';
/**
 * @fileOverview AI flows for enhancing project requests.
 *
 * - improveDescription - Rewrites a user's project description to be more professional.
 * - suggestFeatures - Suggests features for a project based on its description.
 * - FeatureSuggestion - The return type for the suggestFeatures function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Schema for the feature suggestions
const FeatureSuggestionSchema = z.object({
  uniqueSellingProposition: z.string().describe("A single, standout 'killer feature' or unique angle that makes the project special and gives it a competitive edge."),
  coreFeatures: z.array(z.string()).describe("A list of 3-5 essential, must-have features for the project to be functional (e.g., user registration, product listing)."),
  growthFeatures: z.array(z.string()).describe("A list of 2-3 features designed to attract and retain users (e.g., referral system, loyalty program, social sharing)."),
});

export type FeatureSuggestion = z.infer<typeof FeatureSuggestionSchema>;

/**
 * Takes a raw project description and uses an AI model to rewrite it,
 * making it clearer, more professional, and better structured.
 * @param description The user's original project description.
 * @returns A promise that resolves to the enhanced description string.
 */
export async function improveDescription(description: string): Promise<string> {
  return improveDescriptionFlow(description);
}

/**
 * Takes a project description and uses an AI model to suggest
 * a unique selling proposition and a list of core and growth features.
 * @param description The project description.
 * @returns A promise that resolves to an object containing feature suggestions.
 */
export async function suggestFeatures(description: string): Promise<FeatureSuggestion> {
  return suggestFeaturesFlow(description);
}


// Genkit Flow for improving the description
const improveDescriptionFlow = ai.defineFlow(
  {
    name: 'improveDescriptionFlow',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (description) => {
    const prompt = `You are a professional business analyst and copywriter. A user has submitted a project idea. Your task is to rewrite their description to be clearer, more professional, and well-structured. Do not add new ideas; only enhance the existing description. Respond only with the rewritten text, without any introductory phrases like "Here is the rewritten description:".

User's description: "${description}"`;

    const { text } = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: prompt,
    });
    return text.trim();
  }
);

// Define the prompt for suggesting features once, outside the flow.
const suggestFeaturesPrompt = ai.definePrompt({
  name: 'suggestFeaturesPrompt',
  input: { schema: z.string() },
  output: { schema: FeatureSuggestionSchema },
  prompt: `You are an expert Product Manager specializing in Nigerian startups. A user provides a project description. Based on this description, your task is to generate a list of suggested features.

Your response must include:
1.  **Unique Selling Proposition**: A single, creative "killer feature" or unique market angle that would make this project stand out in the Nigerian market.
2.  **Core Features**: A list of 3-5 absolutely essential features needed for the Minimum Viable Product (MVP).
3.  **Growth Features**: A list of 2-3 features that could be added later to help with user acquisition and retention.

Project Description: {{{prompt}}}`
});


// Genkit Flow for suggesting features
const suggestFeaturesFlow = ai.defineFlow(
  {
    name: 'suggestFeaturesFlow',
    inputSchema: z.string(),
    outputSchema: FeatureSuggestionSchema,
  },
  async (description) => {
    const { output } = await suggestFeaturesPrompt(description);
    if (!output) {
      throw new Error('Failed to generate feature suggestions.');
    }
    return output;
  }
);
