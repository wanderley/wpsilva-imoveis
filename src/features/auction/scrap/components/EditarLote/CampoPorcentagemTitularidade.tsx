import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { type Scrap } from "@/db/schema/scrap";
import { StatusVerificado } from "@/features/auction/scrap/components/EditarLote/StatusVerificado";
import { formatNumber } from "@/features/auction/scrap/components/EditarLote/lib/helpers";
import { useFormContext } from "react-hook-form";
import { z } from "zod";

export function CampoPorcentagemTitularidade() {
  const form =
    useFormContext<z.infer<typeof CampoPorcentagemTitularidade.schema>>();
  return (
    <FormField
      control={form.control}
      name="analise_porcentagem_titularidade"
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            <div className="flex items-center gap-2">
              <span>Porcentagem de titularidade</span>
              <StatusVerificado
                campo="analise_porcentagem_titularidade"
                campoVerificacao="analise_porcentagem_titularidade_verificada"
              />
            </div>
          </FormLabel>
          <FormControl>
            <div className="flex items-center gap-2">
              <Input
                {...field}
                className="w-15"
                type="number"
                step={0.01}
                value={field.value ? field.value / 100 : ""}
                onChange={(e) =>
                  field.onChange(
                    Math.max(0, Math.min(formatNumber(e.target.value), 100)) *
                      100,
                  )
                }
                min={0}
                max={100}
              />
              <span>%</span>
            </div>
          </FormControl>
          <FormDescription>
            100% significa que o lote é inteiramente titularidade do comprador.
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

CampoPorcentagemTitularidade.schema = z.object({
  analise_porcentagem_titularidade: z.number().min(0).max(10000),
  analise_porcentagem_titularidade_verificada: z.boolean(),
});

CampoPorcentagemTitularidade.defaultValues = (scrap: Scrap) => ({
  analise_porcentagem_titularidade:
    scrap.analise_porcentagem_titularidade ?? undefined,
  analise_porcentagem_titularidade_verificada:
    !!scrap.analise_porcentagem_titularidade_verificada,
});

CampoPorcentagemTitularidade.reduce = (
  scrap: Scrap,
  form: z.infer<typeof CampoPorcentagemTitularidade.schema>,
) => ({
  analise_porcentagem_titularidade: form.analise_porcentagem_titularidade,
  analise_porcentagem_titularidade_verificada:
    form.analise_porcentagem_titularidade_verificada ||
    form.analise_porcentagem_titularidade !==
      scrap.analise_porcentagem_titularidade
      ? 1
      : 0,
});
