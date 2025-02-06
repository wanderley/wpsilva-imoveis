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

export function CampoHipoteca() {
  const form = useFormContext<z.infer<typeof CampoHipoteca.schema>>();
  const temHipoteca = !!form.watch("analise_hipoteca");
  const fields = (
    <>
      <FormField
        control={form.control}
        name="analise_hipoteca.credor"
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
          name="analise_hipoteca.data_constituicao"
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
          name="analise_hipoteca.valor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor da hipoteca</FormLabel>
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
        name="analise_hipoteca.ativo"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked)}
              />
            </FormControl>
            <FormLabel>Hipoteca em vigor</FormLabel>
            <FormDescription></FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="analise_hipoteca.justificativa"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Justificativa</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                value={field.value || ""}
                className="field-sizing-content"
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
        <h1 className="text-lg font-bold">Hipoteca</h1>
        <StatusVerificado
          campo="analise_hipoteca"
          campoVerificacao="analise_hipoteca_verificada"
        />
      </div>
      <Switch
        checked={temHipoteca}
        onCheckedChange={(checked) => {
          if (!checked) {
            form.setValue("analise_hipoteca", null, { shouldDirty: true });
          } else {
            form.setValue(
              "analise_hipoteca",
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
      {temHipoteca && fields}
    </>
  );
}

CampoHipoteca.schema = z.object({
  analise_hipoteca: z
    .object({
      data_constituicao: z.string().nullable(),
      credor: z.string(),
      valor: z.number().nullable(),
      ativo: z.boolean(),
      justificativa: z.string(),
    })
    .nullable(),
  analise_hipoteca_verificada: z.boolean(),
});

CampoHipoteca.defaultValues = (scrap: Scrap) => ({
  analise_hipoteca: normalizeEmptyObject(scrap.analise_hipoteca),
  analise_hipoteca_verificada: !!scrap.analise_hipoteca_verificada,
});

CampoHipoteca.reduce = (
  scrap: Scrap,
  form: z.infer<typeof CampoHipoteca.schema>,
) => {
  const analise_hipoteca = normalizeEmptyObject(form.analise_hipoteca);
  return {
    analise_hipoteca,
    analise_hipoteca_verificada:
      form.analise_hipoteca_verificada ||
      !deepEqual(analise_hipoteca, scrap.analise_hipoteca)
        ? 1
        : 0,
  };
};
