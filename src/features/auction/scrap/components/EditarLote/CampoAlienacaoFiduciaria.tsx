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
import { type Scrap } from "@/db/schema";
import { StatusVerificado } from "@/features/auction/scrap/components/EditarLote/StatusVerificado";
import {
  formatNumber,
  normalizeEmptyObject,
} from "@/features/auction/scrap/components/EditarLote/lib/helpers";
import deepEqual from "deep-equal";
import { useFormContext } from "react-hook-form";
import { z } from "zod";

export function CampoAlienacaoFiduciaria() {
  const form =
    useFormContext<z.infer<typeof CampoAlienacaoFiduciaria.schema>>();
  const temAlienacaoFiduciaria = !!form.watch("analise_alienacao_fiduciaria");
  const fields = (
    <>
      <FormField
        control={form.control}
        name="analise_alienacao_fiduciaria.credor"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Credor</FormLabel>
            <FormControl>
              <Input
                {...field}
                value={field.value || ""}
                onChange={(e) => field.onChange(e.target.value)}
              />
            </FormControl>
            <FormDescription></FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid grid-cols-2 gap-2">
        <FormField
          control={form.control}
          name="analise_alienacao_fiduciaria.data_constituicao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data de constituição</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className="w-15"
                  value={field.value || ""}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              </FormControl>
              <FormDescription></FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="analise_alienacao_fiduciaria.valor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor do Financiamento</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className="w-15"
                  type="number"
                  value={field.value || ""}
                  onChange={(e) => field.onChange(formatNumber(e.target.value))}
                />
              </FormControl>
              <FormDescription></FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name="analise_alienacao_fiduciaria.ativo"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked)}
              />
            </FormControl>
            <FormLabel>Financiamento em vigor</FormLabel>
            <FormDescription></FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="analise_alienacao_fiduciaria.justificativa"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Justificativa</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                value={field.value || ""}
                onChange={(e) => field.onChange(e.target.value)}
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
        <h1 className="text-lg font-bold">Alienação Fiduciária</h1>
        <StatusVerificado
          campo="analise_alienacao_fiduciaria"
          campoVerificacao="analise_alienacao_fiduciaria_verificada"
        />
      </div>
      <Switch
        checked={temAlienacaoFiduciaria}
        onCheckedChange={(checked) => {
          if (!checked) {
            form.setValue("analise_alienacao_fiduciaria", null, {
              shouldDirty: true,
            });
          } else {
            form.setValue(
              "analise_alienacao_fiduciaria",
              {
                data_constituicao: null,
                credor: "",
                valor: null,
                ativo: false,
                justificativa: "",
              },
              { shouldDirty: true },
            );
          }
        }}
      />
      {temAlienacaoFiduciaria && fields}
    </>
  );
}

CampoAlienacaoFiduciaria.schema = z.object({
  analise_alienacao_fiduciaria: z
    .object({
      data_constituicao: z.string().nullable(),
      credor: z.string(),
      valor: z.number().nullable(),
      ativo: z.boolean(),
      justificativa: z.string(),
    })
    .nullable(),
  analise_alienacao_fiduciaria_verificada: z.boolean(),
});

CampoAlienacaoFiduciaria.defaultValues = (scrap: Scrap) => ({
  analise_alienacao_fiduciaria: normalizeEmptyObject(
    scrap.analise_alienacao_fiduciaria,
  ),
  analise_alienacao_fiduciaria_verificada:
    !!scrap.analise_alienacao_fiduciaria_verificada,
});

CampoAlienacaoFiduciaria.reduce = (
  scrap: Scrap,
  form: z.infer<typeof CampoAlienacaoFiduciaria.schema>,
) => {
  const analise_alienacao_fiduciaria = normalizeEmptyObject(
    form.analise_alienacao_fiduciaria,
  );
  return {
    analise_alienacao_fiduciaria,
    analise_alienacao_fiduciaria_verificada:
      form.analise_alienacao_fiduciaria_verificada ||
      !deepEqual(
        analise_alienacao_fiduciaria,
        scrap.analise_alienacao_fiduciaria,
      )
        ? 1
        : 0,
  };
};
