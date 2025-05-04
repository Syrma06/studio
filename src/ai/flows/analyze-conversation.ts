
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

1.  **Identifica Patrones:** Busca patrones de comportamiento como gaslighting (hacer dudar a la víctima de su realidad), culpabilización, aislamiento social, minimización de sentimientos/problemas, amenazas (veladas o directas), condicionamiento del afecto ("si me quisieras..."), invalidación emocional, celos excesivos, control (económico, social, de movimiento), humillación, etc.
2.  **Evalúa la Dinámica:** Considera la dinámica de poder. ¿Una persona impone su voluntad? ¿Hay miedo o intimidación? ¿Se respetan los límites?
3.  **Considera el Género (si es relevante):** Si el género es 'hombre' o 'mujer' y la relación es 'pareja', ten en cuenta posibles dinámicas de género asociadas al abuso (ej. control económico, roles tradicionales forzados), pero evita estereotipos. Si el género es 'prefiero_no_decirlo' o la relación no es 'pareja', mantén un enfoque neutral en cuanto a género.
4.  **Analiza AMBAS PARTES:** Es crucial determinar quién ejerce el comportamiento abusivo/manipulador. **Considera seriamente la posibilidad de que la persona que envió el texto (el usuario) sea quien está ejerciendo el abuso.** No asumas que el usuario es siempre la víctima. Basa tu conclusión en la evidencia textual (quién dice qué, cómo responde el otro).
5.  **Determina el Posible Agresor:** Basado en tu análisis, clasifica quién parece ser el principal agresor en el campo \`posible_agresor\`. Las opciones son:
    *   \`usuario\`: Si la evidencia textual sugiere fuertemente que la persona que envió la conversación es quien ejerce el comportamiento problemático.
    *   \`interlocutor\`: Si la evidencia sugiere fuertemente que la otra persona en la conversación es quien ejerce el comportamiento problemático.
    *   \`ambiguo\`: Si ambos muestran comportamientos problemáticos significativos, la dinámica es confusa, o no hay suficiente texto para determinar claramente un agresor principal.
    *   \`ninguno\`: Si no se detecta abuso o manipulación relevante.
6.  **Genera el Resultado JSON:** Completa el siguiente objeto JSON con tu análisis detallado:

    *   **nivel_riesgo**: Estima un nivel de riesgo general (0-100) de abuso/manipulación. Considera frecuencia, intensidad y tipos de tácticas. Un incidente aislado de culpabilización es menos riesgoso que amenazas constantes.
    *   **categorias_detectadas**: Lista las categorías específicas detectadas (ej. "gaslighting", "control económico", "amenaza velada"). Sé preciso. Array vacío si no hay.
    *   **ejemplos**: Extrae frases textuales *exactas* como ejemplos claros para cada categoría detectada. Array vacío si no hay.
    *   **recomendaciones**: Proporciona recomendaciones específicas, detalladas y accionables. **Adapta las recomendaciones según quién sea el \`posible_agresor\`**:
        *   **Si \`posible_agresor\` es \`interlocutor\`**: Enfócate en la protección y empoderamiento del usuario.
            *   **Explica el impacto:** "La frase '[ejemplo]' es un claro intento de [categoría detectada], lo cual busca [explicación del impacto psicológico, ej. 'minar tu confianza', 'hacerte sentir culpable', 'aislarte']. Reconocer esto es el primer paso."
            *   **Estrategias concretas:** "Podrías responder con: 'No estoy de acuerdo con esa visión de las cosas' o 'Necesito espacio para pensar'. Documentar estos intercambios (fechas, frases) puede ser útil si la situación escala. Considera hablar con [amigo de confianza, familiar] sobre cómo te sientes."
            *   **Recursos (si aplica):** "Si te sientes en peligro o el abuso es constante, busca ayuda profesional. Organizaciones como [nombre genérico o tipo de organización local] ofrecen apoyo."
        *   **Si \`posible_agresor\` es \`usuario\`**: Enfócate en la autoconciencia y el cambio de comportamiento del usuario.
            *   **Identifica la acción:** "Usar frases como '[ejemplo]' se considera [categoría detectada]. Esto puede [explicación del impacto en la otra persona, ej. 'herir a tu pareja', 'generar miedo', 'erosionar la confianza']."
            *   **Invita a la reflexión:** "¿Qué te lleva a reaccionar de esta manera? ¿Hay alguna necesidad no satisfecha que intentas comunicar de forma inadecuada? Considera cómo te sentirías si te hablaran así."
            *   **Alternativas saludables:** "Intenta expresar tu frustración sin atacar, por ejemplo: 'Me siento [emoción] cuando [situación], ¿podemos hablar sobre cómo manejarlo diferente?'. La terapia individual puede ser muy útil para entender y modificar estos patrones de comunicación."
        *   **Si \`posible_agresor\` es \`ambiguo\`**: Reconoce la toxicidad mutua y sugiere pasos individuales y relacionales.
            *   **Señala la dinámica:** "Se observan comportamientos problemáticos en ambas partes, como [ejemplo usuario] que es [categoría] y [ejemplo interlocutor] que es [categoría]. Esta dinámica es dañina para ambos."
            *   **Recomendaciones duales:** "Es importante que ambos reflexionen sobre su parte. Consideren buscar terapia individual para entender sus propios patrones. Si ambos están dispuestos y es seguro, la terapia de pareja podría ayudar a establecer una comunicación más sana, pero sólo si cesan las agresiones."
        *   **Si \`posible_agresor\` es \`ninguno\`**: Ofrece consejos generales si aplica o indica que no hay señales preocupantes.
            *   "No se detectaron señales claras de abuso o manipulación en este fragmento. Sin embargo, mantener una comunicación abierta y respetuosa es siempre importante en cualquier relación."
        *   **En todos los casos:** Las recomendaciones deben ser **elaboradas, accionables, explicar el porqué**, y relacionarse directamente con \`categorias_detectadas\` y \`ejemplos\`. Evita consejos vagos.

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


