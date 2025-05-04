
'use server';

/**
 * @fileOverview Analiza una conversación en busca de abuso emocional, manipulación y riesgo inminente utilizando IA.
 *
 * - analyze - Una función que invoca el flujo de análisis de conversación.
 * - AnalyzeConversationInput - El tipo de entrada para la función analyze.
 * - AnalyzeConversationOutput - El tipo de retorno para la función analyze.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import type { AnalysisResult } from '@/services/shadai'; // Keep type import
// Placeholder for email sending service - replace with actual implementation
// import { sendEmergencyEmail } from '@/services/email';

const AnalyzeConversationInputSchema = z.object({
  text: z.string().describe('El texto de la conversación a analizar.'),
  // Add gender and relationshipType to input schema
  generoUsuario: z.enum(["hombre", "mujer", "prefiero_no_decirlo"]).describe('El género del usuario que proporciona la conversación.'),
  tipoRelacion: z.enum(["pareja", "amistad", "familiar"]).describe('El tipo de relación entre las personas en la conversación.'),
  // Add user data for context, including optional emergency email
  userData: z.object({
    nombre: z.string(),
    apellido: z.string(),
    edad: z.number(),
    emailEmergencia: z.string().email().optional().or(z.literal('')),
  }).describe('Datos del usuario que proporciona la conversación.'),
});
export type AnalyzeConversationInput = z.infer<typeof AnalyzeConversationInputSchema>;

// Reuse the existing AnalysisResult interface structure within the Zod schema
const AnalyzeConversationOutputSchema = z.object({
  analysisResult: z.object({
    nivel_riesgo: z
      .number()
      .describe('El nivel de riesgo general estimado de abuso, manipulación o peligro inminente (incluyendo suicidio o daño físico), en una escala de 0 (muy bajo) a 100 (muy alto).')
      .min(0)
      .max(100),
    riesgo_inminente: z.boolean().describe('Indica si se detecta un riesgo alto e inminente de daño físico o suicidio.'),
    resumen_riesgo: z.string().describe('Un breve resumen (1-2 frases) explicando la naturaleza del riesgo detectado, especialmente si `riesgo_inminente` es true.'),
    categorias_detectadas: z
      .array(z.string())
      .describe('Categorías específicas de abuso emocional, manipulación o indicadores de riesgo detectados (ej. gaslighting, culpabilización, aislamiento, minimización, ideacion_suicida, amenaza_directa, etc.). Si no se detecta nada, devolver un array vacío.'),
    ejemplos: z
      .array(z.string())
      .describe('Frases textuales exactas de la conversación que ejemplifican las categorías detectadas. Si no hay ejemplos claros, devolver un array vacío.'),
    recomendaciones: z
      .array(z.string())
      .describe('Recomendaciones específicas, detalladas y accionables para la persona que experimenta la conversación, basadas directamente en las categorías y ejemplos detectados. Deben ser elaboradas y explicar el *por qué* de la recomendación en relación al análisis, considerando el contexto de género, la posibilidad de que el usuario sea el agresor y la presencia de riesgo inminente. Evitar consejos genéricos.'),
     posible_agresor: z
      .enum(["usuario", "interlocutor", "ambiguo", "ninguno"])
      .describe('Identificación de quién parece ser el principal perpetrador del abuso/manipulación/riesgo según el análisis. "usuario" si parece ser la persona que envió el texto, "interlocutor" si parece ser la otra persona, "ambiguo" si no está claro o ambos participan, "ninguno" si no se detecta abuso significativo.'),
  }).describe('El resultado detallado del análisis de la conversación.')
});
export type AnalyzeConversationOutput = z.infer<typeof AnalyzeConversationOutputSchema>;


export async function analyze(input: AnalyzeConversationInput): Promise<AnalyzeConversationOutput> {
  const result = await analyzeConversationFlow(input);

  // --- Emergency Email Logic ---
  // Check if risk is high and emergency email is provided
  if (result.analysisResult.riesgo_inminente && input.userData?.emailEmergencia) {
      console.log(`Alto riesgo detectado para ${input.userData.nombre} ${input.userData.apellido}. Intentando notificar a ${input.userData.emailEmergencia}.`);

      // Placeholder: Integrate with an actual email sending service
      try {
          // const emailSent = await sendEmergencyEmail({
          //   to: input.userData.emailEmergencia,
          //   userName: `${input.userData.nombre} ${input.userData.apellido}`,
          //   riskSummary: result.analysisResult.resumen_riesgo,
          //   analysisDetails: result.analysisResult // You might need to format this or attach an image/PDF
          // });
          // if (emailSent) {
          //   console.log("Correo de emergencia enviado exitosamente.");
          // } else {
          //   console.error("Fallo al enviar el correo de emergencia.");
          // }
          console.warn("FUNCIONALIDAD DE ENVÍO DE CORREO NO IMPLEMENTADA. Simulación de envío...");
          // Simulate success for now
           result.analysisResult.recomendaciones.push("Se intentó notificar a tu contacto de emergencia. Busca ayuda profesional inmediatamente.");

      } catch (emailError) {
        console.error("Error al intentar enviar correo de emergencia:", emailError);
         result.analysisResult.recomendaciones.push("Error al intentar notificar al contacto de emergencia. Busca ayuda profesional inmediatamente.");
      }
  } else if (result.analysisResult.riesgo_inminente) {
       console.warn(`Alto riesgo detectado para ${input.userData.nombre} ${input.userData.apellido}, pero no se proporcionó correo de emergencia.`);
       result.analysisResult.recomendaciones.push("Se detectó un riesgo alto, pero no proporcionaste un correo de emergencia. Busca ayuda profesional inmediatamente.");
  }


  return result;
}

const analysisPrompt = ai.definePrompt({
  name: 'conversationAnalysisPrompt',
  input: { schema: AnalyzeConversationInputSchema },
  output: { schema: AnalyzeConversationOutputSchema },
  prompt: `Eres un experto psicólogo especializado en detectar abuso emocional, manipulación y situaciones de riesgo inminente (incluyendo ideación suicida o amenazas de daño físico) en relaciones interpersonales a través de texto. Analiza la siguiente conversación detenidamente, considerando el contexto proporcionado. Tu máxima prioridad es identificar cualquier señal de peligro inmediato.

**Contexto:**
*   **Nombre Usuario:** {{{userData.nombre}}}
*   **Apellido Usuario:** {{{userData.apellido}}}
*   **Edad Usuario:** {{{userData.edad}}}
*   **Género del Usuario que envía el texto:** {{{generoUsuario}}}
*   **Tipo de Relación:** {{{tipoRelacion}}}

**Conversación:**
{{{text}}}

**Instrucciones de Análisis:**

1.  **PRIORIDAD MÁXIMA - Identificar Riesgo Inminente:** Busca activamente señales de:
    *   **Ideación Suicida:** Menciones directas o indirectas de querer morir, desaparecer, autolesionarse, desesperanza extrema ("no puedo más", "sería mejor si no estuviera").
    *   **Amenazas de Daño Físico:** Amenazas explícitas o veladas de violencia hacia el usuario, el interlocutor o terceros.
    *   **Abuso Físico Pasado o Presente:** Menciones de agresiones físicas.
    *   **Desesperación Extrema y Aislamiento Severo:** Indicadores de que la persona está completamente aislada y sin salida.
    *   **Si detectas CUALQUIERA de estas señales, establece \`riesgo_inminente\` en \`true\` y el \`nivel_riesgo\` debe ser 90 o superior.**
    *   En \`resumen_riesgo\`, describe brevemente la naturaleza del peligro (ej. "Se detectó ideación suicida explícita", "Amenazas de violencia física directa").
    *   Las recomendaciones DEBEN priorizar la seguridad inmediata (ver punto 8).

2.  **Identifica Patrones de Abuso/Manipulación:** Busca patrones como gaslighting, culpabilización, aislamiento, minimización, amenazas (no inminentes), condicionamiento del afecto, invalidación, celos excesivos, control, humillación, etc.

3.  **Evalúa la Dinámica:** Considera la dinámica de poder, miedo, intimidación y respeto de límites.

4.  **Considera el Género (si es relevante):** Si el género es 'hombre' o 'mujer' y la relación es 'pareja', ten en cuenta posibles dinámicas de género asociadas al abuso, pero evita estereotipos. Si es 'prefiero_no_decirlo' o no es 'pareja', sé neutral.

5.  **Analiza AMBAS PARTES:** Determina quién ejerce el comportamiento problemático. **Considera seriamente la posibilidad de que el usuario ({{{userData.nombre}}}) sea quien lo ejerce.** Basa tu conclusión en la evidencia textual.

6.  **Determina el Posible Agresor:** Clasifica en \`posible_agresor\`:
    *   \`usuario\`: Si la evidencia sugiere fuertemente que {{{userData.nombre}}} es quien ejerce el comportamiento problemático.
    *   \`interlocutor\`: Si la evidencia sugiere fuertemente que la otra persona ejerce el comportamiento problemático.
    *   \`ambiguo\`: Si ambos muestran comportamientos problemáticos, es confuso, o falta texto.
    *   \`ninguno\`: Si no se detecta abuso/riesgo relevante.

7.  **Estima el Nivel de Riesgo (0-100):** Considera frecuencia, intensidad, tipos de tácticas y **si hay riesgo inminente (esto eleva el riesgo automáticamente a 90+)**.

8.  **Genera el Resultado JSON (estructura \`AnalyzeConversationOutputSchema\`):**
    *   **nivel_riesgo**: Tu estimación numérica.
    *   **riesgo_inminente**: \`true\` o \`false\` según el punto 1.
    *   **resumen_riesgo**: Breve descripción si \`riesgo_inminente\` es \`true\`, o una frase indicando el tipo principal de riesgo si no es inminente pero sí significativo (ej. "Riesgo de manipulación emocional y gaslighting"). Si no hay riesgo, indica "No se detectaron riesgos significativos".
    *   **categorias_detectadas**: Lista precisa (ej. "gaslighting", "control_economico", "amenaza_velada", "ideacion_suicida"). Array vacío si no hay.
    *   **ejemplos**: Frases textuales *exactas* como ejemplos claros. Array vacío si no hay.
    *   **recomendaciones**: Proporciona recomendaciones específicas, detalladas y accionables. **Adapta según \`posible_agresor\` y \`riesgo_inminente\`**:
        *   **Si \`riesgo_inminente\` es \`true\`**:
            *   **PRIORIDAD ABSOLUTA:** "Se ha detectado una situación de riesgo potencialmente grave [mencionar brevemente por qué, ej. 'debido a ideación suicida' / 'debido a amenazas']. **Tu seguridad es lo más importante ahora mismo.**"
            *   "**CONTACTA AYUDA URGENTE:** Llama inmediatamente a [Número de línea de ayuda local/nacional para crisis/suicidio/violencia - ej. 911, Línea de la Vida, etc.] o acude a la sala de emergencias más cercana."
            *   "Si es seguro, informa a alguien de confianza (familiar, amigo) sobre lo que está sucediendo."
            *   "No estás solo/a. Hay profesionales listos para ayudarte en este momento crítico."
            *   (Si el agresor es el interlocutor): "Si te sientes amenazado/a físicamente, busca un lugar seguro y contacta a las autoridades."
            *   (Si el agresor es el usuario): "Es vital que busques ayuda profesional de inmediato para manejar estos pensamientos/impulsos. Llama a [Número de línea de ayuda]."
        *   **Si \`riesgo_inminente\` es \`false\` (ajusta según \`posible_agresor\`):**
            *   **Si \`posible_agresor\` es \`interlocutor\`**: Enfócate en protección y empoderamiento del usuario ({{{userData.nombre}}}).
                *   **Explica impacto:** "La frase '[ejemplo]' es un claro intento de [categoría detectada]. Este tipo de comportamiento busca [explicación del impacto psicológico, ej. 'minar tu confianza en tu propia percepción', 'hacerte sentir culpable para ceder', 'aislarte de tu red de apoyo']. Reconocer esta táctica es fundamental."
                *   **Estrategias concretas:** "Ante frases como '[ejemplo]', en lugar de [reacción común pero poco útil], podrías intentar responder con firmeza pero sin escalar, por ejemplo: 'No estoy de acuerdo con esa visión de las cosas' o 'Necesito espacio para procesar esto'. Documentar estos intercambios (fechas, frases exactas) puede ser útil si necesitas buscar ayuda externa o si la situación escala. Considera hablar con [amigo de confianza, familiar no involucrado directamente] sobre cómo te hacen sentir estas interacciones para tener perspectiva externa."
                *   **Consecuencias a largo plazo:** "Exponerte continuamente a [categoría detectada] puede afectar seriamente tu autoestima y bienestar emocional. Es importante evaluar si esta dinámica es sostenible para ti."
                *   **Recursos (si aplica según riesgo):** "Si estos patrones son frecuentes o intensos, considera buscar apoyo de un terapeuta especializado en relaciones o abuso emocional. Organizaciones como [nombre genérico o tipo de organización local de apoyo a víctimas] pueden ofrecer recursos valiosos."
            *   **Si \`posible_agresor\` es \`usuario\`**: Enfócate en autoconciencia y cambio de comportamiento de {{{userData.nombre}}}.
                *   **Identifica la acción:** "Usar frases como '[ejemplo]' se considera [categoría detectada]. Este tipo de comunicación puede [explicación del impacto en la otra persona, ej. 'herir profundamente a tu [tipoRelacion]', 'generar un ambiente de miedo o tensión', 'erosionar la confianza mutua']."
                *   **Invita a la reflexión:** "¿Qué emoción o necesidad subyacente te lleva a reaccionar de esta manera? ¿Frustración, miedo, inseguridad? Reflexiona sobre cómo te sentirías si te hablaran así. ¿Es esa la forma en que quieres tratar a alguien en una relación de [tipoRelacion]?"
                *   **Alternativas saludables:** "Explora formas de expresar tus emociones o necesidades sin recurrir a [categoría detectada]. Por ejemplo, en lugar de culpar, intenta usar mensajes 'Yo': 'Me siento [emoción] cuando [situación objetiva], ¿podemos encontrar una forma diferente de manejar esto?'. La terapia individual puede ser extremadamente útil para entender el origen de estos patrones y desarrollar habilidades de comunicación más saludables."
            *   **Si \`posible_agresor\` es \`ambiguo\`**: Reconoce la toxicidad mutua.
                *   **Señala la dinámica:** "Se observan comportamientos problemáticos en ambas partes. Por ejemplo, tú dijiste '[ejemplo usuario]' que puede interpretarse como [categoría], mientras que la otra persona respondió con '[ejemplo interlocutor]', lo cual parece ser [categoría]. Esta dinámica de ataque y contraataque es dañina para ambos y para la relación."
                *   **Recomendaciones duales:** "Es crucial que ambos reflexionen sobre su contribución a esta dinámica tóxica. Consideren buscar terapia individual para entender sus propios patrones. Si ambos están dispuestos a cambiar y pueden comunicarse sin agresiones, la terapia de [tipoRelacion, ej. pareja] podría ayudar a establecer límites y una comunicación más sana, pero esto requiere un compromiso real de ambas partes y, a menudo, trabajo individual previo."
            *   **Si \`posible_agresor\` es \`ninguno\`**: Ofrece consejos generales si aplica o indica que no hay señales preocupantes.
                *   "Basado en este fragmento, no se detectaron señales claras de abuso, manipulación o riesgo inminente. Sin embargo, mantener una comunicación abierta, respetuosa y empática es siempre fundamental en cualquier relación ([tipoRelacion])."
        *   **En todos los casos (excepto riesgo inminente):** Las recomendaciones deben ser **elaboradas, accionables, explicar el porqué**, y relacionarse directamente con \`categorias_detectadas\` y \`ejemplos\`. Evita consejos vagos.

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
              riesgo_inminente: false, // Default to false
              resumen_riesgo: "Error: El modelo no proporcionó una respuesta válida.",
              categorias_detectadas: [],
              ejemplos: [],
              recomendaciones: ["Error: No se pudo analizar la conversación. El modelo no proporcionó una respuesta válida."],
              posible_agresor: "ninguno", // Default value
          }
      };
  }

   // Basic check for potentially triggering emergency notification based on keywords if AI missed it (redundancy)
   // This is a very basic example and might need refinement
   const suicidalKeywords = ["suicidarme", "matarme", "desaparecer", "no quiero vivir", "acabar con todo"];
   const threatKeywords = ["te voy a matar", "te voy a hacer daño", "voy a lastimarte"];
   const conversationLower = input.text.toLowerCase();

   let highRiskKeywordDetected = false;
   if (suicidalKeywords.some(keyword => conversationLower.includes(keyword)) ||
       threatKeywords.some(keyword => conversationLower.includes(keyword))) {
       highRiskKeywordDetected = true;
       // If keywords detected but AI didn't flag it, potentially override or log warning
       if (!output.analysisResult.riesgo_inminente) {
            console.warn("Keyword de alto riesgo detectada, pero la IA no marcó riesgo_inminente=true. Revisar lógica.");
            // Optionally force high risk if keywords are found (use with caution)
            // output.analysisResult.riesgo_inminente = true;
            // output.analysisResult.nivel_riesgo = Math.max(output.analysisResult.nivel_riesgo, 95);
            // output.analysisResult.resumen_riesgo = output.analysisResult.resumen_riesgo + " (Posible riesgo detectado por palabras clave)";
       }
   }


  console.log("Resultado del análisis:", output.analysisResult); // Log output for debugging
  // Assuming the prompt output schema is directly AnalyzeConversationOutputSchema:
  return output; // Return the whole output object as defined in schema
});
