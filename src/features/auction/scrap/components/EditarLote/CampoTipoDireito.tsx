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

export function CampoTipoDireito() {
  const form = useFormContext<z.infer<typeof CampoTipoDireito.schema>>();
  return (
    <FormField
      control={form.control}
      name="analise_tipo_direito"
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            <div className="flex items-center gap-2">
              <span>Tipo de direito</span>
              <StatusVerificado
                campo="analise_tipo_direito"
                campoVerificacao="analise_tipo_direito_verificada"
              />
            </div>
          </FormLabel>
          <Select onValueChange={field.onChange} value={field.value as string}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de direito" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="Propriedade plena">
                Propriedade plena
              </SelectItem>
              <SelectItem value="Nua-propriedade">Nua-propriedade</SelectItem>
              <SelectItem value="Direitos fiduciários">
                Direitos fiduciários
              </SelectItem>
              <SelectItem value="Direitos possessórios">
                Direitos possessórios
              </SelectItem>
              <SelectItem value="Direitos do compromissário comprador">
                Direitos do compromissário comprador
              </SelectItem>
            </SelectContent>
          </Select>
          <FormDescription>
            Escolha a opção que melhor descreve o tipo de direito.
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

CampoTipoDireito.schema = z.object({
  analise_tipo_direito: z.enum([
    "Propriedade plena",
    "Nua-propriedade",
    "Direitos fiduciários",
    "Direitos possessórios",
    "Direitos do compromissário comprador",
  ]),
  analise_tipo_direito_verificada: z.boolean(),
});

CampoTipoDireito.defaultValues = (scrap: Scrap) => ({
  analise_tipo_direito: scrap.analise_tipo_direito ?? undefined,
  analise_tipo_direito_verificada: !!scrap.analise_tipo_direito_verificada,
});

CampoTipoDireito.reduce = (
  scrap: Scrap,
  form: z.infer<typeof CampoTipoDireito.schema>,
) => ({
  analise_tipo_direito: form.analise_tipo_direito,
  analise_tipo_direito_verificada:
    form.analise_tipo_direito_verificada ||
    form.analise_tipo_direito !== scrap.analise_tipo_direito
      ? 1
      : 0,
});
