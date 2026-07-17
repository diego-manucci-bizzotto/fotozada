import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PauseCircle, Save, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { settingsSchema, type SettingsValues } from "../schema";
import type { AdminSettings } from "../types";

interface Props {
  settings: AdminSettings;
  saving: boolean;
  onSave: (values: SettingsValues) => void;
}

export function ControlsForm({ settings, saving, onSave }: Props) {
  const defaults: SettingsValues = {
    queue_paused: settings.queue_paused,
    require_approval: settings.require_approval,
    max_sheets_per_batch: settings.max_sheets_per_batch,
  };

  const form = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    form.reset(defaults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.queue_paused, settings.require_approval, settings.max_sheets_per_batch]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          Controles da fila
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSave)}
            className="flex flex-wrap items-center gap-6"
          >
            <FormField
              control={form.control}
              name="queue_paused"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="flex items-center gap-1.5">
                    <PauseCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    Fila pausada
                  </FormLabel>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="require_approval"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
                    Exigir aprovação
                  </FormLabel>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="max_sheets_per_batch"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormLabel>Máx folhas / envio</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      className="w-20"
                      {...field}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="ml-auto flex gap-2">
              <Button type="submit" disabled={saving}>
                <Save className="h-4 w-4" />
                Salvar
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
