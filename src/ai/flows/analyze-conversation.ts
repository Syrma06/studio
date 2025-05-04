
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
  tipoRelacion: z.enum(["pareja", "amistad", "familiar", "laboral", "grupo"]).describe('El tipo de relación entre las personas en la conversación.'), // Added laboral, grupo
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
    resumen_riesgo: z.string().describe('Un breve resumen (1-2 frases) explicando la naturaleza del riesgo detectado, especialmente si `riesgo_inminente` es true. Menciona si el comportamiento parece influenciado por fuentes externas si es relevante.'),
    categorias_detectadas: z
      .array(z.string())
      .describe('Categorías específicas de abuso emocional, manipulación o indicadores de riesgo detectados (ej. gaslighting, culpabilización, aislamiento, minimización, ideacion_suicida, amenaza_directa, etc.). Si no se detecta nada, devolver un array vacío.'),
    ejemplos: z
      .array(z.string())
      .describe('Frases textuales exactas de la conversación que ejemplifican las categorías detectadas. Si no hay ejemplos claros, devolver un array vacío.'),
    recomendaciones: z
      .array(z.string())
      .describe('Recomendaciones específicas, detalladas y accionables para la persona que experimenta la conversación, basadas directamente en las categorías y ejemplos detectados. Deben ser elaboradas y explicar el *por qué* de la recomendación en relación al análisis, considerando el contexto de género, la posibilidad de que el usuario sea el agresor, quién es la persona afectada y la presencia de riesgo inminente. Evitar consejos genéricos. Menciona si el comportamiento parece influenciado por fuentes externas si es relevante.'),
     posible_agresor: z
      .enum(["usuario", "interlocutor", "ambiguo", "ninguno"])
      .describe('Identificación de quién parece ser el principal perpetrador del abuso/manipulación/riesgo según el análisis. "usuario" si parece ser la persona que envió el texto, "interlocutor" si parece ser la otra persona, "ambiguo" si no está claro o ambos participan, "ninguno" si no se detecta abuso significativo.'),
     persona_afectada: z // Added field
        .enum(["usuario", "interlocutor", "ambos", "grupo", "ninguno"])
        .describe('Identificación de quién parece ser la principal persona afectada negativamente por el comportamiento problemático detectado. "usuario" si es la persona que envió el texto, "interlocutor" si es la otra persona (o principal interlocutor), "ambos" si ambas partes se ven afectadas negativamente, "grupo" si el impacto negativo es en varias personas de un grupo, "ninguno" si no se detecta un impacto negativo claro en nadie.')
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
    *   Las recomendaciones DEBEN priorizar la seguridad inmediata (ver punto 9).

2.  **Identifica Patrones de Abuso/Manipulación:** Busca patrones como gaslighting, culpabilización, aislamiento, minimización, amenazas (no inminentes), condicionamiento del afecto, invalidación, celos excesivos, control, humillación, etc.

3.  **Evalúa la Dinámica:** Considera la dinámica de poder, miedo, intimidación y respeto de límites.

4.  **Considera el Género (si es relevante):** Si el género es 'hombre' o 'mujer' y la relación es 'pareja' o 'familiar', ten en cuenta posibles dinámicas de género asociadas al abuso, pero evita estereotipos. Si es 'prefiero_no_decirlo' o la relación es 'amistad' o 'laboral', sé más neutral en este aspecto.

5.  **Analiza AMBAS PARTES (Origen):** Determina quién ejerce principalmente el comportamiento problemático. **Considera seriamente la posibilidad de que el usuario ({{{userData.nombre}}}) sea quien lo ejerce.** Basa tu conclusión en la evidencia textual.

6.  **Determina el Posible Agresor (\`posible_agresor\`):** Clasifica en \`posible_agresor\`:
    *   \`usuario\`: Si la evidencia sugiere fuertemente que {{{userData.nombre}}} es quien ejerce el comportamiento problemático.
    *   \`interlocutor\`: Si la evidencia sugiere fuertemente que la otra persona (o la principal si son varios) ejerce el comportamiento problemático.
    *   \`ambiguo\`: Si ambos muestran comportamientos problemáticos, es confuso, o falta texto.
    *   \`ninguno\`: Si no se detecta abuso/riesgo relevante.

7.  **Identifica la Persona Afectada (\`persona_afectada\`):** Determina quién sufre principalmente las consecuencias negativas del comportamiento detectado:
    *   \`usuario\`: Si {{{userData.nombre}}} parece ser el principal afectado.
    *   \`interlocutor\`: Si la otra persona (o principal interlocutor) parece ser el principal afectado.
    *   \`ambos\`: Si ambas partes parecen sufrir consecuencias negativas significativas.
    *   \`grupo\`: Si la conversación es grupal y el impacto negativo parece recaer sobre varias personas o el grupo en general.
    *   \`ninguno\`: Si no se detecta un impacto negativo claro o el comportamiento es menor.

8.  **Estima el Nivel de Riesgo (0-100):** Considera frecuencia, intensidad, tipos de tácticas y **si hay riesgo inminente (esto eleva el riesgo automáticamente a 90+)**.

9.  **Genera el Resultado JSON (estructura \`AnalyzeConversationOutputSchema\`):**
    *   **nivel_riesgo**: Tu estimación numérica.
    *   **riesgo_inminente**: \`true\` o \`false\` según el punto 1.
    *   **resumen_riesgo**: Breve descripción si \`riesgo_inminente\` es \`true\`, o una frase indicando el tipo principal de riesgo si no es inminente pero sí significativo (ej. "Riesgo de manipulación emocional y gaslighting"). Si no hay riesgo, indica "No se detectaron riesgos significativos". **Si sospechas una influencia externa (ej. imitación de comportamiento visto en medios), menciónalo brevemente aquí.**
    *   **categorias_detectadas**: Lista precisa (ej. "gaslighting", "control_economico", "amenaza_velada", "ideacion_suicida"). Array vacío si no hay.
    *   **ejemplos**: Frases textuales *exactas* como ejemplos claros. Array vacío si no hay.
    *   **persona_afectada**: Tu clasificación según el punto 7.
    *   **posible_agresor**: Tu clasificación según el punto 6.
    *   **recomendaciones**: Proporciona recomendaciones específicas, detalladas y accionables. **Adapta según \`posible_agresor\`, \`persona_afectada\` y \`riesgo_inminente\`**:
        *   **Si \`riesgo_inminente\` es \`true\`**:
            *   **PRIORIDAD ABSOLUTA:** "Se ha detectado una situación de riesgo potencialmente grave [mencionar brevemente por qué, ej. 'debido a ideación suicida' / 'debido a amenazas']. **Tu seguridad o la de la persona en riesgo es lo más importante ahora mismo.**"
            *   "**CONTACTA AYUDA URGENTE:** Llama inmediatamente a [Número de línea de ayuda local/nacional para crisis/suicidio/violencia - ej. 911, Línea de la Vida, etc.] o acude a la sala de emergencias más cercana."
            *   "Si es seguro, informa a alguien de confianza (familiar, amigo) sobre lo que está sucediendo."
            *   "No estás solo/a. Hay profesionales listos para ayudarte en este momento crítico."
            *   (Si el afectado es el interlocutor y el usuario no es el agresor): "Intenta comunicarte con alguien cercano a [interlocutor] si es seguro hacerlo, o contacta servicios de emergencia si crees que corre peligro inmediato."
            *   (Si el agresor es el interlocutor y el afectado es el usuario): "Si te sientes amenazado/a físicamente, busca un lugar seguro y contacta a las autoridades."
            *   (Si el agresor es el usuario): "Es vital que busques ayuda profesional de inmediato para manejar estos pensamientos/impulsos. Llama a [Número de línea de ayuda]."
        *   **Si \`riesgo_inminente\` es \`false\` (ajusta según \`posible_agresor\` y \`persona_afectada\`):**
            *   **Enfoque General:** Explica claramente la dinámica detectada y por qué es problemática.
                *   **Identifica la Táctica:** "La frase '[ejemplo]' es un indicativo de [categoría detectada]. Quien la usa, busca [objetivo de la táctica, ej. 'desestabilizar tu confianza', 'evadir responsabilidad', 'controlar la situación']."
                *   **Impacto Psicológico:** "Este tipo de comportamiento, especialmente si es repetido, puede causar [impacto específico, ej. 'ansiedad, confusión, baja autoestima, sentimiento de culpa constante, miedo a expresarte']. Es importante reconocer este patrón para proteger tu bienestar emocional."
                *   **Contextualiza (si aplica):** "En una relación de [tipoRelacion], esta dinámica es particularmente dañina porque [razón específica, ej. 'mina la confianza básica', 'crea un desequilibrio de poder', 'impide una comunicación sana']."
                *   **(Si se sospecha influencia externa):** "Este comportamiento a veces se aprende o imita de fuentes externas [mencionar posible origen si se intuye, ej. 'como se ve en ciertas series o redes sociales']. Reconocer esto no lo justifica, pero puede ayudar a entenderlo."
            *   **Recomendaciones Específicas (Adaptadas):**
                *   **Si \`persona_afectada\` es \`usuario\` (y \`posible_agresor\` es \`interlocutor\` o \`ambiguo\`):**
                    *   **Validación:** "Lo que sientes es válido. No estás exagerando si este comportamiento te afecta negativamente."
                    *   **Estrategias de Afrontamiento:** "Ante '[ejemplo]', considera [estrategia específica, ej. 'establecer un límite claro: "No me hables en ese tono"', 'tomar distancia temporalmente: "Necesito un momento antes de seguir hablando"', 'documentar la interacción para tener claridad después', 'buscar una segunda opinión con alguien de confianza externo a la situación']. El objetivo no es 'ganar' la discusión, sino proteger tu espacio emocional."
                    *   **Autocuidado:** "Prioriza actividades que refuercen tu autoestima y bienestar fuera de esta interacción. Conéctate con amigos o familiares que te apoyen."
                    *   **Evaluación a Largo Plazo:** "Reflexiona si esta dinámica es algo con lo que puedes o quieres vivir. ¿Se alinea con lo que esperas de una relación de [tipoRelacion]? ¿Hay disposición al cambio por la otra parte?"
                    *   **Recursos:** "Si el patrón es persistente o te causa angustia significativa, considera terapia individual para fortalecer tus herramientas de afrontamiento y tomar decisiones informadas. Organizaciones de apoyo [mencionar tipo, ej. 'a víctimas de abuso emocional'] pueden ofrecer recursos."
                *   **Si \`persona_afectada\` es \`interlocutor\` (y \`posible_agresor\` es \`usuario\` o \`ambiguo\`):**
                    *   **Autoconciencia:** "El uso de frases como '[ejemplo]' cae en la categoría de [categoría detectada]. Es crucial reconocer cómo este comportamiento impacta negativamente a [interlocutor], pudiendo generar [impacto específico, ej. 'miedo, tristeza, resentimiento']."
                    *   **Reflexión:** "¿Qué buscas lograr con este tipo de comunicación? ¿Hay una necesidad no satisfecha o una emoción (frustración, inseguridad) que podrías expresar de forma más constructiva? ¿Cómo te sentirías tú en su lugar?"
                    *   **Alternativas Saludables:** "Practica la comunicación asertiva y respetuosa. En lugar de [comportamiento problemático], intenta [alternativa, ej. 'expresar tu emoción usando 'yo siento...'', 'pedir lo que necesitas sin exigencias ni culpas', 'escuchar activamente la perspectiva del otro']. La terapia individual puede ser clave para entender estos patrones y desarrollar alternativas."
                    *   **Reparación (si aplica):** "Considera si una disculpa sincera y un cambio de comportamiento son necesarios para reparar la confianza en la relación."
                *   **Si \`persona_afectada\` es \`ambos\` o \`grupo\`:**
                    *   **Reconocer la Toxicidad Mutua:** "La conversación muestra una dinámica donde ambas partes (o varias en el grupo) contribuyen a un ambiente negativo con comportamientos como [mencionar ejemplos de ambos lados]. Esto es insostenible y dañino para todos los involucrados."
                    *   **Responsabilidad Compartida:** "Es fundamental que cada persona involucrada reflexione sobre su propia contribución a esta dinámica. ¿Qué rol juegas tú? ¿Qué puedes cambiar en tu forma de comunicarte?"
                    *   **Comunicación Constructiva (si es posible):** "Si hay voluntad de todas las partes, intentar establecer reglas básicas de comunicación respetuosa podría ser un primer paso (ej. no interrumpir, no insultar, tiempos fuera). Sin embargo, esto requiere un compromiso real."
                    *   **Ayuda Externa:** "La terapia individual para cada persona puede ser necesaria antes de intentar una terapia conjunta (de pareja, familiar o grupal), ya que permite abordar los patrones personales. En un contexto laboral, hablar con RRHH o un supervisor neutral podría ser una opción si la dinámica es disfuncional."
                *   **Si \`persona_afectada\` es \`ninguno\`:**
                    *   "Basado en este análisis, no se detectaron señales claras de abuso o manipulación que generen un impacto negativo significativo. Mantener una comunicación abierta y respetuosa sigue siendo clave en toda relación ([tipoRelacion])."

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
              persona_afectada: "ninguno", // Default value
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

