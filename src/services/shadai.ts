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
        'Consider setting clear boundaries in your conversations.',
        'Reflect on how these interactions make you feel.'
    ]);


   if (text.toLowerCase().includes("if you really loved me") || text.toLowerCase().includes("si me quisieras de verdad")) {
     riskLevel = Math.max(riskLevel, 75);
     categories.add("manipulacion");
     examples.add("“If you really loved me, you would...”");
     recommendations.add('Recognize conditional statements as potential manipulation tactics.');
   }
    if (text.toLowerCase().includes("you're crazy") || text.toLowerCase().includes("estás loco") || text.toLowerCase().includes("estás loca")) {
     riskLevel = Math.max(riskLevel, 85);
     categories.add("gaslighting");
     examples.add("“You're just being overly sensitive/crazy.”");
     recommendations.add('Trust your own perception of reality.');
     recommendations.add('Seek validation from trusted friends or professionals.');
   }
    if (text.toLowerCase().includes("nobody else understands you") || text.toLowerCase().includes("nadie más te va a entender")) {
     riskLevel = Math.max(riskLevel, 80);
     categories.add("aislamiento");
     examples.add("“Nobody else understands you like I do.”");
     recommendations.add('Maintain connections with friends and family.');
   }
   if (text.toLowerCase().includes("you always") || text.toLowerCase().includes("you never") || text.toLowerCase().includes("siempre haces") || text.toLowerCase().includes("nunca haces")) {
     riskLevel = Math.max(riskLevel, 60);
     categories.add("generalizacion");
     examples.add("“You always mess things up.” / “You never listen.”");
      recommendations.add('Challenge generalizations with specific examples.');
   }
    if (text.toLowerCase().includes("it's your fault") || text.toLowerCase().includes("es tu culpa")) {
     riskLevel = Math.max(riskLevel, 70);
     categories.add("culpabilizacion");
     examples.add("“It's your fault I got angry.”");
     recommendations.add('Remember that you are not responsible for others\' actions or emotions.');
   }

   // Add default recommendations if high risk detected
   if (riskLevel > 70) {
        recommendations.add('Consider consulting a mental health professional.');
        recommendations.add('Talk to a trusted friend or family member about your concerns.');
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
