import { toast } from "@/components/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { type Formulario } from "@/features/auction/scrap/components/EditarLote/lib/schema";
import { CheckCheck } from "lucide-react";
import { useFormContext } from "react-hook-form";

export function StatusVerificado({
  campo,
  campoVerificacao,
}: {
  campo: keyof Formulario;
  campoVerificacao: keyof Formulario;
}) {
  const form = useFormContext<Formulario>();
  const alterado = form.getFieldState(campo).isDirty;
  const valorCampoVerificacao = form.watch(campoVerificacao) as boolean;
  const verificado = alterado || valorCampoVerificacao;

  const messagemVerificado =
    "Este campo foi verificado pelo usuário e permanecerá inalterado em futuras análises.";
  const messagemNaoVerificado =
    "Este campo ainda não foi verificado pelo usuário e pode ser alterado em futuras análises.";

  let color, message;
  switch (verificado) {
    case true:
      color = "green";
      message = messagemVerificado;
      break;
    case false:
      color = "gray";
      message = messagemNaoVerificado;
      break;
  }

  const mudarVerificacao = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (alterado) {
      return;
    }
    switch (valorCampoVerificacao) {
      case false:
        form.setValue(campoVerificacao, true);
        toast({
          title: "Campo marcado como verificado!",
          description: messagemVerificado,
        });
        break;
      case true:
        form.setValue(campoVerificacao, false);
        toast({
          title: "Campo marcado como não verificado!",
          description: messagemNaoVerificado,
        });
        break;
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild onClick={mudarVerificacao}>
          <div>
            <CheckCheck
              className={`text-${color}-500 h-4 w-4 cursor-pointer`}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent className="w-60">{message}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
