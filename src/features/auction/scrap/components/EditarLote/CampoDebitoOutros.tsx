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
import { Scrap } from "@/db/schema";
import { StatusVerificado } from "@/features/auction/scrap/components/EditarLote/StatusVerificado";
import {
  formatNumber,
  normalizeEmptyObject,
} from "@/features/auction/scrap/components/EditarLote/lib/helpers";
import deepEqual from "deep-equal";
import { useFormContext } from "react-hook-form";
import { z } from "zod";

export function CampoDebitoOutros() {
  const form = useFormContext<z.infer<typeof CampoDebitoOutros.schema>>();
  const temDebitoOutros = !!form.watch("analise_debito_outros");
  const fields = (
    <div className="grid grid-cols-2 gap-2">
      <FormField
        control={form.control}
        name={`analise_debito_outros.iptu`}
        render={({ field }) => (
          <FormItem className="col-span-1">
            <FormLabel>IPTU</FormLabel>
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
        name={`analise_debito_outros.divida_ativa`}
        render={({ field }) => (
          <FormItem className="col-span-1">
            <FormLabel>Dívida Ativa</FormLabel>
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
        name={`analise_debito_outros.condominio`}
        render={({ field }) => (
          <FormItem className="col-span-1">
            <FormLabel>Condomínio</FormLabel>
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
        name={`analise_debito_outros.outros`}
        render={({ field }) => (
          <FormItem className="col-span-1">
            <FormLabel>Outros</FormLabel>
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
    </div>
  );

  return (
    <>
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-bold">Outros débitos</h1>
        <StatusVerificado
          campo="analise_debito_outros"
          campoVerificacao="analise_debito_outros_verificada"
        />
      </div>
      <Switch
        checked={temDebitoOutros}
        onCheckedChange={(checked) => {
          if (!checked) {
            form.setValue("analise_debito_outros", null, {
              shouldDirty: true,
            });
          } else {
            form.setValue(
              "analise_debito_outros",
              {
                iptu: 0,
                divida_ativa: 0,
                condominio: 0,
                outros: 0,
              },
              { shouldDirty: true },
            );
          }
        }}
      />
      {temDebitoOutros && fields}
    </>
  );
}

CampoDebitoOutros.schema = z.object({
  analise_debito_outros: z
    .object({
      iptu: z.number(),
      divida_ativa: z.number(),
      condominio: z.number(),
      outros: z.number(),
    })
    .nullable(),
  analise_debito_outros_verificada: z.boolean(),
});

CampoDebitoOutros.defaultValues = (scrap: Scrap) => ({
  analise_debito_outros: scrap.analise_debito_outros,
  analise_debito_outros_verificada: !!scrap.analise_debito_outros_verificada,
});

CampoDebitoOutros.reduce = (
  scrap: Scrap,
  form: z.infer<typeof CampoDebitoOutros.schema>,
) => {
  return {
    analise_debito_outros: normalizeEmptyObject(form.analise_debito_outros)
      ? form.analise_debito_outros
      : null,
    analise_debito_outros_verificada:
      form.analise_debito_outros_verificada ||
      !deepEqual(
        normalizeEmptyObject(form.analise_debito_outros),
        normalizeEmptyObject(scrap.analise_debito_outros),
      )
        ? 1
        : 0,
  };
};
