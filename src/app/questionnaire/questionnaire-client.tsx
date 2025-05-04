
"use client";

import * as React from "react";
import { useRouter } from 'next/navigation';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form";
import { z } from "zod";
// Removed Link import as it's not used for triggering dialog anymore

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel as RHFFormLabel, FormMessage } from "@/components/ui/form"; // Renamed FormLabel
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label"; // Using standard Label for radio items
import { Checkbox } from "@/components/ui/checkbox"; // Import Checkbox
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"; // Removed DialogTrigger from here
import { ScrollArea } from "@/components/ui/scroll-area"; // Import ScrollArea
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const QuestionnaireFormSchema = z.object({
  // Updated enum to include new options
  relationshipType: z.enum(["pareja", "amistad", "familiar", "laboral", "grupo"], {
    required_error: "Debes seleccionar el tipo de relación.",
  }),
  makesYouDoubt: z.enum(["si", "no"], {
    required_error: "Debes responder esta pregunta.",
  }),
  controlsYou: z.enum(["si", "no"], {
    required_error: "Debes responder esta pregunta.",
  }),
  wantedToEndRelationship: z.enum(["si", "no"], {
    required_error: "Debes responder esta pregunta.",
  }),
  wantsEvaluation: z.enum(["si", "no"], {
    required_error: "Debes responder esta pregunta.",
  }),
  // Add termsAccepted field
  termsAccepted: z.boolean().refine(value => value === true, {
    message: "Debes aceptar los Términos y Condiciones para continuar.",
  }),
});

// Schema for user data collection
const UserDataFormSchema = z.object({
    nombre: z.string().min(1, { message: "El nombre es obligatorio." }),
    apellido: z.string().min(1, { message: "El apellido es obligatorio." }),
    edad: z.coerce.number().int().min(1, { message: "La edad debe ser un número positivo." }).max(120, { message: "Edad inválida." }),
    genero: z.enum(["hombre", "mujer", "prefiero_no_decirlo"], {
        required_error: "Debes seleccionar una opción de género.",
    }),
    emailEmergencia: z.string().email({ message: "Por favor, ingresa un correo electrónico válido." }).optional().or(z.literal('')), // Make emergency email optional but validated if provided
});

// Add genero and emailEmergencia types to UserData
type UserData = z.infer<typeof UserDataFormSchema>;

export default function QuestionnaireClient() {
  const router = useRouter();
  const { toast } = useToast();
  const [isUserDataDialogOpen, setIsUserDataDialogOpen] = React.useState(false);
  const [isSubmittingUserData, setIsSubmittingUserData] = React.useState(false);
  const [isTermsDialogOpen, setIsTermsDialogOpen] = React.useState(false); // State for terms dialog
  const [questionnaireData, setQuestionnaireData] = React.useState<z.infer<typeof QuestionnaireFormSchema> | null>(null); // Store questionnaire data

  const questionnaireForm = useForm<z.infer<typeof QuestionnaireFormSchema>>({
    resolver: zodResolver(QuestionnaireFormSchema),
    defaultValues: {
        termsAccepted: false, // Default to false
    }
  });

  const userDataForm = useForm<z.infer<typeof UserDataFormSchema>>({
    resolver: zodResolver(UserDataFormSchema),
    defaultValues: {
        nombre: "",
        apellido: "",
        edad: undefined,
        genero: undefined,
        emailEmergencia: "", // Default empty string
    },
  });

  function onQuestionnaireSubmit(data: z.infer<typeof QuestionnaireFormSchema>) {
    console.log("Questionnaire Data:", data); // Optional: Log data
    setQuestionnaireData(data); // Store questionnaire data before opening dialog
    // Open the user data dialog after questionnaire submission
    setIsUserDataDialogOpen(true);
  }

  async function onUserDataSubmit(userData: UserData) { // Use UserData type
    if (!questionnaireData) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Faltan datos del cuestionario. Inténtalo de nuevo.",
        });
        return;
    }

    setIsSubmittingUserData(true);
    try {
      // Combine questionnaire data and user data for storage
      const combinedData = {
          ...questionnaireData,
          ...userData,
      };

      // Save combined data to localStorage
      localStorage.setItem('alumbraUserData', JSON.stringify(combinedData));

      console.log("User Data Saved:", combinedData);
      toast({
        title: "Datos guardados",
        description: "Tu información ha sido guardada temporalmente.",
      });

      // Close the dialog
      setIsUserDataDialogOpen(false);
      // Reset the form for next time (optional)
      // userDataForm.reset();

      // Navigate to the analyzer page
      router.push('/analyzer');

    } catch (error) {
        console.error("Error saving user data:", error);
        toast({
            variant: "destructive",
            title: "Error al guardar",
            description: "No se pudo guardar tu información. Por favor, inténtalo de nuevo.",
        });
    } finally {
        setIsSubmittingUserData(false);
    }
  }

  return (
    <>
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Cuestionario Inicial</CardTitle>
          <CardDescription>
            Queremos conocerte mejor, por favor responde las siguientes preguntas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Wrap questionnaire form with FormProvider */}
          <FormProvider {...questionnaireForm}>
            <Form {...questionnaireForm}>
              <form onSubmit={questionnaireForm.handleSubmit(onQuestionnaireSubmit)} className="space-y-8">
                {/* Existing Questions */}
                 <FormField
                   control={questionnaireForm.control}
                   name="relationshipType"
                   render={({ field }) => (
                     <FormItem className="space-y-3">
                       <RHFFormLabel>1. ¿Esta conversación es con una pareja, amigo/a, familiar, colega o grupo?</RHFFormLabel>
                       <FormControl>
                         <RadioGroup
                           onValueChange={field.onChange}
                           defaultValue={field.value}
                           className="flex flex-col space-y-1 sm:flex-row sm:space-y-0 sm:space-x-4 sm:flex-wrap" // Added flex-wrap
                           aria-label="Tipo de relación"
                         >
                           <FormItem className="flex items-center space-x-2">
                             <FormControl>
                               <RadioGroupItem value="pareja" id="r1-pareja" />
                             </FormControl>
                             <Label htmlFor="r1-pareja" className="font-normal">Pareja</Label>
                           </FormItem>
                           <FormItem className="flex items-center space-x-2">
                             <FormControl>
                               <RadioGroupItem value="amistad" id="r1-amistad" />
                             </FormControl>
                             <Label htmlFor="r1-amistad" className="font-normal">Amistad</Label>
                           </FormItem>
                           <FormItem className="flex items-center space-x-2">
                             <FormControl>
                               <RadioGroupItem value="familiar" id="r1-familiar" />
                             </FormControl>
                             <Label htmlFor="r1-familiar" className="font-normal">Familiar</Label>
                           </FormItem>
                            <FormItem className="flex items-center space-x-2"> {/* Added Laboral */}
                             <FormControl>
                               <RadioGroupItem value="laboral" id="r1-laboral" />
                             </FormControl>
                             <Label htmlFor="r1-laboral" className="font-normal">Laboral</Label>
                           </FormItem>
                           <FormItem className="flex items-center space-x-2"> {/* Added Grupo */}
                             <FormControl>
                               <RadioGroupItem value="grupo" id="r1-grupo" />
                             </FormControl>
                             <Label htmlFor="r1-grupo" className="font-normal">Grupo</Label>
                           </FormItem>
                         </RadioGroup>
                       </FormControl>
                       <FormMessage />
                     </FormItem>
                   )}
                 />

                 <FormField
                   control={questionnaireForm.control}
                   name="makesYouDoubt"
                   render={({ field }) => (
                     <FormItem className="space-y-3">
                       <RHFFormLabel>2. ¿Sientes que esta persona (o personas en la conversación) te hace dudar de ti mismo/a o te hace sentir mal contigo mismo/a?</RHFFormLabel>
                       <FormControl>
                         <RadioGroup
                           onValueChange={field.onChange}
                           defaultValue={field.value}
                           className="flex space-x-4"
                           aria-label="Te hace dudar"
                         >
                           <FormItem className="flex items-center space-x-2">
                             <FormControl>
                               <RadioGroupItem value="si" id="r2-si" />
                             </FormControl>
                             <Label htmlFor="r2-si" className="font-normal">Sí</Label>
                           </FormItem>
                           <FormItem className="flex items-center space-x-2">
                             <FormControl>
                               <RadioGroupItem value="no" id="r2-no" />
                             </FormControl>
                             <Label htmlFor="r2-no" className="font-normal">No</Label>
                           </FormItem>
                         </RadioGroup>
                       </FormControl>
                       <FormMessage />
                     </FormItem>
                   )}
                 />

                 <FormField
                   control={questionnaireForm.control}
                   name="controlsYou"
                   render={({ field }) => (
                     <FormItem className="space-y-3">
                       <RHFFormLabel>3. ¿Has sentido que esta persona (o personas) te controla o te limita?</RHFFormLabel>
                       <FormControl>
                         <RadioGroup
                           onValueChange={field.onChange}
                           defaultValue={field.value}
                           className="flex space-x-4"
                           aria-label="Te controla o limita"
                         >
                           <FormItem className="flex items-center space-x-2">
                             <FormControl>
                               <RadioGroupItem value="si" id="r3-si" />
                             </FormControl>
                             <Label htmlFor="r3-si" className="font-normal">Sí</Label>
                           </FormItem>
                           <FormItem className="flex items-center space-x-2">
                             <FormControl>
                               <RadioGroupItem value="no" id="r3-no" />
                             </FormControl>
                             <Label htmlFor="r3-no" className="font-normal">No</Label>
                           </FormItem>
                         </RadioGroup>
                       </FormControl>
                       <FormMessage />
                     </FormItem>
                   )}
                 />

                 <FormField
                   control={questionnaireForm.control}
                   name="wantedToEndRelationship"
                   render={({ field }) => (
                     <FormItem className="space-y-3">
                       <RHFFormLabel>4. Si aplica (pareja, amistad, familiar), ¿alguna vez has querido cortar la relación, pero te sentiste culpable o incapaz?</RHFFormLabel>
                       <FormControl>
                         <RadioGroup
                           onValueChange={field.onChange}
                           defaultValue={field.value}
                           className="flex space-x-4"
                           aria-label="Quisiste cortar relación"
                         >
                           <FormItem className="flex items-center space-x-2">
                             <FormControl>
                               <RadioGroupItem value="si" id="r4-si" />
                             </FormControl>
                             <Label htmlFor="r4-si" className="font-normal">Sí</Label>
                           </FormItem>
                           <FormItem className="flex items-center space-x-2">
                             <FormControl>
                               <RadioGroupItem value="no" id="r4-no" />
                             </FormControl>
                             <Label htmlFor="r4-no" className="font-normal">No / No aplica</Label> {/* Updated label */}
                           </FormItem>
                         </RadioGroup>
                       </FormControl>
                       <FormMessage />
                     </FormItem>
                   )}
                 />

                 <FormField
                   control={questionnaireForm.control}
                   name="wantsEvaluation"
                   render={({ field }) => (
                     <FormItem className="space-y-3">
                       <RHFFormLabel>5. ¿Te gustaría recibir una evaluación sobre si la dinámica de esta conversación podría ser emocionalmente dañina?</RHFFormLabel>
                       <FormControl>
                         <RadioGroup
                           onValueChange={field.onChange}
                           defaultValue={field.value}
                           className="flex space-x-4"
                           aria-label="Desea evaluación"
                         >
                           <FormItem className="flex items-center space-x-2">
                             <FormControl>
                               <RadioGroupItem value="si" id="r5-si" />
                             </FormControl>
                             <Label htmlFor="r5-si" className="font-normal">Sí</Label>
                           </FormItem>
                           <FormItem className="flex items-center space-x-2">
                             <FormControl>
                               <RadioGroupItem value="no" id="r5-no" />
                             </FormControl>
                             <Label htmlFor="r5-no" className="font-normal">No</Label>
                           </FormItem>
                         </RadioGroup>
                       </FormControl>
                       <FormMessage />
                     </FormItem>
                   )}
                 />

                 {/* Terms and Conditions Checkbox */}
                 <FormField
                  control={questionnaireForm.control}
                  name="termsAccepted"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          aria-label="Aceptar términos y condiciones"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <RHFFormLabel>
                          He leído y acepto los{" "}
                          {/* Remove DialogTrigger wrapper, use Button directly */}
                          <Button
                              variant="link"
                              type="button" // Prevent form submission
                              className="p-0 h-auto text-primary underline"
                              onClick={(e) => {e.preventDefault(); setIsTermsDialogOpen(true);}}>
                                Términos y Condiciones
                          </Button>
                          .
                        </RHFFormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />


                <Button
                  type="submit"
                  className="w-full bg-[hsl(var(--questionnaire-button-bg))] text-[hsl(var(--questionnaire-button-fg))] hover:bg-[hsl(var(--questionnaire-button-bg),0.9)]" // Use CSS variables for button style
                  // Disable while submitting user data OR if form is invalid
                  disabled={isSubmittingUserData || !questionnaireForm.formState.isValid}
                  title={!questionnaireForm.formState.isValid ? "Por favor, completa todas las preguntas y acepta los términos." : ""}
                >
                  {isSubmittingUserData ? (
                     <>
                       <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                       Guardando...
                     </>
                   ) : (
                     "Continuar"
                   )}
                </Button>
              </form>
            </Form>
          </FormProvider>
        </CardContent>
      </Card>

      {/* User Data Collection Dialog */}
      <Dialog open={isUserDataDialogOpen} onOpenChange={setIsUserDataDialogOpen}>
           <DialogContent className="sm:max-w-[425px]">
               <DialogHeader>
                   <DialogTitle>Ingresa tus Datos</DialogTitle>
                   <DialogDescription>
                       Estos datos se usarán para personalizar la descarga de tu análisis más adelante. No se almacenarán permanentemente. Proporciona un correo de emergencia si deseas que se notifique a alguien en caso de detectar un riesgo alto.
                   </DialogDescription>
               </DialogHeader>
               {/* Wrap user data form with FormProvider */}
               <FormProvider {...userDataForm}>
                   <Form {...userDataForm}>
                       <form onSubmit={userDataForm.handleSubmit(onUserDataSubmit)} className="grid gap-4 py-4">
                           <FormField
                               control={userDataForm.control}
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
                               control={userDataForm.control}
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
                               control={userDataForm.control}
                               name="edad"
                               render={({ field }) => (
                                   <FormItem className="grid grid-cols-4 items-center gap-4">
                                       <RHFFormLabel className="text-right">Edad</RHFFormLabel>
                                       <FormControl>
                                           <Input {...field} type="number" className="col-span-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" aria-label="Edad" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}/>
                                       </FormControl>
                                       <FormMessage className="col-span-4 text-right" />
                                   </FormItem>
                               )}
                           />
                           {/* Gender Radio Group */}
                           <FormField
                             control={userDataForm.control}
                             name="genero"
                             render={({ field }) => (
                               <FormItem className="space-y-3">
                                 <div className="grid grid-cols-4 items-center gap-4">
                                    <RHFFormLabel className="text-right">Género</RHFFormLabel>
                                    <FormControl className="col-span-3">
                                        <RadioGroup
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        className="flex flex-col space-y-1 sm:flex-row sm:space-y-0 sm:space-x-4"
                                        aria-label="Género"
                                        >
                                        <FormItem className="flex items-center space-x-2">
                                            <FormControl>
                                            <RadioGroupItem value="hombre" id="g-hombre" />
                                            </FormControl>
                                            <Label htmlFor="g-hombre" className="font-normal">Hombre</Label>
                                        </FormItem>
                                        <FormItem className="flex items-center space-x-2">
                                            <FormControl>
                                            <RadioGroupItem value="mujer" id="g-mujer" />
                                            </FormControl>
                                            <Label htmlFor="g-mujer" className="font-normal">Mujer</Label>
                                        </FormItem>
                                        <FormItem className="flex items-center space-x-2">
                                            <FormControl>
                                            <RadioGroupItem value="prefiero_no_decirlo" id="g-otro" />
                                            </FormControl>
                                            <Label htmlFor="g-otro" className="font-normal">Prefiero no decirlo</Label>
                                        </FormItem>
                                        </RadioGroup>
                                    </FormControl>
                                  </div>
                                  <FormMessage className="col-span-4 text-right" /> {/* Adjust positioning if needed */}
                               </FormItem>
                             )}
                            />

                           {/* Emergency Email Input */}
                            <FormField
                               control={userDataForm.control}
                               name="emailEmergencia"
                               render={({ field }) => (
                                   <FormItem className="grid grid-cols-4 items-center gap-4">
                                       <RHFFormLabel htmlFor="emailEmergencia" className="text-right">Correo de Emergencia <span className="text-xs text-muted-foreground">(Opcional)</span></RHFFormLabel>
                                       <FormControl>
                                           <Input
                                              id="emailEmergencia"
                                               type="email"
                                               placeholder="ejemplo@dominio.com"
                                               className="col-span-3"
                                               aria-label="Correo electrónico de emergencia (opcional)"
                                               {...field}
                                           />
                                       </FormControl>
                                       <FormMessage className="col-span-4 text-right" />
                                   </FormItem>
                               )}
                           />


                           <DialogFooter>
                               <DialogClose asChild>
                                  <Button type="button" variant="outline" disabled={isSubmittingUserData}>Cancelar</Button>
                               </DialogClose>
                               <Button type="submit" disabled={isSubmittingUserData}>
                                   {isSubmittingUserData ? (
                                       <>
                                           <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                           Guardando...
                                       </>
                                   ) : (
                                       "Guardar y Continuar"
                                   )}
                               </Button>
                           </DialogFooter>
                       </form>
                   </Form>
               </FormProvider>
           </DialogContent>
       </Dialog>

        {/* Terms and Conditions Dialog */}
       <Dialog open={isTermsDialogOpen} onOpenChange={setIsTermsDialogOpen}>
         <DialogContent className="sm:max-w-2xl">
           <DialogHeader>
             <DialogTitle>Términos y Condiciones de Alumbra</DialogTitle>
             <DialogDescription>
               Por favor, lee detenidamente nuestros términos antes de usar la aplicación.
             </DialogDescription>
           </DialogHeader>
           <ScrollArea className="max-h-[60vh] pr-6"> {/* Added ScrollArea */}
                <div className="space-y-4 text-sm text-muted-foreground">
                    <p>Bienvenido/a a Alumbra. Al utilizar esta aplicación, aceptas cumplir con los siguientes términos y condiciones. Si no estás de acuerdo con alguna parte, por favor no utilices Alumbra.</p>

                    <h3 className="font-semibold text-foreground">1. Propósito de la Aplicación</h3>
                    <p>Alumbra es una herramienta diseñada para ayudar a identificar posibles señales de abuso emocional o manipulación en conversaciones digitales mediante análisis con inteligencia artificial (IA). No proporciona diagnósticos médicos ni psicológicos. Los resultados son indicativos y no sustituyen el consejo de un profesional cualificado.</p>

                    <h3 className="font-semibold text-foreground">2. Uso de la Inteligencia Artificial</h3>
                    <p>La aplicación utiliza modelos de IA (Gemini) para analizar el texto proporcionado. La precisión del análisis puede variar y no está garantizada. La IA puede malinterpretar matices o contexto. Utiliza los resultados como un punto de partida para la reflexión, no como una verdad absoluta.</p>

                    <h3 className="font-semibold text-foreground">3. Privacidad y Datos</h3>
                    <p>Respetamos tu privacidad. Las conversaciones que ingresas para análisis se procesan de forma segura y no se almacenan permanentemente asociadas a tu identidad después del análisis. Los datos del cuestionario (tipo de relación, respuestas a preguntas) y los datos personales (nombre, apellido, edad, género, correo de emergencia) se guardan temporalmente en el almacenamiento local de tu navegador (`localStorage`) únicamente para incluirlos en la descarga del análisis si decides hacerlo y para contextualizar el análisis de la IA y la función de notificación de emergencia. Estos datos no se envían a nuestros servidores de forma persistente para almacenamiento a largo plazo.</p>
                    <p>Podemos recopilar datos anónimos sobre el uso de la aplicación para mejorar nuestros servicios. Esto no incluirá el contenido de tus conversaciones ni tus datos personales identificables.</p>

                    <h3 className="font-semibold text-foreground">4. Notificación de Emergencia (Opcional)</h3>
                     <p>Si proporcionas un correo electrónico de emergencia, Alumbra intentará enviar una notificación a esa dirección si el análisis detecta un nivel de riesgo muy alto o indicadores específicos de peligro inminente (como ideación suicida explícita o amenazas graves). Esta función depende de la capacidad de la IA para identificar correctamente dichas situaciones y de la disponibilidad de servicios externos de envío de correo, por lo que no se garantiza su funcionamiento en todos los casos. El contenido de la notificación incluirá el nombre y apellido que proporcionaste, un resumen del análisis y, si es posible, una imagen adjunta del análisis detallado. El propósito es alertar a tu contacto de confianza sobre una posible situación de riesgo. Tú eres responsable de informar a tu contacto de emergencia que lo has designado y de obtener su consentimiento para recibir dichas notificaciones.</p>

                    <h3 className="font-semibold text-foreground">5. Limitación de Responsabilidad</h3>
                    <p>Alumbra se proporciona "tal cual", sin garantías de ningún tipo, incluyendo la función de notificación de emergencia. El equipo de desarrollo no se hace responsable de las decisiones que tomes basadas en el análisis proporcionado, ni de la falla o éxito de la notificación de emergencia. El uso de la aplicación es bajo tu propio riesgo. No somos responsables de ningún daño directo, indirecto, incidental o consecuente que surja del uso de esta herramienta.</p>
                    <p>Si te encuentras en una situación de peligro inmediato, contacta a las autoridades locales o a una línea de ayuda especializada. No dependas únicamente de Alumbra para tu seguridad.</p>

                    <h3 className="font-semibold text-foreground">6. Indemnización (¡Atención!)</h3>
                    <p>Aceptas defender, indemnizar y eximir de toda responsabilidad al equipo de desarrollo de Alumbra, sus afiliados, directores, empleados y agentes, de y contra cualquier reclamo, acción, demanda, responsabilidad, costos o gastos (incluidos honorarios legales razonables) que surjan de: (a) tu uso de la aplicación Alumbra; (b) tu violación de estos Términos y Condiciones; (c) cualquier contenido que envíes o transmitas a través de la aplicación; o (d) tu violación de los derechos de cualquier tercero. Esta obligación de defensa e indemnización sobrevivirá a estos Términos y a tu uso de la aplicación. (Aclaración irónica: Esta idea no es tomada de Ubisoft, cualquier parecido es pura coincidencia... guiño, guiño).</p>

                    <h3 className="font-semibold text-foreground">7. Propiedad Intelectual</h3>
                    <p>Todo el contenido y software de Alumbra, incluyendo el diseño, texto, gráficos y código, es propiedad del equipo de desarrollo o sus licenciantes y está protegido por leyes de propiedad intelectual. No puedes copiar, modificar, distribuir o realizar ingeniería inversa de ninguna parte de la aplicación sin permiso explícito.</p>

                    <h3 className="font-semibold text-foreground">8. Modificaciones de los Términos</h3>
                    <p>Nos reservamos el derecho de modificar estos Términos y Condiciones en cualquier momento. Te notificaremos los cambios importantes. El uso continuado de la aplicación después de dichos cambios constituirá tu aceptación de los nuevos términos.</p>

                    <h3 className="font-semibold text-foreground">9. Ley Aplicable</h3>
                    <p>Estos términos se regirán e interpretarán de acuerdo con las leyes de la jurisdicción donde reside el equipo de desarrollo, sin tener en cuenta sus conflictos de principios legales.</p>

                    <h3 className="font-semibold text-foreground">10. Contacto</h3>
                    <p>Si tienes alguna pregunta sobre estos Términos y Condiciones, por favor contáctanos a través de los canales proporcionados (si existen).</p>

                    <p className="pt-4 font-bold">Al hacer clic en "Aceptar" en el cuestionario, confirmas que has leído, comprendido y aceptado estos Términos y Condiciones.</p>
                </div>
            </ScrollArea> {/* End ScrollArea */}
           <DialogFooter>
             <DialogClose asChild>
               <Button type="button">Cerrar</Button>
             </DialogClose>
           </DialogFooter>
         </DialogContent>
       </Dialog>
    </>
  );
}

