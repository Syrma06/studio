
"use client";

import * as React from "react";
import { useRouter } from 'next/navigation';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel as RHFFormLabel, FormMessage } from "@/components/ui/form"; // Renamed FormLabel
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label"; // Using standard Label for radio items
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const QuestionnaireFormSchema = z.object({
  relationshipType: z.enum(["pareja", "amistad", "familiar"], {
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
});

// Schema for user data collection
const UserDataFormSchema = z.object({
    nombre: z.string().min(1, { message: "El nombre es obligatorio." }),
    apellido: z.string().min(1, { message: "El apellido es obligatorio." }),
    edad: z.coerce.number().int().min(1, { message: "La edad debe ser un número positivo." }).max(120, { message: "Edad inválida." }),
});

export default function QuestionnaireClient() {
  const router = useRouter();
  const { toast } = useToast();
  const [isUserDataDialogOpen, setIsUserDataDialogOpen] = React.useState(false);
  const [isSubmittingUserData, setIsSubmittingUserData] = React.useState(false);

  const questionnaireForm = useForm<z.infer<typeof QuestionnaireFormSchema>>({
    resolver: zodResolver(QuestionnaireFormSchema),
  });

  const userDataForm = useForm<z.infer<typeof UserDataFormSchema>>({
    resolver: zodResolver(UserDataFormSchema),
    defaultValues: {
        nombre: "",
        apellido: "",
        edad: undefined,
    },
  });

  function onQuestionnaireSubmit(data: z.infer<typeof QuestionnaireFormSchema>) {
    console.log("Questionnaire Data:", data); // Optional: Log data
    // Instead of navigating directly, open the user data dialog
    setIsUserDataDialogOpen(true);
  }

  async function onUserDataSubmit(userData: z.infer<typeof UserDataFormSchema>) {
    setIsSubmittingUserData(true);
    try {
      // Save user data to localStorage
      localStorage.setItem('alumbraUserData', JSON.stringify(userData));

      console.log("User Data Saved:", userData);
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
                <FormField
                  control={questionnaireForm.control}
                  name="relationshipType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <RHFFormLabel>1. ¿Esta conversación es con una pareja, amigo/a o familiar?</RHFFormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1 sm:flex-row sm:space-y-0 sm:space-x-4"
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
                      <RHFFormLabel>2. ¿Sientes que esta persona te hace dudar de ti mismo/a o te hace sentir mal contigo mismo/a?</RHFFormLabel>
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
                      <RHFFormLabel>3. ¿Has sentido que esta persona te controla o te limita?</RHFFormLabel>
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
                      <RHFFormLabel>4. ¿Alguna vez has querido cortar la relación, pero te sentiste culpable o incapaz?</RHFFormLabel>
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
                            <Label htmlFor="r4-no" className="font-normal">No</Label>
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
                      <RHFFormLabel>5. ¿Te gustaría recibir una evaluación sobre si estás viviendo una relación emocionalmente dañina?</RHFFormLabel>
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

                <Button
                  type="submit"
                  className="w-full bg-[hsl(var(--questionnaire-button-bg))] text-[hsl(var(--questionnaire-button-fg))] hover:bg-[hsl(var(--questionnaire-button-bg),0.9)]" // Use CSS variables for button style
                  // Disable while submitting user data
                  disabled={isSubmittingUserData}
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
                       Estos datos se usarán para personalizar la descarga de tu análisis más adelante. No se almacenarán permanentemente.
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
    </>
  );
}
