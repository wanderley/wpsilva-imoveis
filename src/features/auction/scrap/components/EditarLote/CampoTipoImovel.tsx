import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type Scrap } from "@/db/schema/scrap";
import { StatusVerificado } from "@/features/auction/scrap/components/EditarLote/StatusVerificado";
import { useFormContext } from "react-hook-form";
import { z } from "zod";

export function CampoTipoImovel() {
  const form = useFormContext<z.infer<typeof CampoTipoImovel.schema>>();
  return (
    <FormField
      control={form.control}
      name="analise_tipo_imovel"
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            <div className="flex items-center gap-2">
              <span>Tipo de imóvel</span>
              <StatusVerificado
                campo="analise_tipo_imovel"
                campoVerificacao="analise_tipo_imovel_verificada"
              />
            </div>
          </FormLabel>
          <Select onValueChange={field.onChange} value={field.value as string}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de imóvel" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="Casa">Casa</SelectItem>
              <SelectItem value="Apartamento">Apartamento</SelectItem>
              <SelectItem value="Terreno">Terreno</SelectItem>
              <SelectItem value="Vaga de garagem">Vaga de garagem</SelectItem>
              <SelectItem value="Imóvel comercial">Imóvel comercial</SelectItem>
            </SelectContent>
          </Select>
          <FormDescription>
            Escolha a opção que melhor descreve o tipo de imóvel.
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

CampoTipoImovel.schema = z.object({
  analise_tipo_imovel: z.enum([
    "Casa",
    "Apartamento",
    "Terreno",
    "Vaga de garagem",
    "Imóvel comercial",
  ]),
  analise_tipo_imovel_verificada: z.boolean(),
});

CampoTipoImovel.defaultValues = (scrap: Scrap) => ({
  analise_tipo_imovel: scrap.analise_tipo_imovel ?? undefined,
  analise_tipo_imovel_verificada: !!scrap.analise_tipo_imovel_verificada,
});

CampoTipoImovel.reduce = (
  scrap: Scrap,
  form: z.infer<typeof CampoTipoImovel.schema>,
) => ({
  analise_tipo_imovel: form.analise_tipo_imovel,
  analise_tipo_imovel_verificada:
    form.analise_tipo_imovel_verificada ||
    form.analise_tipo_imovel !== scrap.analise_tipo_imovel
      ? 1
      : 0,
});
