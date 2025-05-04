
/**
  * Representa el resultado de analizar una conversación en busca de abuso emocional y manipulación.
  * Esta interfaz es utilizada tanto por el flujo de IA como por el componente cliente.
  */
 export interface AnalysisResult {
   /**
    * El nivel de riesgo general, de 0 a 100.
    */
   nivel_riesgo: number;
   /**
    * Indica si se detecta un riesgo alto e inminente de daño físico o suicidio.
    */
    riesgo_inminente: boolean;
    /**
     * Un breve resumen (1-2 frases) explicando la naturaleza del riesgo detectado.
     */
    resumen_riesgo: string;
   /**
    * Categorías de abuso detectadas en la conversación.
    */
   categorias_detectadas: string[];
   /**
    * Frases de ejemplo de la conversación que indican abuso.
    */
   ejemplos: string[];
   /**
    * Recomendaciones para el usuario basadas en el análisis.
    */
   recomendaciones: string[];
   /**
    * Identificación de quién parece ser el principal perpetrador del abuso/manipulación.
    */
   posible_agresor: "usuario" | "interlocutor" | "ambiguo" | "ninguno";
 }

 /**
  * [Implementación Mock/Fallback] Analiza una conversación para detectar abuso emocional y manipulación.
  * NOTA: Esta es una implementación simulada y ya no es la principal fuente de análisis.
  * Se mantiene para referencia, pruebas o como posible fallback. El análisis real se realiza
  * mediante el flujo de Genkit en `src/ai/flows/analyze-conversation.ts`.
  *
  * @param text El texto de la conversación a analizar.
  * @returns Una promesa que resuelve a un objeto AnalysisResult simulado.
  */
 export async function analyzeConversation(text: string): Promise<AnalysisResult> {
   // Mocked implementation for demonstration/testing/fallback purposes.
   // The actual analysis is now handled by the Genkit flow.

   // Simulate API call delay
   await new Promise(resolve => setTimeout(resolve, 500)); // Reduced delay

   // Example logic to vary results based on input length or content (kept for reference)
   let riskLevel = 30; // Lower default risk for mock
   let imminentRisk = false;
   let riskSummary = "No se detectaron riesgos significativos (Mock).";
   const categories = new Set<string>();
   const examples = new Set<string>();
   const recommendations = new Set<string>([
        'Mock: Recuerda comunicarte asertivamente.', // Added Mock prefix
        'Mock: Confía en tu percepción de la situación.' // Added Mock prefix
    ]);
    let possibleAggressor: AnalysisResult['posible_agresor'] = 'ninguno';


   if (text.toLowerCase().includes("if you really loved me") || text.toLowerCase().includes("si me quisieras de verdad")) {
     riskLevel = Math.max(riskLevel, 75);
     categories.add("manipulación");
     examples.add("“Si de verdad me quisieras, harías...” (detectado por mock)");
     recommendations.add('Mock: Cuestiona las condiciones en el afecto.');
     possibleAggressor = 'interlocutor'; // Assume interlocutor for mock
     riskSummary = "Riesgo de manipulación emocional (Mock)."
   }
    if (text.toLowerCase().includes("you're crazy") || text.toLowerCase().includes("estás loco") || text.toLowerCase().includes("estás loca")) {
     riskLevel = Math.max(riskLevel, 85);
     categories.add("gaslighting");
     examples.add("“Estás exagerando/loco/loca.” (detectado por mock)");
     recommendations.add('Mock: El gaslighting busca invalidarte. Confía en ti.');
      possibleAggressor = 'interlocutor'; // Assume interlocutor for mock
      riskSummary = "Riesgo de gaslighting (Mock)."
   }
    if (text.toLowerCase().includes("nobody else understands you") || text.toLowerCase().includes("nadie más te va a entender")) {
     riskLevel = Math.max(riskLevel, 80);
     categories.add("aislamiento");
     examples.add("“Nadie más te entiende como yo.” (detectado por mock)");
     recommendations.add('Mock: Fomentar el aislamiento es una señal de alerta.');
      possibleAggressor = 'interlocutor'; // Assume interlocutor for mock
      riskSummary = "Riesgo de aislamiento social (Mock)."
   }
   if (text.toLowerCase().includes("you always") || text.toLowerCase().includes("you never") || text.toLowerCase().includes("siempre haces") || text.toLowerCase().includes("nunca haces")) {
     riskLevel = Math.max(riskLevel, 60);
     categories.add("generalizacion");
     examples.add("“Siempre arruinas todo.” / “Nunca escuchas.” (detectado por mock)");
     recommendations.add('Mock: Las generalizaciones suelen ser injustas.');
     // Could be either, leave as is or make ambiguous for mock
   }
    if (text.toLowerCase().includes("it's your fault") || text.toLowerCase().includes("es tu culpa")) {
     riskLevel = Math.max(riskLevel, 70);
     categories.add("culpabilizacion");
     examples.add("“Es tu culpa que me enoje.” (detectado por mock)");
     recommendations.add('Mock: No eres responsable de las emociones ajenas.');
      possibleAggressor = 'interlocutor'; // Assume interlocutor for mock
      riskSummary = "Riesgo de culpabilización (Mock)."
   }

   // Example for user as aggressor (mock)
    if (text.toLowerCase().includes("i only get angry because you make me") || text.toLowerCase().includes("me haces enojar")) {
        riskLevel = Math.max(riskLevel, 70);
        categories.add("culpabilizacion");
        examples.add("“Me haces enojar.” (detectado por mock)");
        recommendations.add('Mock (Usuario): Asume responsabilidad por tus emociones.');
        possibleAggressor = 'usuario'; // Set user as aggressor for mock
        riskSummary = "Posible culpabilización ejercida por el usuario (Mock)."
    }

   // Mock imminent risk detection
    if (text.toLowerCase().includes("quiero morir") || text.toLowerCase().includes("matarme")) {
       riskLevel = 95;
       imminentRisk = true;
       categories.add("ideacion_suicida");
       examples.add("“...quiero morir...” (detectado por mock)");
       riskSummary = "RIESGO INMINENTE: Ideación suicida detectada (Mock).";
       recommendations.clear(); // Clear previous recommendations
       recommendations.add("**Mock URGENTE:** Contacta ayuda profesional INMEDIATAMENTE (ej. línea de crisis).");
       recommendations.add("Mock: Habla con alguien de confianza ahora mismo.");
    }
     if (text.toLowerCase().includes("te voy a matar") || text.toLowerCase().includes("voy a hacerte daño")) {
       riskLevel = 98;
       imminentRisk = true;
       categories.add("amenaza_directa");
       examples.add("“...te voy a matar...” (detectado por mock)");
       riskSummary = "RIESGO INMINENTE: Amenaza directa de violencia detectada (Mock).";
       recommendations.clear(); // Clear previous recommendations
       recommendations.add("**Mock URGENTE:** Tu seguridad es prioritaria. Busca un lugar seguro y contacta a las autoridades.");
       recommendations.add("Mock: Informa a alguien de confianza sobre la amenaza.");
    }


   // Add default recommendations if high risk detected (but not imminent)
   if (riskLevel > 70 && !imminentRisk) {
        recommendations.add('Mock: Considera buscar apoyo si el riesgo es alto.');
        recommendations.add('Mock: Habla con alguien de confianza.');
   }

   // Simple risk adjustment based on length
   riskLevel = Math.min(100, riskLevel + Math.floor(text.length / 150)); // Adjusted mock logic
   if (imminentRisk) riskLevel = Math.max(90, riskLevel); // Ensure imminent risk is high


   return {
     nivel_riesgo: riskLevel,
     riesgo_inminente: imminentRisk,
     resumen_riesgo: riskSummary,
     categorias_detectadas: Array.from(categories),
     ejemplos: Array.from(examples),
     recomendaciones: Array.from(recommendations),
     posible_agresor: possibleAggressor, // Return determined aggressor
   };
 }
