import { Checkbox } from "@/components/ui/checkbox";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Scrap } from "@/db/schema";
import { StatusVerificado } from "@/features/auction/scrap/components/EditarLote/StatusVerificado";
import {
  formatNumber,
  normalizeEmptyObject,
} from "@/features/auction/scrap/components/EditarLote/lib/helpers";
import deepEqual from "deep-equal";
import { useFormContext } from "react-hook-form";
import { z } from "zod";

export function CampoDebitoExequendo() {
  const form = useFormContext<z.infer<typeof CampoDebitoExequendo.schema>>();
  const temDebitoExequendo = !!form.watch("analise_debito_exequendo");
  const fields = (
    <>
      <FormField
        control={form.control}
        name="analise_debito_exequendo.debito_exequendo"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Valor do débito exequendo</FormLabel>
            <FormControl>
              <Input
                {...field}
                className="w-15"
                type="number"
                step={0.01}
                value={field.value || ""}
                onChange={(e) => field.onChange(formatNumber(e.target.value))}
              />
            </FormControl>
            <FormDescription></FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="analise_debito_exequendo.despesa_condominio"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked)}
              />
            </FormControl>
            <FormLabel>Despesa condominial</FormLabel>
            <FormDescription></FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="analise_debito_exequendo.justificativa"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Justificativa</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                value={field.value || ""}
                onChange={(e) => field.onChange(e.target.value)}
                className="field-sizing-content"
              />
            </FormControl>
            <FormDescription></FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
  return (
    <>
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-bold">Débito Exequendo</h1>
        <StatusVerificado
          campo="analise_debito_exequendo"
          campoVerificacao="analise_debito_exequendo_verificada"
        />
      </div>
      <Switch
        checked={temDebitoExequendo}
        onCheckedChange={(checked) => {
          if (!checked) {
            form.setValue("analise_debito_exequendo", null, {
              shouldDirty: true,
            });
          } else {
            form.setValue(
              "analise_debito_exequendo",
              {
                debito_exequendo: 0,
                despesa_condominio: false,
                justificativa: "",
              },
              { shouldDirty: true },
            );
          }
        }}
      />
      {temDebitoExequendo && fields}
    </>
  );
}

CampoDebitoExequendo.schema = z.object({
  analise_debito_exequendo: z
    .object({
      debito_exequendo: z.number(),
      despesa_condominio: z.boolean(),
      justificativa: z.string(),
    })
    .nullable(),
  analise_debito_exequendo_verificada: z.boolean(),
});

CampoDebitoExequendo.defaultValues = (scrap: Scrap) => ({
  analise_debito_exequendo: normalizeEmptyObject(
    scrap.analise_debito_exequendo,
  ),
  analise_debito_exequendo_verificada:
    !!scrap.analise_debito_exequendo_verificada,
});

CampoDebitoExequendo.reduce = (
  scrap: Scrap,
  form: z.infer<typeof CampoDebitoExequendo.schema>,
) => {
  const analise_debito_exequendo = normalizeEmptyObject(
    form.analise_debito_exequendo,
  );
  return {
    analise_debito_exequendo,
    analise_debito_exequendo_verificada:
      form.analise_debito_exequendo_verificada ||
      !deepEqual(analise_debito_exequendo, scrap.analise_debito_exequendo)
        ? 1
        : 0,
  };
};
