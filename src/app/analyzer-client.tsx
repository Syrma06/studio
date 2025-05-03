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
import { Form, FormControl, FormField, FormItem, FormLabel as RHFFormLabel, FormMessage, useFormField } from "@/components/ui/form"; // Renamed FormLabel and imported useFormField
import { Label } from "@/components/ui/label"; // Import standard Label
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2, AlertCircle, Terminal, Download, ArrowLeft } from "lucide-react"; // Added ArrowLeft
import { Skeleton } from '@/components/ui/skeleton';
// Removed duplicate import of useFormField hook

const ConversationFormSchema = z.object({
  conversationText: z.string().min(10, {
    message: "El texto de la conversación debe tener al menos 10 caracteres.",
  }),
});

const DownloadFormSchema = z.object({
    nombre: z.string().min(1, { message: "El nombre es obligatorio." }),
    apellido: z.string().min(1, { message: "El apellido es obligatorio." }),
    edad: z.coerce.number().int().min(1, { message: "La edad debe ser un número positivo." }).max(120, { message: "Edad inválida." }),
});


export default function AnalyzerClient() {
  const [analysisResult, setAnalysisResult] = React.useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isDownloadDialogOpen, setIsDownloadDialogOpen] = React.useState(false);
  const analysisResultCardRef = React.useRef<HTMLDivElement>(null);
  const { toast } = useToast(); // Initialize useToast
  const router = useRouter(); // Initialize useRouter

  const conversationForm = useForm<z.infer<typeof ConversationFormSchema>>({
    resolver: zodResolver(ConversationFormSchema),
    defaultValues: {
      conversationText: "",
    },
  });

  const downloadForm = useForm<z.infer<typeof DownloadFormSchema>>({
    resolver: zodResolver(DownloadFormSchema),
    defaultValues: {
        nombre: "",
        apellido: "",
        edad: undefined, // Use undefined for number input default
    },
  });

  async function onConversationSubmit(data: z.infer<typeof ConversationFormSchema>) {
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null); // Clear previous results

    try {
      const input: AnalyzeConversationInput = { text: data.conversationText };
      const result: AnalyzeConversationOutput = await analyze(input);
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate slight delay if needed
      setAnalysisResult(result.analysisResult);
    } catch (err) {
      console.error("Análisis fallido:", err);
      setError("Error al analizar la conversación. Por favor, inténtalo de nuevo.");
      toast({ // Show error toast
          variant: "destructive",
          title: "Error de Análisis",
          description: "No se pudo completar el análisis. Inténtalo de nuevo.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const generateDownload = async (userData: z.infer<typeof DownloadFormSchema>) => {
    if (!analysisResultCardRef.current || !analysisResult) {
        toast({
            variant: "destructive",
            title: "Error de Descarga",
            description: "No se encontraron los resultados del análisis para descargar.",
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
        userInfoElement.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
        userInfoElement.style.padding = '5px';
        userInfoElement.style.borderRadius = '4px';
        userInfoElement.style.fontSize = '10px';
        userInfoElement.style.color = '#333'; // Use dark text for light background
        userInfoElement.style.zIndex = '1'; // Ensure it's above other content if needed
        // Add a data attribute for easier selection in onclone
        userInfoElement.setAttribute('data-html2canvas-userinfo', 'true');
        userInfoElement.innerHTML = `
            Análisis para: ${userData.nombre} ${userData.apellido} (Edad: ${userData.edad})<br/>
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
                     // Ensure the card uses the light theme background explicitly for capture
                     // Adjust color values if your theme differs significantly
                    clonedCard.style.backgroundColor = 'hsl(var(--card))'; // Explicitly set card background
                    clonedInfoElement.style.color = 'hsl(var(--card-foreground))'; // Ensure text is readable on card background
                    clonedInfoElement.style.backgroundColor = 'hsla(var(--background), 0.8)'; // Use background with alpha
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
        setIsDownloadDialogOpen(false); // Close dialog on success
        downloadForm.reset(); // Reset download form

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
    if (level > 75) return 'bg-destructive'; // Red for high risk
    if (level > 50) return 'bg-yellow-500'; // Yellow for medium risk
    return 'bg-primary'; // Blue for low risk (using primary color)
  };

  return (
    <div className="w-full max-w-4xl space-y-8">
       {/* Go Back Button */}
       <Button variant="outline" onClick={() => router.push('/questionnaire')} className="mb-4 self-start">
           <ArrowLeft className="mr-2 h-4 w-4" />
           Volver al Cuestionario
       </Button>

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary">Analizador Alumbra</CardTitle> {/* Changed title */}
          <CardDescription>
            Introduce el texto de la conversación abajo para analizar signos de manipulación o abuso emocional.
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
                <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
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
             <div className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-10 w-full" /> {/* Taller for progress */}
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
            <CardDescription>Evaluación de riesgo basada en el texto proporcionado.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Nivel de Riesgo General ({analysisResult.nivel_riesgo} / 100)</Label>
              <Progress
                value={analysisResult.nivel_riesgo}
                className="w-full h-3 mt-1"
                indicatorClassName={getProgressColor(analysisResult.nivel_riesgo)}
                aria-label={`Nivel de riesgo ${analysisResult.nivel_riesgo} de 100`}
              />
            </div>
            {analysisResult.categorias_detectadas.length > 0 && (
              <div>
                <Label>Categorías Detectadas</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {analysisResult.categorias_detectadas.map((category, index) => (
                    <Badge key={index} variant={index % 2 === 0 ? "secondary" : "outline"} className="capitalize">
                      {category.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
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
             {analysisResult.recomendaciones.length > 0 && (
                 <div className="pt-2"> {/* Added spacing */}
                    <Label>Recomendaciones Detalladas</Label> {/* Enhanced label */}
                    <ul className="list-disc list-inside space-y-2 text-sm text-foreground mt-1 pl-2"> {/* Changed text color and added padding */}
                      {analysisResult.recomendaciones.map((rec, index) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                 </div>
             )}
          </CardContent>
          <CardFooter className="flex justify-end">
             {/* Download Button Trigger */}
             <Dialog open={isDownloadDialogOpen} onOpenChange={setIsDownloadDialogOpen}>
                 <DialogTrigger asChild>
                     <Button variant="outline">
                         <Download className="mr-2 h-4 w-4" />
                         Descargar Análisis
                     </Button>
                 </DialogTrigger>
                 <DialogContent className="sm:max-w-[425px]">
                     <DialogHeader>
                         <DialogTitle>Descargar Análisis Alumbra</DialogTitle> {/* Changed title */}
                         <DialogDescription>
                             Ingresa tus datos para incluir en la descarga. La imagen se guardará localmente.
                         </DialogDescription>
                     </DialogHeader>
                     {/* Wrap download form with FormProvider */}
                     <FormProvider {...downloadForm}>
                         <Form {...downloadForm}>
                             <form onSubmit={downloadForm.handleSubmit(generateDownload)} className="grid gap-4 py-4">
                                 <FormField
                                     control={downloadForm.control}
                                     name="nombre"
                                     render={({ field }) => (
                                         <FormItem className="grid grid-cols-4 items-center gap-4">
                                             {/* Use RHFFormLabel here */}
                                             <RHFFormLabel className="text-right">Nombre</RHFFormLabel>
                                             <FormControl>
                                                 <Input {...field} className="col-span-3" aria-label="Nombre" />
                                             </FormControl>
                                             <FormMessage className="col-span-4 text-right" />
                                         </FormItem>
                                     )}
                                 />
                                 <FormField
                                     control={downloadForm.control}
                                     name="apellido"
                                     render={({ field }) => (
                                         <FormItem className="grid grid-cols-4 items-center gap-4">
                                              {/* Use RHFFormLabel here */}
                                             <RHFFormLabel className="text-right">Apellido</RHFFormLabel>
                                             <FormControl>
                                                 <Input {...field} className="col-span-3" aria-label="Apellido" />
                                             </FormControl>
                                              <FormMessage className="col-span-4 text-right" />
                                         </FormItem>
                                     )}
                                 />
                                  <FormField
                                     control={downloadForm.control}
                                     name="edad"
                                     render={({ field }) => (
                                         <FormItem className="grid grid-cols-4 items-center gap-4">
                                              {/* Use RHFFormLabel here */}
                                             <RHFFormLabel className="text-right">Edad</RHFFormLabel>
                                             <FormControl>
                                                {/* Ensure type="number" */}
                                                 <Input {...field} type="number" className="col-span-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" aria-label="Edad" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}/>
                                             </FormControl>
                                             <FormMessage className="col-span-4 text-right" />
                                         </FormItem>
                                     )}
                                 />
                                 <DialogFooter>
                                     <DialogClose asChild>
                                        <Button type="button" variant="outline">Cancelar</Button>
                                     </DialogClose>
                                     <Button type="submit" disabled={isDownloading}>
                                         {isDownloading ? (
                                             <>
                                                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                 Descargando...
                                             </>
                                         ) : (
                                             "Confirmar y Descargar"
                                         )}
                                     </Button>
                                 </DialogFooter>
                             </form>
                         </Form>
                     </FormProvider>
                 </DialogContent>
             </Dialog>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
