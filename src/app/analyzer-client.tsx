"use client";

import * as React from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { analyze, AnalyzeConversationInput, AnalyzeConversationOutput } from '@/ai/flows/analyze-conversation';
import type { AnalysisResult } from '@/services/shadai';

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel as RHFFormLabel, FormMessage } from "@/components/ui/form"; // Renamed FormLabel to avoid conflict
import { Label } from "@/components/ui/label"; // Import standard Label
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, Terminal } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';

const FormSchema = z.object({
  conversationText: z.string().min(10, {
    message: "Conversation text must be at least 10 characters.",
  }),
});

export default function AnalyzerClient() {
  const [analysisResult, setAnalysisResult] = React.useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      conversationText: "",
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null); // Clear previous results

    try {
      const input: AnalyzeConversationInput = { text: data.conversationText };
      const result: AnalyzeConversationOutput = await analyze(input);
      // Add a small delay to simulate network latency and show loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      setAnalysisResult(result.analysisResult);
    } catch (err) {
      console.error("Analysis failed:", err);
      setError("Failed to analyze the conversation. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

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
          <CardTitle className="text-2xl font-bold text-primary">EmoVision Analyzer</CardTitle>
          <CardDescription>
            Input conversation text below to analyze for signs of manipulation or emotional abuse.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="conversationText"
                render={({ field }) => (
                  <FormItem>
                    <RHFFormLabel>Conversation Text</RHFFormLabel> {/* Use renamed RHF FormLabel */}
                    <FormControl>
                      <Textarea
                        placeholder="Paste the conversation here..."
                        className="min-h-[150px] resize-y"
                        {...field}
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
                    Analyzing...
                  </>
                ) : (
                  "Analyze Conversation"
                )}
              </Button>
            </form>
          </Form>
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
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-primary">Analysis Results</CardTitle>
            <CardDescription>Risk assessment based on the provided text.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Overall Risk Level ({analysisResult.nivel_riesgo} / 100)</Label> {/* Use standard Label */}
              <Progress
                value={analysisResult.nivel_riesgo}
                className="w-full h-3 mt-1"
                indicatorClassName={getProgressColor(analysisResult.nivel_riesgo)}
                aria-label={`Risk level ${analysisResult.nivel_riesgo} out of 100`}
              />
            </div>
            {analysisResult.categorias_detectadas.length > 0 && (
              <div>
                <Label>Detected Categories</Label> {/* Use standard Label */}
                <div className="flex flex-wrap gap-2 mt-1">
                  {analysisResult.categorias_detectadas.map((category, index) => (
                    <Badge key={index} variant={index % 2 === 0 ? "secondary" : "outline"} className="capitalize">
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {analysisResult.ejemplos.length > 0 && (
              <div>
                <Label>Problematic Examples Found</Label> {/* Use standard Label */}
                <Alert className="mt-1">
                  <Terminal className="h-4 w-4" />
                  <AlertTitle>Identified Phrases</AlertTitle>
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
          </CardContent>
          {analysisResult.recomendaciones.length > 0 && (
             <CardFooter className="flex-col items-start">
                <Label className="mb-1">Recommendations</Label> {/* Use standard Label */}
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {analysisResult.recomendaciones.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
             </CardFooter>
           )}
        </Card>
      )}
    </div>
  );
}
