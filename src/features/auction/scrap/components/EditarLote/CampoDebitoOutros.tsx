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
import { formatNumber } from "@/features/auction/scrap/components/EditarLote/lib/helpers";
import deepEqual from "deep-equal";
import { useFieldArray, useFormContext } from "react-hook-form";
import { z } from "zod";

export function CampoDebitoOutros() {
  const form = useFormContext<z.infer<typeof CampoDebitoOutros.schema>>();
  const analiseDebitoOutros = form.watch("analise_debito_outros");
  const temDebitoOutros =
    !!analiseDebitoOutros && analiseDebitoOutros.length > 0;
  const { fields: debitos } = useFieldArray({
    name: "analise_debito_outros",
  });
  const fields = debitos.map((debito, index) => (
    <div key={debito.id} className="grid grid-cols-4 gap-2">
      <FormField
        control={form.control}
        key={debito.id}
        name={`analise_debito_outros.${index}.tipo`}
        render={({ field }) => (
          <FormItem className="col-span-1">
            <FormLabel>Tipo</FormLabel>
            <FormControl>
              <p>{field.value}</p>
            </FormControl>
            <FormDescription></FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        key={debito.id}
        name={`analise_debito_outros.${index}.valor`}
        render={({ field }) => (
          <FormItem className="col-span-3">
            <FormLabel>Valor</FormLabel>
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
  ));

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
              [
                {
                  tipo: "IPTU",
                  valor: 0,
                },
                {
                  tipo: "Dívida Ativa",
                  valor: 0,
                },
                {
                  tipo: "Condomínio",
                  valor: 0,
                },
              ],
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
    .array(
      z.object({
        tipo: z.enum(["IPTU", "Dívida Ativa", "Condomínio", "Outros"]),
        valor: z.number(),
      }),
    )
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
  const debitos = form.analise_debito_outros?.filter(
    (debito) => debito.valor > 0,
  );
  return {
    analise_debito_outros: debitos?.length ? debitos : null,
    analise_debito_outros_verificada:
      form.analise_debito_outros_verificada ||
      !deepEqual(debitos || [], scrap.analise_debito_outros || [])
        ? 1
        : 0,
  };
};
