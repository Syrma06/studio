'use server';

/**
 * @fileOverview Analyzes a conversation for emotional abuse and manipulation.
 *
 * - analyzeConversationFlow - A function that analyzes a conversation for emotional abuse and manipulation.
 * - AnalyzeConversationInput - The input type for the analyzeConversationFlow function.
 * - AnalyzeConversationOutput - The return type for the analyzeConversationFlow function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import {analyzeConversation} from '@/services/shadai';
import {AnalysisResult} from '@/services/shadai';

const AnalyzeConversationInputSchema = z.object({
  text: z.string().describe('The conversation text to analyze.'),
});
export type AnalyzeConversationInput = z.infer<typeof AnalyzeConversationInputSchema>;

const AnalyzeConversationOutputSchema = z.object({
  analysisResult: z.object({
    nivel_riesgo: z.number().describe('The overall risk level, from 0 to 100.'),
    categorias_detectadas: z.array(z.string()).describe('Categories of abuse detected in the conversation.'),
    ejemplos: z.array(z.string()).describe('Example phrases from the conversation that indicate abuse.'),
    recomendaciones: z.array(z.string()).describe('Recommendations for the user based on the analysis.'),
  }).describe('The result of analyzing the conversation.')
});
export type AnalyzeConversationOutput = z.infer<typeof AnalyzeConversationOutputSchema>;


export async function analyze(input: AnalyzeConversationInput): Promise<AnalyzeConversationOutput> {
  return analyzeConversationFlow(input);
}

const analyzeConversationFlow = ai.defineFlow<
  typeof AnalyzeConversationInputSchema,
  typeof AnalyzeConversationOutputSchema
>({
  name: 'analyzeConversationFlow',
  inputSchema: AnalyzeConversationInputSchema,
  outputSchema: AnalyzeConversationOutputSchema,
},
async input => {
  const analysisResult: AnalysisResult = await analyzeConversation(input.text);

  return {
    analysisResult: analysisResult,
  };
});
