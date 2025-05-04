
"use client";

import * as React from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form"; // Import FormProvider
import { z } from "zod";
import { analyze, AnalyzeConversationInput, AnalyzeConversationOutput } from '@/ai/flows/analyze-conversation';
import type { AnalysisResult } from '@/services/shadai';
import html2canvas from 'html2canvas';
import { useToast } from "@/hooks/use-toast"; // Import useToast
import { useRouter } from 'next/navigation'; // Import useRouter

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel as RHFFormLabel, FormMessage } from "@/components/ui/form"; // Renamed FormLabel and imported useFormField
import { Label } from "@/components/ui/label"; // Import standard Label
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// Removed Dialog imports as it's no longer used here
// import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
// Removed Input import as it's no longer used here
// import { Input } from "@/components/ui/input";
import { Loader2, AlertCircle, Terminal, Download, ArrowLeft, UserCheck, UserX, Users, HelpCircle, Siren } from "lucide-react"; // Added ArrowLeft and icons for aggressor type, Siren for imminent risk
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'; // Import Tooltip components

const ConversationFormSchema = z.object({
  conversationText: z.string().min(10, {
    message: "El texto de la conversación debe tener al menos 10 caracteres.",
  }),
});

// Define the shape of the user data we expect from localStorage
// Updated UserData interface
interface UserData {
    nombre: string;
    apellido: string;
    edad: number;
    genero: "hombre" | "mujer" | "prefiero_no_decirlo"; // Add gender
    relationshipType: "pareja" | "amistad" | "familiar"; // Add relationshipType
    emailEmergencia?: string; // Add optional emergency email
    // Add other questionnaire fields if needed for context, though they aren't directly used in the analyze call
    makesYouDoubt?: "si" | "no";
    controlsYou?: "si" | "no";
    wantedToEndRelationship?: "si" | "no";
    wantsEvaluation?: "si" | "no";
}


export default function AnalyzerClient() {
  // Use the specific type from output which includes the nested analysisResult structure
  const [analysisResult, setAnalysisResult] = React.useState<AnalyzeConversationOutput['analysisResult'] | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  // Removed isDownloadDialogOpen state
  // const [isDownloadDialogOpen, setIsDownloadDialogOpen] = React.useState(false);
  const [userData, setUserData] = React.useState<UserData | null>(null); // State to hold user data
  const analysisResultCardRef = React.useRef<HTMLDivElement>(null);
  const { toast } = useToast(); // Initialize useToast
  const router = useRouter(); // Initialize useRouter

  // Fetch user data from localStorage when the component mounts
  React.useEffect(() => {
    try {
      const storedData = localStorage.getItem('alumbraUserData');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        // More robust validation including gender and relationshipType
        if (parsedData &&
            typeof parsedData.nombre === 'string' &&
            typeof parsedData.apellido === 'string' &&
            typeof parsedData.edad === 'number' &&
            ["hombre", "mujer", "prefiero_no_decirlo"].includes(parsedData.genero) && // Validate gender
            ["pareja", "amistad", "familiar"].includes(parsedData.relationshipType) // Validate relationshipType
            // Emergency email is optional, but check if it's a string if present
            && (parsedData.emailEmergencia === undefined || typeof parsedData.emailEmergencia === 'string')
            ) {
            setUserData(parsedData);
        } else {
            console.warn("Stored user data is invalid or incomplete.");
            toast({ // Inform user if data is missing/invalid
                variant: "destructive",
                title: "Datos Incompletos",
                description: "No se encontraron todos tus datos. Por favor, vuelve a completar el cuestionario.",
            });
            router.push('/questionnaire'); // Redirect if data is bad
            // Optionally clear invalid data
            // localStorage.removeItem('alumbraUserData');
        }
      } else {
         toast({ // Inform user if no data found
             variant: "destructive",
             title: "Datos no Encontrados",
             description: "Por favor, completa el cuestionario antes de analizar.",
         });
         router.push('/questionnaire'); // Redirect if no data
      }
    } catch (e) {
      console.error("Failed to read user data from localStorage", e);
       toast({
           variant: "destructive",
           title: "Error al Cargar Datos",
           description: "No se pudieron cargar tus datos. Intenta recargar la página o vuelve al cuestionario.",
       });
       router.push('/questionnaire'); // Redirect on error
    }
  }, [router, toast]); // Add toast to dependency array


  const conversationForm = useForm<z.infer<typeof ConversationFormSchema>>({
    resolver: zodResolver(ConversationFormSchema),
    defaultValues: {
      conversationText: "",
    },
  });

  // Removed downloadForm as data is fetched from localStorage

  async function onConversationSubmit(data: z.infer<typeof ConversationFormSchema>) {
    if (!userData) {
       toast({
           variant: "destructive",
           title: "Error",
           description: "No se pudieron cargar los datos del usuario. Por favor, completa el cuestionario.",
       });
       router.push('/questionnaire');
       return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysisResult(null); // Clear previous results

    try {
      // Prepare input for the analyze function, including gender, relationshipType, and the whole userData object
      const input: AnalyzeConversationInput = {
          text: data.conversationText,
          generoUsuario: userData.genero,
          tipoRelacion: userData.relationshipType,
          // Pass the entire userData object
          userData: {
              nombre: userData.nombre,
              apellido: userData.apellido,
              edad: userData.edad,
              emailEmergencia: userData.emailEmergencia || '', // Ensure it's a string or empty string
          },
       };
      const result: AnalyzeConversationOutput = await analyze(input);
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate slight delay if needed

       if (!result || !result.analysisResult) {
            throw new Error("La respuesta del análisis no tiene el formato esperado.");
       }

      setAnalysisResult(result.analysisResult);
    } catch (err: any) {
      console.error("Análisis fallido:", err);
      const errorMessage = err.message || "Error al analizar la conversación. Por favor, inténtalo de nuevo.";
      setError(errorMessage);
      toast({ // Show error toast
          variant: "destructive",
          title: "Error de Análisis",
          description: `No se pudo completar el análisis: ${errorMessage}`,
      });
    } finally {
      setIsLoading(false);
    }
  }

  const generateDownload = async () => { // Removed userData parameter
    if (!analysisResultCardRef.current || !analysisResult) {
        toast({
            variant: "destructive",
            title: "Error de Descarga",
            description: "No se encontraron los resultados del análisis para descargar.",
        });
        return;
    }
    // Check if user data is available
    if (!userData) {
        toast({
            variant: "destructive",
            title: "Error de Descarga",
            description: "No se encontraron los datos del usuario. Vuelve al cuestionario.",
        });
        return;
    }

    setIsDownloading(true);

    let userInfoElement: HTMLDivElement | null = null; // Declare outside try block

    try {
        // Create and append user info element for capture
        userInfoElement = document.createElement('div');
        userInfoElement.style.position = 'absolute';
        userInfoElement.style.bottom = '10px';
        userInfoElement.style.left = '10px';
        userInfoElement.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'; // Light background for visibility on potentially dark cards
        userInfoElement.style.padding = '5px';
        userInfoElement.style.borderRadius = '4px';
        userInfoElement.style.fontSize = '10px';
        userInfoElement.style.color = '#333'; // Dark text for light background
        userInfoElement.style.zIndex = '1'; // Ensure it's above other content if needed
        // Add a data attribute for easier selection in onclone
        userInfoElement.setAttribute('data-html2canvas-userinfo', 'true');

        // Map gender for display
        let generoDisplay = '';
        switch (userData.genero) {
            case 'hombre': generoDisplay = 'Hombre'; break;
            case 'mujer': generoDisplay = 'Mujer'; break;
            case 'prefiero_no_decirlo': generoDisplay = 'No especificado'; break;
        }

        userInfoElement.innerHTML = `
            Análisis para: ${userData.nombre} ${userData.apellido} (Edad: ${userData.edad}, Género: ${generoDisplay})<br/>
            Fecha: ${new Date().toLocaleDateString('es-ES')}
        `;
        analysisResultCardRef.current.style.position = 'relative'; // Ensure parent is relative
        analysisResultCardRef.current.appendChild(userInfoElement);


        const canvas = await html2canvas(analysisResultCardRef.current, {
            scale: 2,
            useCORS: true,
            backgroundColor: null, // Use element's background by default
             // Ensure the info element is captured correctly
            onclone: (documentClone) => {
                 const clonedCard = documentClone.querySelector('[data-testid="analysis-card"]'); // Assuming you add data-testid="analysis-card" to the Card
                 const clonedInfoElement = documentClone.querySelector('[data-html2canvas-userinfo]');

                 if (clonedCard && clonedInfoElement) {
                    // Determine background color based on the computed style of the original card
                    const originalCard = analysisResultCardRef.current;
                    if (!originalCard) return;

                    const cardStyle = window.getComputedStyle(originalCard);
                    const cardBgColor = cardStyle.backgroundColor;

                    // Determine text color based on background luminance (simple example)
                    // You might need a more sophisticated luminance calculation or use theme variables
                    const isDarkBg = (element: Element) => {
                        const bgColor = window.getComputedStyle(element).backgroundColor;
                        if (!bgColor || bgColor === 'transparent') return false; // Default to light if no bg
                         try {
                            const rgb = bgColor.match(/\d+/g);
                            if (!rgb) return false;
                            // Simple luminance check (adjust threshold as needed)
                            const luminance = 0.2126 * parseInt(rgb[0]) + 0.7152 * parseInt(rgb[1]) + 0.0722 * parseInt(rgb[2]);
                            return luminance < 128;
                         } catch (e) {
                             return false; // Default to light on error
                         }
                    };


                    clonedCard.style.backgroundColor = cardBgColor; // Explicitly set card background from computed style

                    // Adjust text color based on bg
                    if (isDarkBg(originalCard)) {
                        clonedInfoElement.style.color = '#eee'; // Light text for dark bg
                        clonedInfoElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
                    } else {
                         clonedInfoElement.style.color = '#333'; // Dark text for light bg
                         clonedInfoElement.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
                    }


                 }
             }
        });

        // Remove the temporary element ONLY AFTER capture is complete
        if (analysisResultCardRef.current && userInfoElement && analysisResultCardRef.current.contains(userInfoElement)) {
            analysisResultCardRef.current.removeChild(userInfoElement);
            analysisResultCardRef.current.style.position = ''; // Reset position
            userInfoElement = null; // Clear reference
        }


        const image = canvas.toDataURL('image/png', 1.0);
        const link = document.createElement('a');
        link.href = image;
        link.download = `Alumbra_Analisis_${userData.apellido}_${userData.nombre}.png`; // Changed filename prefix
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
            title: "Descarga Completa",
            description: "El análisis Alumbra se ha descargado como imagen.", // Changed description
        });
        // Removed setIsDownloadDialogOpen and downloadForm.reset()

    } catch (err) {
        console.error("Error al generar la descarga:", err);
        toast({
            variant: "destructive",
            title: "Error de Descarga",
            description: "No se pudo generar la imagen del análisis.",
        });
        // Ensure temporary element is removed even on error
        if (analysisResultCardRef.current && userInfoElement && analysisResultCardRef.current.contains(userInfoElement)) {
             analysisResultCardRef.current.removeChild(userInfoElement);
             analysisResultCardRef.current.style.position = '';
        }
    } finally {
        setIsDownloading(false);
    }
  };


  // Function to get progress bar color based on risk level
  const getProgressColor = (level: number) => {
    if (level >= 90) return 'bg-red-700 animate-pulse'; // Darker pulsing red for imminent risk
    if (level > 75) return 'bg-destructive'; // Red for high risk
    if (level > 50) return 'bg-yellow-500'; // Yellow for medium risk
    return 'bg-primary'; // Blue for low risk (using primary color)
  };

  // Helper function to get icon and tooltip based on aggressor type
   const getAggressorInfo = (aggressorType: AnalysisResult['posible_agresor']) => {
      switch (aggressorType) {
          case 'usuario':
              return {
                  icon: UserX,
                  tooltip: 'El análisis sugiere que tú podrías estar mostrando comportamientos problemáticos.',
                  label: 'Tú (Usuario)'
              };
          case 'interlocutor':
              return {
                  icon: UserCheck,
                  tooltip: 'El análisis sugiere que la otra persona podría estar mostrando comportamientos problemáticos.',
                  label: 'La otra persona'
              };
          case 'ambiguo':
              return {
                  icon: Users,
                  tooltip: 'El análisis sugiere comportamientos problemáticos por ambas partes o no está claro.',
                  label: 'Ambigüo / Ambos'
              };
          case 'ninguno':
          default:
              return {
                  icon: HelpCircle,
                  tooltip: 'No se detectaron señales significativas de abuso o manipulación en el análisis.',
                  label: 'Ninguno Detectado'
               };
      }
   };


  return (
    <TooltipProvider> {/* Wrap with TooltipProvider */}
        <div className="w-full max-w-4xl space-y-8">
           {/* Go Back Button */}
           <Button variant="outline" onClick={() => router.push('/questionnaire')} className="mb-4 self-start">
               <ArrowLeft className="mr-2 h-4 w-4" />
               Volver al Cuestionario
           </Button>

          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-primary">💡 Analizador Alumbra</CardTitle> {/* Changed title and added emoji */}
              <CardDescription>
                Introduce el texto de la conversación abajo para analizar signos de manipulación o abuso emocional. Se usará el contexto que proporcionaste (género, tipo de relación).
              </CardDescription>
            </CardHeader>
            <CardContent>
             {/* Wrap conversation form with FormProvider */}
              <FormProvider {...conversationForm}>
                <Form {...conversationForm}>
                  <form onSubmit={conversationForm.handleSubmit(onConversationSubmit)} className="space-y-6">
                    <FormField
                      control={conversationForm.control}
                      name="conversationText"
                      render={({ field }) => (
                        <FormItem>
                          {/* RHFFormLabel expects to be within a FormItem provided by FormField */}
                          <RHFFormLabel>Texto de la Conversación</RHFFormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Pega la conversación aquí..."
                              className="min-h-[150px] resize-y"
                              {...field}
                              aria-label="Área de texto para pegar la conversación"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={isLoading || !userData} className="w-full sm:w-auto" title={!userData ? "Completa el cuestionario primero" : ""}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analizando...
                        </>
                      ) : (
                        "Analizar Conversación"
                      )}
                    </Button>
                  </form>
                </Form>
              </FormProvider>
            </CardContent>
          </Card>

          {isLoading && (
            <Card className="w-full animate-pulse"> {/* Added pulse animation */}
               <CardHeader>
                 <Skeleton className="h-6 w-1/3" />
                 <Skeleton className="h-4 w-2/3 mt-2" /> {/* Added margin */}
               </CardHeader>
               <CardContent className="space-y-6"> {/* Increased spacing */}
                 {/* Skeleton for Imminent Risk */}
                  <div className="space-y-2">
                     <Skeleton className="h-4 w-1/4" />
                     <Skeleton className="h-6 w-40" />
                  </div>
                 <div className="space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-10 w-full" /> {/* Taller for progress */}
                 </div>
                 {/* Skeleton for Aggressor */}
                  <div className="space-y-2">
                     <Skeleton className="h-4 w-1/4" />
                     <Skeleton className="h-6 w-32" />
                  </div>
                  <div className="space-y-2">
                     <Skeleton className="h-4 w-1/4" />
                     <div className="flex flex-wrap gap-2"> {/* Use flex-wrap */}
                        <Skeleton className="h-6 w-24 rounded-full" />
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <Skeleton className="h-6 w-28 rounded-full" />
                     </div>
                  </div>
                  <div className="space-y-2">
                     <Skeleton className="h-4 w-1/4" />
                     <Skeleton className="h-5 w-full" />
                     <Skeleton className="h-5 w-5/6" />
                     <Skeleton className="h-5 w-4/6" />
                  </div>
               </CardContent>
               <CardFooter className="flex flex-col items-start space-y-2"> {/* Adjusted layout */}
                  <Skeleton className="h-4 w-1/4 mb-1"/> {/* Reduced margin */}
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-4/5" />
                   <div className="flex justify-end w-full mt-4"> {/* Button skeleton */}
                      <Skeleton className="h-10 w-36"/>
                   </div>
               </CardFooter>
            </Card>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {analysisResult && !isLoading && (
            // Add ref and data-testid to the results card for capturing
            <Card ref={analysisResultCardRef} data-testid="analysis-card" className="w-full">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-primary">Resultados del Análisis Alumbra</CardTitle> {/* Changed title */}
                 {analysisResult.riesgo_inminente && (
                     <Alert variant="destructive" className="mt-2">
                         <Siren className="h-5 w-5" />
                         <AlertTitle className="font-bold">¡ALERTA DE RIESGO INMINENTE!</AlertTitle>
                         <AlertDescription>
                            Se ha detectado una situación de posible peligro inmediato. Por favor, lee las recomendaciones con urgencia y busca ayuda profesional.
                         </AlertDescription>
                     </Alert>
                 )}
                <CardDescription className={analysisResult.riesgo_inminente ? 'mt-1' : 'mt-2'}> {/* Adjust margin */}
                   Evaluación basada en el texto y contexto proporcionados.
                   {analysisResult.resumen_riesgo && (
                       <span className="block text-sm text-muted-foreground mt-1">
                           <strong>Resumen:</strong> {analysisResult.resumen_riesgo}
                        </span>
                   )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Risk Level */}
                <div>
                   <Label>Nivel de Riesgo General ({analysisResult.nivel_riesgo} / 100)</Label>
                   <Tooltip>
                      <TooltipTrigger asChild>
                         <Progress
                            value={analysisResult.nivel_riesgo}
                            className="w-full h-3 mt-1 cursor-help" // Add cursor-help
                            indicatorClassName={getProgressColor(analysisResult.nivel_riesgo)}
                            aria-label={`Nivel de riesgo ${analysisResult.nivel_riesgo} de 100`}
                          />
                      </TooltipTrigger>
                      <TooltipContent>
                         <p>
                           {analysisResult.nivel_riesgo < 50 ? 'Riesgo bajo: Pocas o ninguna señal preocupante detectada.' :
                           analysisResult.nivel_riesgo < 75 ? 'Riesgo medio: Se detectaron algunas señales de alerta. Considera las recomendaciones.' :
                           analysisResult.nivel_riesgo < 90 ? 'Riesgo alto: Se detectaron señales significativas de abuso o manipulación. Presta atención a las recomendaciones.' :
                           'Riesgo muy alto/inminente: Situación potencialmente peligrosa. Busca ayuda urgente.'}
                         </p>
                       </TooltipContent>
                   </Tooltip>

                </div>

                 {/* Possible Aggressor */}
                 <div>
                    <Label>Posible Origen del Comportamiento</Label>
                    <div className="flex items-center space-x-2 mt-1">
                       <Tooltip>
                          <TooltipTrigger asChild>
                            <span> {/* Wrap icon in span for TooltipTrigger */}
                               {React.createElement(getAggressorInfo(analysisResult.posible_agresor).icon, { className: "h-5 w-5 text-muted-foreground" })}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{getAggressorInfo(analysisResult.posible_agresor).tooltip}</p>
                          </TooltipContent>
                       </Tooltip>
                       <span className="text-sm text-foreground">{getAggressorInfo(analysisResult.posible_agresor).label}</span>
                    </div>
                 </div>

                {/* Detected Categories */}
                {analysisResult.categorias_detectadas.length > 0 && (
                  <div>
                    <Label>Categorías Detectadas</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {analysisResult.categorias_detectadas.map((category, index) => (
                        <Badge key={index} variant={category.includes('suicida') || category.includes('amenaza') ? 'destructive' : (index % 2 === 0 ? "secondary" : "outline")} className="capitalize">
                          {category.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Problematic Examples */}
                {analysisResult.ejemplos.length > 0 && (
                  <div>
                    <Label>Ejemplos Problemáticos Encontrados</Label>
                    <Alert className="mt-1 bg-muted/50"> {/* Slightly different background */}
                      <Terminal className="h-4 w-4 text-muted-foreground" /> {/* Muted icon */}
                      <AlertTitle className="text-sm font-medium">Frases Identificadas</AlertTitle> {/* Smaller title */}
                      <AlertDescription>
                        <ul className="list-disc list-inside space-y-1 mt-2 pl-2"> {/* Added padding */}
                          {analysisResult.ejemplos.map((example, index) => (
                            <li key={index} className="text-sm text-muted-foreground italic">"{example}"</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                 {/* Detailed Recommendations */}
                 {analysisResult.recomendaciones.length > 0 && (
                     <div className={`pt-2 ${analysisResult.riesgo_inminente ? 'border-t-2 border-destructive mt-4' : ''}`}> {/* Add separator if imminent risk */}
                        <Label className={`font-semibold ${analysisResult.riesgo_inminente ? 'text-destructive' : ''}`}>Recomendaciones Detalladas</Label> {/* Enhanced label */}
                        <ul className="list-disc list-inside space-y-2 text-sm text-foreground mt-1 pl-2"> {/* Changed text color and added padding */}
                          {analysisResult.recomendaciones.map((rec, index) => (
                            <li key={index} dangerouslySetInnerHTML={{ __html: rec.replace(/(\*\*|__)(.*?)\1/g, '<strong>$2</strong>') }}></li> // Basic bold formatting for markdown-like bold
                          ))}
                        </ul>
                     </div>
                 )}
              </CardContent>
              <CardFooter className="flex justify-end">
                 {/* Direct Download Button */}
                 <Button
                    variant="outline"
                    onClick={generateDownload}
                    disabled={isDownloading || !userData} // Disable if downloading or no user data
                    title={!userData ? "Completa el cuestionario primero para descargar" : ""} // Tooltip if disabled
                  >
                     {isDownloading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Descargando...
                        </>
                      ) : (
                         <>
                           <Download className="mr-2 h-4 w-4" />
                           Descargar Análisis
                         </>
                       )}
                 </Button>
                 {/* Removed Dialog structure */}
              </CardFooter>
            </Card>
          )}
        </div>
    </TooltipProvider> // Close TooltipProvider
  );
}
