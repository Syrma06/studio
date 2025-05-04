
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
  // Add gender and relationshipType to input schema
  generoUsuario: z.enum(["hombre", "mujer", "prefiero_no_decirlo"]).describe('El género del usuario que proporciona la conversación.'),
  tipoRelacion: z.enum(["pareja", "amistad", "familiar"]).describe('El tipo de relación entre las personas en la conversación.'),
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
      .describe('Recomendaciones específicas, detalladas y accionables para la persona que experimenta la conversación, basadas directamente en las categorías y ejemplos detectados. Deben ser elaboradas y explicar el *por qué* de la recomendación en relación al análisis, considerando el contexto de género y la posibilidad de que el usuario sea el agresor. Evitar consejos genéricos.'),
     posible_agresor: z
      .enum(["usuario", "interlocutor", "ambiguo", "ninguno"])
      .describe('Identificación de quién parece ser el principal perpetrador del abuso/manipulación según el análisis. "usuario" si parece ser la persona que envió el texto, "interlocutor" si parece ser la otra persona, "ambiguo" si no está claro o ambos participan, "ninguno" si no se detecta abuso significativo.'),
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
  prompt: `Eres un experto psicólogo especializado en detectar abuso emocional y manipulación en relaciones interpersonales a través de texto. Analiza la siguiente conversación detenidamente, considerando el contexto proporcionado.

**Contexto:**
*   **Género del Usuario que envía el texto:** {{{generoUsuario}}}
*   **Tipo de Relación:** {{{tipoRelacion}}}

**Conversación:**
{{{text}}}

**Instrucciones de Análisis:**

1.  **Identifica Patrones:** Busca patrones de comportamiento como gaslighting, culpabilización, aislamiento, minimización, amenazas (veladas o directas), condicionamiento del afecto, invalidación emocional, celos excesivos, control, etc.
2.  **Evalúa la Dinámica:** Considera la dinámica de poder y cómo se manifiesta en la conversación. ¿Hay un desequilibrio claro? ¿Una persona parece dominar o intimidar a la otra?
3.  **Considera el Género (si es relevante):** Si el género es 'hombre' o 'mujer' y la relación es 'pareja', ten en cuenta posibles dinámicas de género asociadas al abuso, pero evita estereotipos. Si el género es 'prefiero_no_decirlo' o la relación no es 'pareja', mantén un enfoque neutral.
4.  **Analiza AMBAS PARTES:** Es crucial determinar quién ejerce el comportamiento abusivo/manipulador. **Considera la posibilidad de que la persona que envió el texto (el usuario) sea quien está ejerciendo el abuso.** No asumas automáticamente que el usuario es la víctima. Basa tu conclusión en la evidencia del texto.
5.  **Determina el Posible Agresor:** Basado en tu análisis, clasifica quién parece ser el principal agresor en el campo 'posible_agresor'. Las opciones son:
    *   `usuario`: Si la evidencia textual sugiere que la persona que envió la conversación es quien ejerce el comportamiento problemático.
    *   `interlocutor`: Si la evidencia sugiere que la otra persona en la conversación es quien ejerce el comportamiento problemático.
    *   `ambiguo`: Si ambos muestran comportamientos problemáticos significativos o no está claro quién es el principal agresor.
    *   `ninguno`: Si no se detecta abuso o manipulación relevante.
6.  **Genera el Resultado JSON:** Completa el siguiente objeto JSON con tu análisis detallado:

    *   **nivel_riesgo**: Estima un nivel de riesgo general (0-100) de abuso/manipulación. Considera frecuencia, severidad y tipos de tácticas.
    *   **categorias_detectadas**: Lista las categorías específicas detectadas. Sé preciso. Array vacío si no hay.
    *   **ejemplos**: Extrae frases textuales *exactas* como ejemplos claros. Array vacío si no hay.
    *   **recomendaciones**: Proporciona recomendaciones específicas, detalladas y accionables. **Adapta las recomendaciones según quién sea el 'posible_agresor'**:
        *   **Si el 'posible_agresor' es 'interlocutor'**: Enfócate en proteger al usuario. Explica por qué las tácticas son dañinas (ej., "La frase '...' es gaslighting, busca hacerte dudar. Esto puede minar tu autoestima."). Ofrece estrategias concretas (ej., "Documenta estos incidentes.", "Busca apoyo externo.", "Establece límites claros diciendo 'No acepto que me hables así'."). Recomienda ayuda profesional si el riesgo es alto.
        *   **Si el 'posible_agresor' es 'usuario'**: Enfócate en la autoconciencia y el cambio de comportamiento del usuario. Explica por qué *sus* acciones son problemáticas (ej., "Usar frases como '...' es culpabilizar a tu pareja, lo cual es una forma de manipulación."). Sugiere reflexión y alternativas saludables (ej., "Considera por qué reaccionas así.", "Busca formas de comunicar tus necesidades sin herir.", "La terapia puede ayudarte a entender y cambiar estos patrones.").
        *   **Si el 'posible_agresor' es 'ambiguo'**: Reconoce la toxicidad mutua. Recomienda terapia individual para ambos y posiblemente terapia de pareja (si es seguro y apropiado). Sugiere enfocarse en la comunicación no violenta.
        *   **Si el 'posible_agresor' es 'ninguno'**: Ofrece consejos generales sobre comunicación saludable si aplica, o simplemente indica que no se detectaron señales preocupantes.
        *   **En todos los casos:** Las recomendaciones deben ser **puntuales, accionables y explicar el porqué**, relacionándolas directamente con las categorías y ejemplos. Evita consejos vagos.

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
  console.log("Analizando con Input:", input); // Log input for debugging
  const { output } = await analysisPrompt(input);

  if (!output || !output.analysisResult) { // Check if analysisResult exists
      console.error("El modelo no devolvió una salida válida o completa.");
      // Return a default/error structure matching the schema
      return {
          analysisResult: {
              nivel_riesgo: 0,
              categorias_detectadas: [],
              ejemplos: [],
              recomendaciones: ["Error: No se pudo analizar la conversación. El modelo no proporcionó una respuesta válida."],
              posible_agresor: "ninguno", // Default value
          }
      };
  }

  console.log("Resultado del análisis:", output.analysisResult); // Log output for debugging
  // Assuming the prompt output schema is directly AnalyzeConversationOutputSchema:
  return output; // Return the whole output object as defined in schema
});

    