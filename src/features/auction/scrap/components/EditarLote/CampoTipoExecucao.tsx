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
import { tipoExecucaoEnum } from "@/services/scraper/analises/consts";
import { useFormContext } from "react-hook-form";
import { z } from "zod";

export function CampoTipoExecucao() {
  const form = useFormContext<z.infer<typeof CampoTipoExecucao.schema>>();
  return (
    <FormField
      control={form.control}
      name="analise_tipo_execucao"
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            <div className="flex items-center gap-2">
              <span>Tipo de execução</span>
              <StatusVerificado
                campo="analise_tipo_execucao"
                campoVerificacao="analise_tipo_execucao_verificada"
              />
            </div>
          </FormLabel>
          <Select onValueChange={field.onChange} value={field.value as string}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de execução" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {tipoExecucaoEnum.map((tipo) => (
                <SelectItem key={tipo} value={tipo}>
                  {tipo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormDescription>
            Escolha a opção que melhor descreve o tipo de execução.
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

CampoTipoExecucao.schema = z.object({
  analise_tipo_execucao: z.enum(tipoExecucaoEnum),
  analise_tipo_execucao_verificada: z.boolean(),
});

CampoTipoExecucao.defaultValues = (scrap: Scrap) => ({
  analise_tipo_execucao: scrap.analise_tipo_execucao ?? undefined,
  analise_tipo_execucao_verificada: !!scrap.analise_tipo_execucao_verificada,
});

CampoTipoExecucao.reduce = (
  scrap: Scrap,
  form: z.infer<typeof CampoTipoExecucao.schema>,
) => ({
  analise_tipo_execucao: form.analise_tipo_execucao,
  analise_tipo_execucao_verificada:
    form.analise_tipo_execucao_verificada ||
    form.analise_tipo_execucao !== scrap.analise_tipo_execucao
      ? 1
      : 0,
});
