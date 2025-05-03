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
        'Reflexiona activamente sobre cómo te sientes después de interactuar. ¿Te sientes agotado/a, ansioso/a o confundido/a?',
        'Establece límites claros y comunícalos asertivamente. Por ejemplo: "No me siento cómodo/a cuando hablamos de esa manera".'
    ]);


   if (text.toLowerCase().includes("if you really loved me") || text.toLowerCase().includes("si me quisieras de verdad")) {
     riskLevel = Math.max(riskLevel, 75);
     categories.add("manipulación");
     examples.add("“Si de verdad me quisieras, harías...”");
     recommendations.add('Identifica las condiciones ("si tú...") como una táctica de manipulación emocional. El amor genuino no suele ser condicional de esa manera.');
     recommendations.add('Cuestiona la lógica detrás de estas declaraciones. ¿Es realmente una prueba de amor o un intento de control?');
   }
    if (text.toLowerCase().includes("you're crazy") || text.toLowerCase().includes("estás loco") || text.toLowerCase().includes("estás loca")) {
     riskLevel = Math.max(riskLevel, 85);
     categories.add("gaslighting");
     examples.add("“Estás exagerando/loco/loca.”");
     recommendations.add('El "gaslighting" busca hacerte dudar de tu propia percepción y cordura. Confía en tus sentimientos y recuerdos.');
     recommendations.add('Lleva un registro de las conversaciones o eventos si es necesario para validar tu experiencia.');
     recommendations.add('Busca validación externa hablando con amigos de confianza, familiares o un terapeuta sobre lo que estás experimentando.');
   }
    if (text.toLowerCase().includes("nobody else understands you") || text.toLowerCase().includes("nadie más te va a entender")) {
     riskLevel = Math.max(riskLevel, 80);
     categories.add("aislamiento");
     examples.add("“Nadie más te entiende como yo.”");
     recommendations.add('Esta frase es una señal de alerta de aislamiento. Una persona que te quiere bien fomentará tus relaciones externas.');
     recommendations.add('Esfuérzate conscientemente por mantener y nutrir tus conexiones sociales con amigos y familiares.');
   }
   if (text.toLowerCase().includes("you always") || text.toLowerCase().includes("you never") || text.toLowerCase().includes("siempre haces") || text.toLowerCase().includes("nunca haces")) {
     riskLevel = Math.max(riskLevel, 60);
     categories.add("generalizacion");
     examples.add("“Siempre arruinas todo.” / “Nunca escuchas.”");
     recommendations.add('Las generalizaciones ("siempre", "nunca") rara vez son ciertas y suelen usarse para atacar en lugar de resolver problemas. Identifícalas como críticas destructivas.');
     recommendations.add('Responde pidiendo ejemplos específicos o enfócate en el problema actual sin caer en generalizaciones.');
   }
    if (text.toLowerCase().includes("it's your fault") || text.toLowerCase().includes("es tu culpa")) {
     riskLevel = Math.max(riskLevel, 70);
     categories.add("culpabilizacion");
     examples.add("“Es tu culpa que me enoje.”");
     recommendations.add('La culpabilización constante es una forma de manipulación. Recuerda que no eres responsable de las emociones o acciones de otra persona.');
     recommendations.add('Practica la auto-compasión y no internalices la culpa que intentan imponerte.');
   }

   // Add default recommendations if high risk detected
   if (riskLevel > 70) {
        recommendations.add('Dado el nivel de riesgo, considera seriamente buscar apoyo profesional de un terapeuta especializado en relaciones o abuso emocional.');
        recommendations.add('Habla abierta y honestamente con alguien de tu círculo de confianza (amigo cercano, familiar) sobre tus preocupaciones y los patrones que observas.');
        recommendations.add('Infórmate más sobre los diferentes tipos de abuso emocional y manipulación para reconocerlos mejor.');
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
