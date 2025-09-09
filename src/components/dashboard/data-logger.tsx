"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  metric_id: z.string().min(1, { message: "Please select a metric." }),
  value: z.coerce.number({ invalid_type_error: "Value must be a number" }),
  timestamp: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface MetricDefinition {
  id: string;
  metric_name: string;
  beautiful_name: string;
}

type DataLoggerProps = {
  className?: string;
  title?: string;
};

export function DataLogger({ className, title = "Log a new data point" }: DataLoggerProps) {
  const supabase = createClient();
  const [metrics, setMetrics] = useState<MetricDefinition[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchMetrics = async () => {
      const { data } = await supabase
        .from("metric_definitions")
        .select("id, metric_name, beautiful_name");
      if (data) setMetrics(data);
    };
    fetchMetrics();
  }, [supabase]);

  const form = useForm<FormValues>({
    // Cast to align versions/types between react-hook-form and zod resolver
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      metric_id: "",
      value: 0,
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Not authenticated", description: "You must be logged in to log data.", variant: "destructive" });
      return;
    }

    // Hardcoding metric_source_id for now. In a real app, you'd have a way to select this.
    const { data: metricSource, error: sourceError } = await supabase
        .from('metric_sources')
        .select('id')
        .eq('user_id', user.id)
        .eq('source_name', 'Manual')
        .single();

    let sourceId = metricSource?.id;

    if (sourceError || !metricSource) {
        const { data: newSource, error: newSourceError } = await supabase
            .from('metric_sources')
            .insert({ user_id: user.id, source_name: 'Manual', source_identifier: 'manual' })
            .select('id')
            .single();
        
        if (newSourceError) {
          toast({ title: "Source error", description: "Error creating a manual data source.", variant: "destructive" });
          return;
        }
        sourceId = newSource.id;
    }

    const { error } = await supabase.from("data_points").insert([
      {
        user_id: user.id,
        metric_id: parseInt(values.metric_id),
        value_numeric: Number(values.value),
        metric_source_id: sourceId,
        timestamp: values.timestamp ? new Date(values.timestamp).toISOString() : new Date().toISOString(),
      },
    ]);

    if (error) {
      toast({ title: "Log failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Data point logged successfully!" });
      form.reset();
    }
  }

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="metric_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Metric</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a metric to log" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {metrics.map((metric) => (
                        <SelectItem key={metric.id} value={metric.id.toString()}>
                          {metric.beautiful_name || metric.metric_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Value</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="any"
                      placeholder="Enter the value"
                      value={Number.isFinite(field.value as unknown as number) ? (field.value as unknown as number) : 0}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="timestamp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Timestamp (Optional)</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                   <FormDescription>
                    If you leave this empty, the current time will be used.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Log Data</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
