'use server';

/**
 * @fileOverview Analiza una conversación en busca de abuso emocional y manipulación utilizando IA.
 *
 * - analyze - Una función que invoca el flujo de análisis de conversación.
 * - AnalyzeConversationInput - El tipo de entrada para la función analyze.
 * - AnalyzeConversationOutput - El tipo de retorno para la función analyze.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import type { AnalysisResult } from '@/services/shadai'; // Keep type import

const AnalyzeConversationInputSchema = z.object({
  text: z.string().describe('El texto de la conversación a analizar.'),
});
export type AnalyzeConversationInput = z.infer<typeof AnalyzeConversationInputSchema>;

// Reuse the existing AnalysisResult interface structure within the Zod schema
const AnalyzeConversationOutputSchema = z.object({
  analysisResult: z.object({
    nivel_riesgo: z
      .number()
      .describe('El nivel de riesgo general estimado de abuso o manipulación, en una escala de 0 (muy bajo) a 100 (muy alto).')
      .min(0)
      .max(100),
    categorias_detectadas: z
      .array(z.string())
      .describe('Categorías específicas de abuso emocional o manipulación detectadas (ej. gaslighting, culpabilización, aislamiento, minimización, etc.). Si no se detecta nada, devolver un array vacío.'),
    ejemplos: z
      .array(z.string())
      .describe('Frases textuales exactas de la conversación que ejemplifican las categorías detectadas. Si no hay ejemplos claros, devolver un array vacío.'),
    recomendaciones: z
      .array(z.string())
      .describe('Recomendaciones específicas, detalladas y accionables para la persona que experimenta la conversación, basadas directamente en las categorías y ejemplos detectados. Deben ser elaboradas y explicar el *por qué* de la recomendación en relación al análisis. Evitar consejos genéricos.'),
  }).describe('El resultado detallado del análisis de la conversación.')
});
export type AnalyzeConversationOutput = z.infer<typeof AnalyzeConversationOutputSchema>;


export async function analyze(input: AnalyzeConversationInput): Promise<AnalyzeConversationOutput> {
  return analyzeConversationFlow(input);
}

const analysisPrompt = ai.definePrompt({
  name: 'conversationAnalysisPrompt',
  input: { schema: AnalyzeConversationInputSchema },
  output: { schema: AnalyzeConversationOutputSchema },
  prompt: `Eres un experto psicólogo especializado en detectar abuso emocional y manipulación en relaciones interpersonales a través de texto. Analiza la siguiente conversación detenidamente.

Conversación:
{{{text}}}

Basado en tu análisis experto, completa el siguiente objeto JSON:

1.  **nivel_riesgo**: Estima un nivel de riesgo general (0-100) que indique la probabilidad e intensidad del abuso emocional o manipulación presente. Considera la frecuencia, severidad y tipo de tácticas observadas.
2.  **categorias_detectadas**: Identifica y lista las categorías específicas de abuso o manipulación que encuentres (ej. "gaslighting", "culpabilización", "aislamiento", "minimización", "amenazas veladas", "condicionamiento del afecto", "generalización excesiva", "invalidación emocional"). Sé preciso. Si no detectas nada, deja el array vacío.
3.  **ejemplos**: Extrae frases textuales exactas de la conversación que sirvan como ejemplos claros de las categorías detectadas. Si encuentras múltiples ejemplos para una categoría, incluye los más representativos. Si no hay ejemplos claros, deja el array vacío.
4.  **recomendaciones**: Proporciona recomendaciones MUY específicas, elaboradas y accionables para la persona que está en esta conversación. Las recomendaciones deben:
    *   Estar directamente relacionadas con las 'categorias_detectadas' y los 'ejemplos'.
    *   Explicar *por qué* esa táctica específica es problemática (ej. "La frase '...' es un ejemplo de gaslighting porque intenta hacerte dudar de tu percepción. Una recomendación es...").
    *   Ofrecer pasos concretos y detallados (ej. "En lugar de aceptar la culpa, podrías responder con 'No soy responsable de tus emociones. Hablemos de cómo resolver esto'. Considera también documentar estos incidentes...").
    *   Evitar consejos genéricos como "busca ayuda" o "establece límites" sin explicar *cómo* hacerlo en el contexto específico de la conversación analizada. Adapta el consejo a la situación. Si el riesgo es alto, sugiere buscar ayuda profesional como una recomendación *adicional* y específica, explicando por qué es necesario en este caso.

Asegúrate de que tu salida sea únicamente el objeto JSON con la estructura definida en 'AnalyzeConversationOutputSchema', sin ningún texto introductorio o explicaciones adicionales fuera del JSON.`,
});


const analyzeConversationFlow = ai.defineFlow<
  typeof AnalyzeConversationInputSchema,
  typeof AnalyzeConversationOutputSchema
>({
  name: 'analyzeConversationFlow',
  inputSchema: AnalyzeConversationInputSchema,
  outputSchema: AnalyzeConversationOutputSchema,
},
async input => {
  const { output } = await analysisPrompt(input);

  // The prompt is configured to return the exact output schema.
  if (!output) {
      // Handle cases where the model might fail to return valid JSON
      // You could return a default error state or throw an error
      console.error("El modelo no devolvió una salida válida.");
      // Return a default/error structure matching the schema
      return {
          analysisResult: {
              nivel_riesgo: 0,
              categorias_detectadas: [],
              ejemplos: [],
              recomendaciones: ["Error: No se pudo analizar la conversación. El modelo no proporcionó una respuesta válida."],
          }
      };
  }
  // Make sure the output structure matches AnalyzeConversationOutput
  // If analysisPrompt's output schema directly matches AnalyzeConversationOutputSchema,
  // we can return output directly. Otherwise, map it.
  // Assuming the prompt output schema is directly AnalyzeConversationOutputSchema:
  return output;

  // If the prompt output schema was slightly different, you might map it like this:
  // return {
  //   analysisResult: {
  //     nivel_riesgo: output.analysisResult.nivel_riesgo,
  //     categorias_detectadas: output.analysisResult.categorias_detectadas,
  //     ejemplos: output.analysisResult.ejemplos,
  //     recomendaciones: output.analysisResult.recomendaciones,
  //   }
  // };
});
