"use client";

import * as React from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form"; // Import FormProvider
import { z } from "zod";
import { analyze, AnalyzeConversationInput, AnalyzeConversationOutput } from '@/ai/flows/analyze-conversation';
import type { AnalysisResult } from '@/services/shadai';
import html2canvas from 'html2canvas';
import { useToast } from "@/hooks/use-toast"; // Import useToast

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel as RHFFormLabel, FormMessage } from "@/components/ui/form"; // Renamed FormLabel to avoid conflict
import { Label } from "@/components/ui/label"; // Import standard Label
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2, AlertCircle, Terminal, Download } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';
import { useFormField } from '@/components/ui/form'; // Import useFormField hook

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

// Helper function to safely call useFormField
const SafeUseFormField = () => {
    try {
        return useFormField();
    } catch (e) {
        const id = React.useId();
        return {
            error: null,
            formItemId: `${id}-form-item`,
            formDescriptionId: `${id}-form-item-description`,
            formMessageId: `${id}-form-item-message`,
            invalid: false,
            isTouched: false,
            isDirty: false,
        };
    }
};


export default function AnalyzerClient() {
  const [analysisResult, setAnalysisResult] = React.useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isDownloadDialogOpen, setIsDownloadDialogOpen] = React.useState(false);
  const analysisResultCardRef = React.useRef<HTMLDivElement>(null);
  const { toast } = useToast(); // Initialize useToast

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
      await new Promise(resolve => setTimeout(resolve, 500));
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

    try {
        // Temporarily add user data for capture - consider a less intrusive way if possible
        const userInfoElement = document.createElement('div');
        userInfoElement.style.position = 'absolute'; // Use absolute to minimize layout shift
        userInfoElement.style.bottom = '10px';
        userInfoElement.style.left = '10px';
        userInfoElement.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'; // Semi-transparent background
        userInfoElement.style.padding = '5px';
        userInfoElement.style.borderRadius = '4px';
        userInfoElement.style.fontSize = '10px'; // Smaller font size
        userInfoElement.style.color = '#333'; // Dark text color
        userInfoElement.innerHTML = `
            Análisis para: ${userData.nombre} ${userData.apellido} (Edad: ${userData.edad})<br/>
            Fecha: ${new Date().toLocaleDateString('es-ES')}
        `;
        analysisResultCardRef.current.style.position = 'relative'; // Ensure parent is relative for absolute positioning
        analysisResultCardRef.current.appendChild(userInfoElement);


        const canvas = await html2canvas(analysisResultCardRef.current, {
            scale: 2, // Increase scale for better resolution
            useCORS: true, // If there are external images/styles
            backgroundColor: null, // Use element's background
        });

         // Remove the temporary element after capture
        analysisResultCardRef.current.removeChild(userInfoElement);
        analysisResultCardRef.current.style.position = ''; // Reset position


        const image = canvas.toDataURL('image/png', 1.0); // Use PNG for better quality
        const link = document.createElement('a');
        link.href = image;
        link.download = `EmoVision_Analisis_${userData.apellido}_${userData.nombre}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
            title: "Descarga Completa",
            description: "El análisis EmoVision se ha descargado como imagen.",
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
        if (analysisResultCardRef.current?.contains(userInfoElement)) {
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
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary">Analizador EmoVision</CardTitle>
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
        <Card className="w-full">
           <CardHeader>
             <Skeleton className="h-6 w-1/3" />
             <Skeleton className="h-4 w-2/3" />
           </CardHeader>
           <CardContent className="space-y-4">
             <div className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-6 w-full" />
             </div>
              <div className="space-y-2">
                 <Skeleton className="h-4 w-1/4" />
                 <div className="flex space-x-2">
                    <Skeleton className="h-6 w-24 rounded-full" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                 </div>
              </div>
              <div className="space-y-2">
                 <Skeleton className="h-4 w-1/4" />
                 <Skeleton className="h-5 w-full" />
                 <Skeleton className="h-5 w-5/6" />
              </div>
           </CardContent>
           <CardFooter>
              <Skeleton className="h-4 w-1/4 mb-2"/>
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-4/5" />
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
        // Add ref to the results card for capturing
        <Card ref={analysisResultCardRef} className="w-full">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-primary">Resultados del Análisis EmoVision</CardTitle>
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
                <Alert className="mt-1">
                  <Terminal className="h-4 w-4" />
                  <AlertTitle>Frases Identificadas</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1 mt-1">
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
                    <Label>Recomendaciones</Label>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground mt-1">
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
                         <DialogTitle>Descargar Análisis EmoVision</DialogTitle>
                         <DialogDescription>
                             Ingresa tus datos para incluir en la descarga.
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
                                             <RHFFormLabel className="text-right">Edad</RHFFormLabel>
                                             <FormControl>
                                                {/* Ensure type="number" */}
                                                 <Input {...field} type="number" className="col-span-3" aria-label="Edad" />
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
