"use client";

import * as React from "react";
import { useRouter } from 'next/navigation';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label"; // Using standard Label for radio items

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

export default function QuestionnaireClient() {
  const router = useRouter();
  const form = useForm<z.infer<typeof QuestionnaireFormSchema>>({
    resolver: zodResolver(QuestionnaireFormSchema),
  });

  function onSubmit(data: z.infer<typeof QuestionnaireFormSchema>) {
    console.log("Questionnaire Data:", data); // Optional: Log data or pass it
    router.push('/analyzer'); // Navigate to the analyzer page
  }

  return (
    <Card className="w-full max-w-2xl shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Cuestionario Inicial</CardTitle>
        <CardDescription>
          Queremos conocerte mejor, por favor responde las siguientes preguntas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FormProvider {...form}>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="relationshipType"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>1. ¿Esta conversación es con una pareja, amigo/a o familiar?</FormLabel>
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
                control={form.control}
                name="makesYouDoubt"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>2. ¿Sientes que esta persona te hace dudar de ti mismo/a o te hace sentir mal contigo mismo/a?</FormLabel>
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
                control={form.control}
                name="controlsYou"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>3. ¿Has sentido que esta persona te controla o te limita?</FormLabel>
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
                control={form.control}
                name="wantedToEndRelationship"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>4. ¿Alguna vez has querido cortar la relación, pero te sentiste culpable o incapaz?</FormLabel>
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
                control={form.control}
                name="wantsEvaluation"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>5. ¿Te gustaría recibir una evaluación sobre si estás viviendo una relación emocionalmente dañina?</FormLabel>
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
              >
                Continuar
              </Button>
            </form>
          </Form>
        </FormProvider>
      </CardContent>
    </Card>
  );
}
