/**
  * Represents the result of analyzing a conversation for emotional abuse and manipulation.
  */
 export interface AnalysisResult {
   /**
    * The overall risk level, from 0 to 100.
    */
   nivel_riesgo: number;
   /**
    * Categories of abuse detected in the conversation.
    */
   categorias_detectadas: string[];
   /**
    * Example phrases from the conversation that indicate abuse.
    */
   ejemplos: string[];
   /**
    * Recommendations for the user based on the analysis.
    */
   recomendaciones: string[];
 }

 /**
  * Analyzes a conversation using the ShadAI model to detect emotional abuse and manipulation.
  *
  * @param text The conversation text to analyze.
  * @returns A promise that resolves to an AnalysisResult object.
  */
 export async function analyzeConversation(text: string): Promise<AnalysisResult> {
   // Mocked implementation for demonstration purposes.
   // In a real application, this would call the actual ShadAI API.

   // Simulate API call delay
   await new Promise(resolve => setTimeout(resolve, 1000));

   // Example logic to vary results based on input length or content
   let riskLevel = 50;
   const categories = new Set<string>();
   const examples = new Set<string>();
   const recommendations = new Set<string>([
        'Considera establecer límites claros en tus conversaciones.',
        'Reflexiona sobre cómo te hacen sentir estas interacciones.'
    ]);


   if (text.toLowerCase().includes("if you really loved me") || text.toLowerCase().includes("si me quisieras de verdad")) {
     riskLevel = Math.max(riskLevel, 75);
     categories.add("manipulacion");
     examples.add("“Si de verdad me quisieras, harías...”");
     recommendations.add('Reconoce las declaraciones condicionales como posibles tácticas de manipulación.');
   }
    if (text.toLowerCase().includes("you're crazy") || text.toLowerCase().includes("estás loco") || text.toLowerCase().includes("estás loca")) {
     riskLevel = Math.max(riskLevel, 85);
     categories.add("gaslighting");
     examples.add("“Estás exagerando/loco/loca.”");
     recommendations.add('Confía en tu propia percepción de la realidad.');
     recommendations.add('Busca validación de amigos de confianza o profesionales.');
   }
    if (text.toLowerCase().includes("nobody else understands you") || text.toLowerCase().includes("nadie más te va a entender")) {
     riskLevel = Math.max(riskLevel, 80);
     categories.add("aislamiento");
     examples.add("“Nadie más te entiende como yo.”");
     recommendations.add('Mantén conexiones con amigos y familiares.');
   }
   if (text.toLowerCase().includes("you always") || text.toLowerCase().includes("you never") || text.toLowerCase().includes("siempre haces") || text.toLowerCase().includes("nunca haces")) {
     riskLevel = Math.max(riskLevel, 60);
     categories.add("generalizacion");
     examples.add("“Siempre arruinas todo.” / “Nunca escuchas.”");
      recommendations.add('Desafía las generalizaciones con ejemplos específicos.');
   }
    if (text.toLowerCase().includes("it's your fault") || text.toLowerCase().includes("es tu culpa")) {
     riskLevel = Math.max(riskLevel, 70);
     categories.add("culpabilizacion");
     examples.add("“Es tu culpa que me enoje.”");
     recommendations.add('Recuerda que no eres responsable de las acciones o emociones de los demás.');
   }

   // Add default recommendations if high risk detected
   if (riskLevel > 70) {
        recommendations.add('Considera consultar a un profesional de la salud mental.');
        recommendations.add('Habla con un amigo de confianza o familiar sobre tus preocupaciones.');
   }

   // Simple risk adjustment based on length
   riskLevel = Math.min(100, riskLevel + Math.floor(text.length / 100));


   return {
     nivel_riesgo: riskLevel,
     categorias_detectadas: Array.from(categories),
     ejemplos: Array.from(examples),
     recomendaciones: Array.from(recommendations),
   };
 }
