import { toast } from "@/components/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { type Scrap } from "@/db/schema";
import Chat from "@/features/auction/scrap/components/Chat";
import { DescricaoAnalise } from "@/features/auction/scrap/components/DescricaoAnalise";
import { LoteImagens } from "@/features/auction/scrap/components/LotCarousel";
import { useScrapDetails, useUpdateScrapMutation } from "@/hooks";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CheckCheck } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";
import { useForm, useFormContext } from "react-hook-form";
import { z } from "zod";

export function EditarLote({ scrapId }: { scrapId: number }) {
  const { data, isLoading } = useScrapDetails(scrapId);
  if (isLoading || !data) {
    return <div>Carregando...</div>;
  }
  return (
    <>
      <div className="h-56 sm:h-64 xl:h-80 2xl:h-96 mb-4 bg-gray-950 rounded-lg overflow-hidden">
        <LoteImagens scrap={data} className="w-full" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Revisão dos dados</CardTitle>
          </CardHeader>
          <CardContent>
            <Formulario scrap={data} />
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Informações do lote</CardTitle>
          </CardHeader>
          <CardContent>
            <Informacoes scrap={data} />
          </CardContent>
        </Card>
      </div>
      <Chat scrapId={data.id} />
    </>
  );
}

const Schema = z.object({
  analise_tipo_direito: z.enum([
    "Propriedade plena",
    "Nua-propriedade",
    "Direitos fiduciários",
    "Direitos possessórios",
    "Direitos do compromissário comprador",
  ]),
  analise_tipo_direito_verificada: z.boolean(),
  analise_tipo_imovel: z.enum([
    "Casa",
    "Apartamento",
    "Terreno",
    "Vaga de garagem",
    "Imóvel comercial",
  ]),
  analise_tipo_imovel_verificada: z.boolean(),
});

function Formulario({ scrap }: { scrap: Scrap }) {
  const { mutate } = useUpdateScrapMutation();
  const form = useForm<z.infer<typeof Schema>>({
    resolver: zodResolver(Schema),
    defaultValues: {
      analise_tipo_direito: scrap.analise_tipo_direito ?? undefined,
      analise_tipo_direito_verificada: !!scrap.analise_tipo_direito_verificada,
      analise_tipo_imovel: scrap.analise_tipo_imovel ?? undefined,
      analise_tipo_imovel_verificada: !!scrap.analise_tipo_imovel_verificada,
    },
  });

  function onSubmit(data: z.infer<typeof Schema>) {
    data.analise_tipo_direito_verificada =
      data.analise_tipo_direito_verificada ||
      data.analise_tipo_direito !== scrap.analise_tipo_direito;
    data.analise_tipo_imovel_verificada =
      data.analise_tipo_imovel_verificada ||
      data.analise_tipo_imovel !== scrap.analise_tipo_imovel;
    mutate(
      {
        id: scrap.id,
        analise_tipo_direito: data.analise_tipo_direito,
        analise_tipo_direito_verificada: data.analise_tipo_direito_verificada
          ? 1
          : 0,
        analise_tipo_imovel: data.analise_tipo_imovel,
        analise_tipo_imovel_verificada: data.analise_tipo_imovel_verificada
          ? 1
          : 0,
      },
      { onSuccess: (_) => toast({ title: "Dados atualizados com sucesso!" }) },
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6">
        <CampoTipoDireito />
        <CampoTipoImovel />
        <div className="flex items-center gap-2">
          <Button type="submit">Salvar</Button>
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Restaurar
          </Button>
          <Button className="ml-auto" type="button" variant="ghost">
            <ArrowLeft />
            <Link href={`/lot/${scrap.id}`}>Voltar para o lote</Link>
          </Button>
        </div>
      </form>
    </Form>
  );
}

function CampoTipoDireito() {
  const form = useFormContext<z.infer<typeof Schema>>();
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

function CampoTipoImovel() {
  const form = useFormContext<z.infer<typeof Schema>>();
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

function StatusVerificado({
  campo,
  campoVerificacao,
}: {
  campo: keyof z.infer<typeof Schema>;
  campoVerificacao: keyof z.infer<typeof Schema>;
}) {
  const form = useFormContext<z.infer<typeof Schema>>();
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

function Informacoes({ scrap }: { scrap: Scrap }) {
  const documentos: {
    trigger: ReactNode;
    content: ReactNode;
  }[] = [];

  if (scrap.edital_link) {
    documentos.push({
      trigger: (
        <TabsTrigger key="edital" value="edital">
          Edital
        </TabsTrigger>
      ),
      content: (
        <TabsContent key="edital" value="edital" className="w-full h-full">
          <iframe
            src={
              scrap.edital_file
                ? `/api/file/${scrap.edital_file}`
                : scrap.edital_link
            }
            className="w-full h-full min-h-[600px]"
          />
        </TabsContent>
      ),
    });
  }

  if (scrap.matricula_link) {
    documentos.push({
      trigger: (
        <TabsTrigger key="matricula" value="matricula">
          Matrícula
        </TabsTrigger>
      ),
      content: (
        <TabsContent key="matricula" value="matricula">
          <iframe
            src={
              scrap.matricula_file
                ? `/api/file/${scrap.matricula_file}`
                : scrap.matricula_link
            }
            className="w-full h-full min-h-[600px]"
          />
        </TabsContent>
      ),
    });
  }

  if (scrap.laudo_link) {
    documentos.push({
      trigger: (
        <TabsTrigger key="laudo" value="laudo">
          Laudo
        </TabsTrigger>
      ),
      content: (
        <TabsContent key="laudo" value="laudo">
          <iframe
            src={
              scrap.laudo_file
                ? `/api/file/${scrap.laudo_file}`
                : scrap.laudo_link
            }
            className="w-full h-full min-h-[600px]"
          />
        </TabsContent>
      ),
    });
  }

  return (
    <Tabs defaultValue="descricao" className="w-full">
      <TabsList className="w-full">
        <TabsTrigger value="descricao">Descrição do lote</TabsTrigger>
        {documentos.map(({ trigger }) => trigger)}
      </TabsList>
      <TabsContent value="descricao" className="max-h-[600px] overflow-y-auto">
        <DescricaoAnalise scrap={scrap} />
      </TabsContent>
      {documentos.map(({ content }) => content)}
    </Tabs>
  );
}
