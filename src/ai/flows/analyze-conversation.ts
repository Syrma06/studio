'use server';

/**
 * @fileOverview Analiza una conversación en busca de abuso emocional y manipulación.
 *
 * - analyzeConversationFlow - Una función que analiza una conversación en busca de abuso emocional y manipulación.
 * - AnalyzeConversationInput - El tipo de entrada para la función analyzeConversationFlow.
 * - AnalyzeConversationOutput - El tipo de retorno para la función analyzeConversationFlow.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import {analyzeConversation} from '@/services/shadai';
import {AnalysisResult} from '@/services/shadai';

const AnalyzeConversationInputSchema = z.object({
  text: z.string().describe('El texto de la conversación a analizar.'),
});
export type AnalyzeConversationInput = z.infer<typeof AnalyzeConversationInputSchema>;

const AnalyzeConversationOutputSchema = z.object({
  analysisResult: z.object({
    nivel_riesgo: z.number().describe('El nivel de riesgo general, de 0 a 100.'),
    categorias_detectadas: z.array(z.string()).describe('Categorías de abuso detectadas en la conversación.'),
    ejemplos: z.array(z.string()).describe('Frases de ejemplo de la conversación que indican abuso.'),
    recomendaciones: z.array(z.string()).describe('Recomendaciones para el usuario basadas en el análisis.'),
  }).describe('El resultado del análisis de la conversación.')
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
  // Directly call the mock service function
  const analysisResult: AnalysisResult = await analyzeConversation(input.text);

  // Return the result in the expected output format
  return {
    analysisResult: analysisResult,
  };
});
