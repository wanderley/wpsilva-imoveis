import { toast } from "@/components/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type Scrap } from "@/db/schema/scrap";
import Chat from "@/features/auction/scrap/components/Chat";
import { DescricaoAnalise } from "@/features/auction/scrap/components/DescricaoAnalise";
import { CampoAlienacaoFiduciaria } from "@/features/auction/scrap/components/EditarLote/CampoAlienacaoFiduciaria";
import { CampoDebitoExequendo } from "@/features/auction/scrap/components/EditarLote/CampoDebitoExequendo";
import { CampoHipoteca } from "@/features/auction/scrap/components/EditarLote/CampoHipoteca";
import { CampoPorcentagemTitularidade } from "@/features/auction/scrap/components/EditarLote/CampoPorcentagemTitularidade";
import { CampoTipoDireito } from "@/features/auction/scrap/components/EditarLote/CampoTipoDireito";
import { CampoTipoImovel } from "@/features/auction/scrap/components/EditarLote/CampoTipoImovel";
import { LoteImagens } from "@/features/auction/scrap/components/LotCarousel";
import { useScrapDetails, useUpdateScrapMutation } from "@/hooks";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ReactNode, useMemo } from "react";
import { useForm } from "react-hook-form";
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
        <Card className="col-span-2 flex flex-col lg:h-[calc(100vh-100px)] overflow-hidden">
          <CardHeader className="flex-none">
            <CardTitle>Revisão dos dados</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow min-h-0">
            <Formulario scrap={data} />
          </CardContent>
        </Card>
        <Card className="col-span-3 flex flex-col lg:h-[calc(100vh-100px)]">
          <CardHeader className="flex-none">
            <CardTitle>Informações do lote</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow min-h-0">
            <Informacoes scrap={data} />
          </CardContent>
        </Card>
      </div>
      <Chat scrapId={data.id} />
    </>
  );
}

export type Formulario = z.infer<typeof SchemaFormulario>;
export const SchemaFormulario = z.object({
  ...CampoTipoDireito.schema.shape,
  ...CampoTipoImovel.schema.shape,
  ...CampoPorcentagemTitularidade.schema.shape,
  ...CampoHipoteca.schema.shape,
  ...CampoAlienacaoFiduciaria.schema.shape,
  ...CampoDebitoExequendo.schema.shape,
});

function Formulario({ scrap }: { scrap: Scrap }) {
  const { mutate } = useUpdateScrapMutation();
  const form = useForm<Formulario>({
    resolver: zodResolver(SchemaFormulario),
    defaultValues: {
      ...CampoTipoDireito.defaultValues(scrap),
      ...CampoTipoImovel.defaultValues(scrap),
      ...CampoPorcentagemTitularidade.defaultValues(scrap),
      ...CampoHipoteca.defaultValues(scrap),
      ...CampoAlienacaoFiduciaria.defaultValues(scrap),
      ...CampoDebitoExequendo.defaultValues(scrap),
    },
  });

  function onSubmit(data: Formulario) {
    mutate(
      {
        id: scrap.id,
        ...CampoTipoDireito.reduce(scrap, data),
        ...CampoTipoImovel.reduce(scrap, data),
        ...CampoPorcentagemTitularidade.reduce(scrap, data),
        ...CampoHipoteca.reduce(scrap, data),
        ...CampoAlienacaoFiduciaria.reduce(scrap, data),
        ...CampoDebitoExequendo.reduce(scrap, data),
      },
      { onSuccess: (_) => toast({ title: "Dados atualizados com sucesso!" }) },
    );
  }

  const formValues = form.watch();
  const progress = useMemo(() => {
    if (!formValues) return 0;

    const verificationFields = Object.entries(formValues).filter(([key]) =>
      key.includes("_verificada"),
    );

    const total = verificationFields.length;
    const verified = verificationFields.filter(
      ([, value]) => value === true,
    ).length;

    return total > 0 ? Math.round((verified / total) * 100) : 0;
  }, [formValues]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="h-full w-full space-y-6"
      >
        <div className="flex flex-col h-full">
          <div
            className="flex-grow overflow-auto pb-4 pr-2 grid grid-cols-1 gap-4"
            style={{
              scrollbarColor: "hsl(0 0% 87% / 1) white",
              scrollbarWidth: "thin",
            }}
          >
            <CampoTipoImovel />
            <CampoTipoDireito />
            <CampoPorcentagemTitularidade />
            <CampoHipoteca />
            <CampoAlienacaoFiduciaria />
            <CampoDebitoExequendo />
          </div>
          <div className="flex-none grid grid-cols-1 gap-4">
            <div className="h-1" />
            <div className="flex items-center gap-2">
              <Button type="submit">Salvar</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset()}
              >
                Restaurar
              </Button>
              <Button className="ml-auto" type="button" variant="ghost">
                <ArrowLeft />
                <Link href={`/lot/${scrap.id}`}>Voltar para o lote</Link>
              </Button>
            </div>
            <Progress
              className="mb-4"
              value={progress}
              title="Progresso da revisão"
            />
          </div>
        </div>
      </form>
    </Form>
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
        <TabsContent key="edital" value="edital" className="flex-grow">
          <iframe
            src={
              scrap.edital_file
                ? `/api/file/${scrap.edital_file}`
                : scrap.edital_link
            }
            className="w-full h-full"
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
        <TabsContent key="matricula" value="matricula" className="flex-grow">
          <iframe
            src={
              scrap.matricula_file
                ? `/api/file/${scrap.matricula_file}`
                : scrap.matricula_link
            }
            className="w-full h-full"
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
        <TabsContent key="laudo" value="laudo" className="flex-grow">
          <iframe
            src={
              scrap.laudo_file
                ? `/api/file/${scrap.laudo_file}`
                : scrap.laudo_link
            }
            className="w-full h-full"
          />
        </TabsContent>
      ),
    });
  }

  return (
    <Tabs defaultValue="descricao" className="flex flex-col h-full w-full">
      <TabsList className="w-full flex-none">
        <TabsTrigger value="descricao">Descrição do lote</TabsTrigger>
        {documentos.map(({ trigger }) => trigger)}
      </TabsList>
      <TabsContent value="descricao" className="flex-grow overflow-auto">
        <DescricaoAnalise scrap={scrap} />
      </TabsContent>
      {documentos.map(({ content }) => content)}
    </Tabs>
  );
}
