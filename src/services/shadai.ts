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
   const categories = new Set<string>();
   const examples = new Set<string>();
   const recommendations = new Set<string>([
        'Recuerda comunicarte asertivamente.',
        'Confía en tu percepción de la situación.'
    ]);


   if (text.toLowerCase().includes("if you really loved me") || text.toLowerCase().includes("si me quisieras de verdad")) {
     riskLevel = Math.max(riskLevel, 75);
     categories.add("manipulación");
     examples.add("“Si de verdad me quisieras, harías...” (detectado por mock)");
     recommendations.add('Mock: Cuestiona las condiciones en el afecto.');
   }
    if (text.toLowerCase().includes("you're crazy") || text.toLowerCase().includes("estás loco") || text.toLowerCase().includes("estás loca")) {
     riskLevel = Math.max(riskLevel, 85);
     categories.add("gaslighting");
     examples.add("“Estás exagerando/loco/loca.” (detectado por mock)");
     recommendations.add('Mock: El gaslighting busca invalidarte. Confía en ti.');
   }
    if (text.toLowerCase().includes("nobody else understands you") || text.toLowerCase().includes("nadie más te va a entender")) {
     riskLevel = Math.max(riskLevel, 80);
     categories.add("aislamiento");
     examples.add("“Nadie más te entiende como yo.” (detectado por mock)");
     recommendations.add('Mock: Fomentar el aislamiento es una señal de alerta.');
   }
   if (text.toLowerCase().includes("you always") || text.toLowerCase().includes("you never") || text.toLowerCase().includes("siempre haces") || text.toLowerCase().includes("nunca haces")) {
     riskLevel = Math.max(riskLevel, 60);
     categories.add("generalizacion");
     examples.add("“Siempre arruinas todo.” / “Nunca escuchas.” (detectado por mock)");
     recommendations.add('Mock: Las generalizaciones suelen ser injustas.');
   }
    if (text.toLowerCase().includes("it's your fault") || text.toLowerCase().includes("es tu culpa")) {
     riskLevel = Math.max(riskLevel, 70);
     categories.add("culpabilizacion");
     examples.add("“Es tu culpa que me enoje.” (detectado por mock)");
     recommendations.add('Mock: No eres responsable de las emociones ajenas.');
   }

   // Add default recommendations if high risk detected
   if (riskLevel > 70) {
        recommendations.add('Mock: Considera buscar apoyo si el riesgo es alto.');
        recommendations.add('Mock: Habla con alguien de confianza.');
   }

   // Simple risk adjustment based on length
   riskLevel = Math.min(100, riskLevel + Math.floor(text.length / 150)); // Adjusted mock logic


   return {
     nivel_riesgo: riskLevel,
     categorias_detectadas: Array.from(categories),
     ejemplos: Array.from(examples),
     recomendaciones: Array.from(recommendations),
   };
 }

    