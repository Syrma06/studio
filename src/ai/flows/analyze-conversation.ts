
'use server';

/**
 * @fileOverview Analiza una conversación en busca de abuso emocional, manipulación y riesgo inminente utilizando IA.
 *
 * - analyze - Una función que invoca el flujo de análisis de conversación y maneja la notificación de emergencia.
 * - AnalyzeConversationInput - El tipo de entrada para la función analyze.
 * - AnalyzeConversationOutput - El tipo de retorno para la función analyze.
 */

import {ai} from '@/ai/ai-instance'; // Correctly imports the Genkit instance using googleAI plugin
import {z} from 'genkit';
import type { AnalysisResult } from '@/services/shadai'; // Keep type import
// Import the actual email sending function
import { sendEmergencyEmail } from '@/services/email';

const AnalyzeConversationInputSchema = z.object({
  text: z.string().describe('El texto de la conversación a analizar.'),
  generoUsuario: z.enum(["hombre", "mujer", "prefiero_no_decirlo"]).describe('El género del usuario que proporciona la conversación.'),
  tipoRelacion: z.enum(["pareja", "amistad", "familiar", "laboral", "grupo"]).describe('El tipo de relación entre las personas en la conversación.'),
  userData: z.object({
    nombre: z.string(),
    apellido: z.string(),
    edad: z.number(),
    emailEmergencia: z.string().email().optional().or(z.literal('')),
  }).describe('Datos del usuario que proporciona la conversación.'),
});
export type AnalyzeConversationInput = z.infer<typeof AnalyzeConversationInputSchema>;

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
      .enum(["usuario", "interlocutor", "ambiguo", "ninguno", "externo"])
      .describe('Identificación de quién o qué parece ser el principal origen del comportamiento problemático según el análisis. "usuario" si parece ser la persona que envió el texto, "interlocutor" si parece ser la otra persona, "ambiguo" si no está claro o ambos participan, "ninguno" si no se detecta abuso significativo, "externo" si el comportamiento parece imitado o influenciado por fuentes externas (medios, ideologías, etc.).'),
     persona_afectada: z
        .enum(["usuario", "interlocutor", "ambos", "grupo", "ninguno"])
        .describe('Identificación de quién parece ser la principal persona afectada negativamente por el comportamiento problemático detectado. "usuario" si es la persona que envió el texto, "interlocutor" si es la otra persona (o principal interlocutor), "ambos" si ambas partes se ven afectadas negativamente, "grupo" si el impacto negativo es en varias personas de un grupo, "ninguno" si no se detecta un impacto negativo claro en nadie.'),
  }).describe('El resultado detallado del análisis de la conversación.')
});
export type AnalyzeConversationOutput = z.infer<typeof AnalyzeConversationOutputSchema>;


export async function analyze(input: AnalyzeConversationInput): Promise<AnalyzeConversationOutput> {
  const result = await analyzeConversationFlow(input);

  // --- Emergency Email Logic ---
  const isValidEmail = input.userData?.emailEmergencia && input.userData.emailEmergencia.includes('@');

  if (result.analysisResult.riesgo_inminente && isValidEmail) {
      console.log(`Alto riesgo detectado para ${input.userData.nombre} ${input.userData.apellido}. Intentando notificar a ${input.userData.emailEmergencia}.`);

      try {
           const emailSent = await sendEmergencyEmail({
             to: input.userData.emailEmergencia!,
             userName: `${input.userData.nombre} ${input.userData.apellido}`,
             riskSummary: result.analysisResult.resumen_riesgo,
             analysisDetails: result.analysisResult
           });

           if (emailSent) {
             console.log("Correo de emergencia enviado exitosamente.");
              // Check if the warning is already there before adding
              if (!result.analysisResult.recomendaciones.some(rec => rec.includes("AVISO:** Se intentó notificar"))) {
                 result.analysisResult.recomendaciones.push("<strong>**AVISO:** Se intentó notificar a tu contacto de emergencia sobre la situación de riesgo.</strong> Busca ayuda profesional o de emergencia inmediatamente.");
              }
           } else {
             console.error("Fallo al enviar el correo de emergencia (servicio reportó error).");
             if (!result.analysisResult.recomendaciones.some(rec => rec.includes("AVISO:** Se intentó notificar"))) {
                 result.analysisResult.recomendaciones.push("<strong>**AVISO:** Se intentó notificar a tu contacto de emergencia, pero hubo un error en el envío.</strong> Busca ayuda profesional o de emergencia inmediatamente.");
             }
           }

      } catch (emailError) {
        console.error("Error CRÍTICO al intentar enviar correo de emergencia:", emailError);
         if (!result.analysisResult.recomendaciones.some(rec => rec.includes("AVISO:** Ocurrió un error"))) {
             result.analysisResult.recomendaciones.push("<strong>**AVISO:** Ocurrió un error inesperado al intentar notificar al contacto de emergencia.</strong> Busca ayuda profesional o de emergencia inmediatamente.");
         }
      }
  } else if (result.analysisResult.riesgo_inminente) {
       console.warn(`Alto riesgo detectado para ${input.userData.nombre} ${input.userData.apellido}, pero no se proporcionó un correo de emergencia válido.`);
        if (!result.analysisResult.recomendaciones.some(rec => rec.includes("AVISO:** Se detectó un riesgo alto"))) {
           result.analysisResult.recomendaciones.push("<strong>**AVISO:** Se detectó un riesgo alto, pero no proporcionaste un correo de emergencia válido para notificar.</strong> Busca ayuda profesional o de emergencia inmediatamente.");
        }
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

2.  **Identifica Patrones de Abuso/Manipulación:** Busca patrones como gaslighting, culpabilización, aislamiento, minimización, amenazas (no inminentes), condicionamiento del afecto, invalidación, celos excesivos, control, humillación, bombardeo amoroso inicial seguido de devaluación, etc.

3.  **Evalúa la Dinámica:** Considera la dinámica de poder, miedo, intimidación, respeto (o falta de) de límites, comunicación circular, etc.

4.  **Considera el Género (si es relevante):** Si el género es 'hombre' o 'mujer' y la relación es 'pareja' o 'familiar', ten en cuenta posibles dinámicas de género asociadas al abuso (ej. control coercitivo, violencia económica), pero evita estereotipos. Si es 'prefiero_no_decirlo' o la relación es 'amistad', 'laboral' o 'grupo', sé más neutral en este aspecto.

5.  **Analiza AMBAS PARTES (Origen):** Determina quién ejerce principalmente el comportamiento problemático. **Considera seriamente la posibilidad de que el usuario ({{{userData.nombre}}}) sea quien lo ejerce.** Basa tu conclusión en la evidencia textual.

6.  **Determina el Posible Origen del Comportamiento Problemático (\`posible_agresor\`):** Clasifica en \`posible_agresor\`:
    *   \`usuario\`: Si la evidencia sugiere fuertemente que {{{userData.nombre}}} es quien ejerce el comportamiento problemático.
    *   \`interlocutor\`: Si la evidencia sugiere fuertemente que la otra persona (o la principal si son varios) ejerce el comportamiento problemático.
    *   \`ambiguo\`: Si ambos muestran comportamientos problemáticos, es confuso, o falta texto.
    *   \`ninguno\`: Si no se detecta abuso/riesgo relevante.
    *   \`externo\`: Si el comportamiento parece imitado o fuertemente influenciado por fuentes externas (ej., ideologías extremas, grupos online, figuras públicas, contenido de redes sociales) y esto es un factor clave en la dinámica.

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
    *   **resumen_riesgo**: Breve descripción si \`riesgo_inminente\` es \`true\`, o una frase indicando el tipo principal de riesgo si no es inminente pero sí significativo (ej. "Riesgo de manipulación emocional y gaslighting", "Riesgo de aislamiento y control"). Si no hay riesgo, indica "No se detectaron riesgos significativos". **Si sospechas una influencia externa (\`posible_agresor\` = \`externo\`), menciónalo brevemente aquí.**
    *   **categorias_detectadas**: Lista precisa (ej. "gaslighting", "control_economico", "amenaza_velada", "ideacion_suicida", "influencia_ideologica_externa"). Array vacío si no hay.
    *   **ejemplos**: Frases textuales *exactas* como ejemplos claros. Array vacío si no hay.
    *   **persona_afectada**: Tu clasificación según el punto 7.
    *   **posible_agresor**: Tu clasificación según el punto 6.
    *   **recomendaciones**: Proporciona recomendaciones específicas, detalladas y accionables. **Adapta según \`posible_agresor\`, \`persona_afectada\` y \`riesgo_inminente\`**:

        *   **Si \`riesgo_inminente\` es \`true\`**:
            *   **PRIORIDAD ABSOLUTA:** "**URGENTE: Se ha detectado una situación de riesgo potencialmente grave [mencionar brevemente por qué, ej. 'debido a ideación suicida explícita' / 'debido a amenazas directas']. Tu seguridad o la de la persona en riesgo es lo más importante ahora mismo.**"
            *   "**CONTACTA AYUDA URGENTE:** Llama inmediatamente a una línea de ayuda o emergencia ([ej. 911 en muchos países, o busca 'línea de ayuda suicidio/crisis [tu país]' online]). Acude a la sala de emergencias más cercana si es seguro."
            *   "Si puedes hacerlo de forma segura, informa a alguien de confianza (familiar, amigo cercano no involucrado) sobre la situación INMEDIATAMENTE."
            *   "No estás solo/a. Hay profesionales disponibles 24/7 para ayudarte en este momento crítico."
            *   (Si el afectado es el interlocutor y el usuario no es el agresor): "Si crees que la otra persona corre peligro inmediato y es seguro para ti, contacta servicios de emergencia o informa a alguien cercano a esa persona."
            *   (Si el agresor es el interlocutor y el afectado es el usuario): "Si te sientes amenazado/a físicamente, aléjate de la situación si puedes, busca un lugar seguro y contacta a las autoridades (policía)."
            *   (Si el agresor es el usuario): "Estos pensamientos o impulsos son serios y requieren atención profesional inmediata. Llama AHORA a una línea de ayuda [Número local/nacional]. No estás solo/a en esto y hay ayuda disponible."

        *   **Si \`riesgo_inminente\` es \`false\` (ajusta según \`posible_agresor\` y \`persona_afectada\`):**
            *   **Enfoque General (Explicación de la Dinámica):**
                *   **Identifica la Táctica y su Propósito:** "La frase '[ejemplo]' es característica de [categoría detectada]. Esta táctica busca [objetivo específico, ej. 'hacerte dudar de tu propia memoria y percepción (gaslighting)', 'generar culpa para controlar tus acciones (culpabilización)', 'aislarte de tu red de apoyo para aumentar la dependencia (aislamiento)', 'minimizar tus sentimientos para evitar responsabilidad (invalidación)']."
                *   **Impacto Psicológico:** "Este tipo de comportamiento, especialmente si es repetitivo, puede tener consecuencias serias en tu bienestar emocional, como [impacto específico, ej. 'ansiedad crónica, confusión sobre la realidad, disminución drástica de la autoestima, sentimiento constante de culpa o insuficiencia, miedo a expresarte, desarrollo de dependencia emocional']."
                *   **Por qué es Problemático (Contextualizar):** "En una relación ([tipoRelacion]), esta dinámica es particularmente dañina porque [razón específica, ej. 'erosiona la confianza fundamental', 'crea un desequilibrio de poder insano', 'impide la comunicación honesta y la resolución de conflictos', 'puede ser un precursor de formas más graves de abuso']. Reconocer estos patrones es el primer paso para protegerte."
                *   **(Si \`posible_agresor\` es \`externo\`):** "El análisis sugiere que este comportamiento podría estar influenciado por [mencionar posible origen si se intuye, ej. 'ideologías misóginas/extremistas vistas online', 'narrativas de culto a la personalidad', 'tácticas aprendidas de ciertos grupos o figuras públicas']. Reconocer esta influencia externa no justifica el comportamiento, pero puede ayudar a entender su origen y la dificultad para cambiarlo sin una intervención específica."

            *   **Recomendaciones Específicas y Accionables (Adaptadas):**

                *   **Si \`persona_afectada\` es \`usuario\` (y \`posible_agresor\` es \`interlocutor\`, \`ambiguo\` o \`externo\`):**
                    *   **Validación y Autoafirmación:** "Lo que sientes ante estas interacciones es válido. No estás exagerando. Es una reacción normal a un comportamiento problemático. Recuerda tus fortalezas y tu valor independiente de esta relación."
                    *   **Estrategias de Afrontamiento Inmediatas:**
                        *   "**Establece Límites Claros (Ejemplos):** Ante '[ejemplo de táctica]', intenta decir con calma pero firmeza: 'No voy a seguir esta conversación si me hablas en ese tono.' / 'No acepto esa generalización sobre mí.' / 'Mi percepción de los hechos es diferente y válida.' / 'Necesito un tiempo fuera ahora mismo.'"
                        *   "**Técnica del 'Disco Rayado':** Repite tu límite o tu postura calmadamente sin engancharte en justificaciones o discusiones circulares ('No voy a discutir sobre esto ahora')."
                        *   "**Busca Distancia Segura:** Si la conversación escala o te sientes abrumado/a, retírate física o comunicacionalmente ('Hablamos después', y corta la comunicación temporalmente)."
                        *   "**Documenta (si es seguro):** Mantén un registro privado de incidentes clave (fechas, frases, cómo te sentiste). Esto puede ayudarte a ver patrones y a tener claridad si buscas ayuda externa."
                    *   **Fortalecimiento Externo:**
                        *   "**Habla con Alguien de Confianza (Externo):** Comparte tu experiencia con un amigo/a o familiar de confianza que no esté involucrado/a directamente y que sepas que te apoyará sin juzgar. Una perspectiva externa es valiosa."
                        *   "**Busca Información:** Lee sobre [categoría detectada específica, ej. 'gaslighting', 'ciclo del abuso'] en fuentes fiables (sitios web de psicología, organizaciones de apoyo a víctimas). Entender la táctica te da poder."
                    *   **Evaluación y Pasos a Futuro:**
                        *   "**Evalúa la Relación:** Reflexiona honestamente: ¿Es esta la dinámica que deseas a largo plazo? ¿Hay un patrón consistente de este comportamiento? ¿Ves una voluntad genuina de cambio en la otra persona? ¿Se respetan tus límites consistentemente?"
                        *   "**Considera Ayuda Profesional:** Un terapeuta especializado en relaciones o trauma puede ayudarte a procesar el impacto emocional, fortalecer tus herramientas de afrontamiento y tomar decisiones informadas sobre el futuro de la relación. Busca profesionales con experiencia en abuso emocional."
                        *   "**Plan de Seguridad (si hay riesgo):** Si sientes que la situación podría escalar o si hay historial de amenazas/control, considera crear un plan de seguridad básico (tener a mano números de ayuda, informar a alguien de confianza de tus movimientos, tener documentos importantes accesibles)."

                *   **Si \`persona_afectada\` es \`interlocutor\` (y \`posible_agresor\` es \`usuario\` o \`ambiguo\`):**
                    *   **Autoconciencia Profunda:** "El análisis sugiere que tu comportamiento, ejemplificado por frases como '[ejemplo]', se alinea con patrones de [categoría detectada]. Es fundamental que reconozcas el impacto negativo que esto tiene en [Determina según contexto: 'la otra persona'/'él'/'ella'], pudiendo causar [impacto específico, ej. 'miedo, ansiedad, tristeza, resentimiento, sensación de caminar sobre cáscaras de huevo']."
                    *   **Reflexión sobre Motivaciones:** "¿Qué emoción o necesidad subyacente (ej. inseguridad, miedo al abandono, frustración, necesidad de control) estás intentando manejar a través de este comportamiento? ¿Cómo podrías expresar esa necesidad o emoción de forma más saludable y respetuosa? ¿Cómo te sentirías tú si te hablaran así?"
                    *   **Aprendizaje de Alternativas Saludables:**
                        *   "**Practica la Comunicación No Violenta (CNV):** Aprende a expresar tus sentimientos y necesidades usando 'Yo siento...' en lugar de acusaciones ('Tú eres...'). Enfócate en el comportamiento específico, no en atacar a la persona."
                        *   "**Desarrolla la Empatía:** Intenta ponerte activamente en el lugar de [Determina según contexto: 'la otra persona'/'él'/'ella']. ¿Cómo perciben ellos tus palabras/acciones? Escucha activamente su perspectiva sin interrumpir ni invalidar."
                        *   "**Manejo de la Ira/Frustración:** Si reaccionas impulsivamente, busca técnicas de manejo de la ira (respiración profunda, tiempo fuera ANTES de explotar). La terapia individual es CLAVE aquí."
                    *   **Responsabilidad y Reparación:** "Asumir la responsabilidad por el daño causado es esencial. Una disculpa sincera (sin excusas) y un cambio de comportamiento demostrable son necesarios si deseas reparar la relación. Considera preguntar a [Determina según contexto: 'la otra persona'/'él'/'ella'] qué necesita para sentirse seguro/a de nuevo."
                    *   **Busca Ayuda Profesional:** Un terapeuta puede ayudarte a entender el origen de estos patrones (a menudo aprendidos) y a desarrollar estrategias de comunicación y regulación emocional más sanas. Es un signo de fortaleza buscar ayuda para cambiar.

                *   **Si \`persona_afectada\` es \`ambos\` o \`grupo\`:**
                    *   **Reconocer la Dinámica Tóxica Mutua/Grupal:** "La conversación evidencia una dinámica disfuncional donde varias partes contribuyen a un ciclo negativo con comportamientos como [mencionar ejemplos de diferentes partes si es posible]. Esto genera un ambiente de [ej. tensión constante, desconfianza, hostilidad] perjudicial para todos."
                    *   **Responsabilidad Individual dentro del Sistema:** "Es crucial que cada persona involucrada reflexione sobre su propia contribución. ¿Qué rol juegas en este patrón? ¿Qué podrías cambiar tú, independientemente de lo que hagan los demás? Evita el 'juego de la culpa'."
                    *   **Intentar Establecer Reglas Básicas (si hay voluntad):** "Si existe un deseo genuino de mejorar la comunicación, podrían intentar acordar reglas mínimas como: no insultos, no interrupciones, tiempos fuera pactados, escuchar para entender (no para responder). Esto requiere compromiso REAL de todos."
                    *   **Ayuda Externa Individual y/o Conjunta:** "La terapia individual para cada persona implicada suele ser el primer paso más efectivo para abordar patrones personales. Posteriormente, si hay progreso individual y voluntad, la terapia de pareja, familiar o de grupo (con un profesional) podría ser una opción para trabajar la dinámica conjunta."
                    *   **(Contexto Laboral/Grupal):** "En un entorno laboral, si la dinámica es muy tóxica, considera documentar los problemas y hablar con Recursos Humanos, un supervisor neutral o buscar mediación si está disponible. Protege tu bienestar profesional."

                *   **Si \`persona_afectada\` es \`ninguno\`:**
                    *   "Basado en este análisis, no se identificaron señales claras de abuso emocional, manipulación o riesgo significativo que parezcan causar un daño relevante. Mantener una comunicación abierta, respetuosa y consciente de los límites sigue siendo importante en cualquier relación ([tipoRelacion])."

Asegúrate de que tu salida sea únicamente el objeto JSON con la estructura definida en 'AnalyzeConversationOutputSchema', sin ningún texto introductorio o explicaciones adicionales fuera del JSON. Utiliza **negritas** (markdown style: **) para resaltar las partes más importantes de las recomendaciones.`,
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
  try {
      const { output } = await analysisPrompt(input); // Calls the prompt defined above, which uses the Genkit instance 'ai'

      if (!output || !output.analysisResult) {
          console.error("El modelo no devolvió una salida válida o completa.");
          // Return a structured error output matching the schema
          return {
              analysisResult: {
                  nivel_riesgo: 0,
                  riesgo_inminente: false,
                  resumen_riesgo: "Error: El modelo no proporcionó una respuesta válida.",
                  categorias_detectadas: [],
                  ejemplos: [],
                  recomendaciones: ["Error: No se pudo analizar la conversación. El modelo no proporcionó una respuesta válida."],
                  posible_agresor: "ninguno",
                  persona_afectada: "ninguno",
              }
          };
      }

       // Basic keyword check for imminent risk (redundancy layer)
       const suicidalKeywords = ["suicidarme", "matarme", "desaparecer", "no quiero vivir", "acabar con todo", "quitarme la vida", "ya no puedo más"];
       const threatKeywords = ["te voy a matar", "te voy a hacer daño", "voy a lastimarte", "te arrepentirás", "mereces que te pase algo malo"];
       const conversationLower = input.text.toLowerCase();

       let highRiskKeywordDetected = false;
       if (suicidalKeywords.some(keyword => conversationLower.includes(keyword)) ||
           threatKeywords.some(keyword => conversationLower.includes(keyword))) {
           highRiskKeywordDetected = true;
           if (!output.analysisResult.riesgo_inminente && (conversationLower.includes("te voy a matar") || conversationLower.includes("me voy a matar"))) {
                console.warn("Palabra clave de riesgo MUY ALTO detectada, pero la IA no marcó riesgo_inminente=true. FORZANDO RIESGO ALTO.");
                output.analysisResult.riesgo_inminente = true;
                output.analysisResult.nivel_riesgo = Math.max(output.analysisResult.nivel_riesgo, 95);
                output.analysisResult.resumen_riesgo = output.analysisResult.resumen_riesgo + " (RIESGO INMINENTE FORZADO POR PALABRA CLAVE EXPLÍCITA)";
                 output.analysisResult.recomendaciones.unshift("**URGENTE:** Se detectó una palabra clave de riesgo crítico. Busca ayuda de emergencia inmediatamente.");
           } else if (!output.analysisResult.riesgo_inminente) {
               console.warn("Palabra clave de riesgo detectada, pero la IA no marcó riesgo_inminente=true. Revisar análisis.");
           }
       }


      console.log("Resultado del análisis:", output.analysisResult);
      return output;

    } catch (error: any) {
        console.error("Error durante la ejecución del flujo de análisis:", error);
        // Return a structured error output matching the schema
         return {
             analysisResult: {
                 nivel_riesgo: 0,
                 riesgo_inminente: false,
                 resumen_riesgo: `Error interno durante el análisis: ${error.message || 'Error desconocido'}`,
                 categorias_detectadas: [],
                 ejemplos: [],
                 recomendaciones: [`Error: No se pudo completar el análisis debido a un error interno (${error.message || 'Error desconocido'}).`],
                  posible_agresor: "ninguno",
                  persona_afectada: "ninguno",
             }
         };
    }
});

