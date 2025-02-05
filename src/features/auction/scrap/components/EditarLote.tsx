import { toast } from "@/components/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
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
import { ReactNode, useMemo } from "react";
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
  analise_porcentagem_titularidade: z.number().min(0).max(10000),
  analise_porcentagem_titularidade_verificada: z.boolean(),
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
  analise_alienacao_fiduciaria: z
    .object({
      data_constituicao: z.string().nullable(),
      credor: z.string(),
      valor: z.number().nullable(),
      ativo: z.boolean(),
      justificativa: z.string(),
    })
    .nullable(),
  analise_alienacao_fiduciaria_verificada: z.boolean(),
  analise_debito_exequendo: z
    .object({
      debito_exequendo: z.number(),
      despesa_condominio: z.boolean(),
      justificativa: z.string(),
    })
    .nullable(),
  analise_debito_exequendo_verificada: z.boolean(),
});

function Formulario({ scrap }: { scrap: Scrap }) {
  function normalizeEmptyObject<T extends Record<string, unknown>>(
    obj: T | null | undefined,
  ) {
    if (obj == null) {
      return null;
    }
    return Object.values(obj).some((value) => value !== undefined) ? obj : null;
  }

  const { mutate } = useUpdateScrapMutation();
  const form = useForm<z.infer<typeof Schema>>({
    resolver: zodResolver(Schema),
    defaultValues: {
      analise_tipo_direito: scrap.analise_tipo_direito ?? undefined,
      analise_tipo_direito_verificada: !!scrap.analise_tipo_direito_verificada,
      analise_tipo_imovel: scrap.analise_tipo_imovel ?? undefined,
      analise_tipo_imovel_verificada: !!scrap.analise_tipo_imovel_verificada,
      analise_porcentagem_titularidade:
        scrap.analise_porcentagem_titularidade ?? undefined,
      analise_porcentagem_titularidade_verificada:
        !!scrap.analise_porcentagem_titularidade_verificada,
      analise_hipoteca: normalizeEmptyObject(scrap.analise_hipoteca),
      analise_hipoteca_verificada: !!scrap.analise_hipoteca_verificada,
      analise_alienacao_fiduciaria: normalizeEmptyObject(
        scrap.analise_alienacao_fiduciaria,
      ),
      analise_alienacao_fiduciaria_verificada:
        !!scrap.analise_alienacao_fiduciaria_verificada,
      analise_debito_exequendo: normalizeEmptyObject(
        scrap.analise_debito_exequendo,
      ),
      analise_debito_exequendo_verificada:
        !!scrap.analise_debito_exequendo_verificada,
    },
  });

  function onSubmit(data: z.infer<typeof Schema>) {
    // normaliza os objetos nulos
    data.analise_alienacao_fiduciaria = normalizeEmptyObject(
      data.analise_alienacao_fiduciaria,
    );
    data.analise_hipoteca = normalizeEmptyObject(data.analise_hipoteca);
    data.analise_debito_exequendo = normalizeEmptyObject(
      data.analise_debito_exequendo,
    );
    // atualiza o status de verificação
    data.analise_tipo_direito_verificada =
      data.analise_tipo_direito_verificada ||
      data.analise_tipo_direito !== scrap.analise_tipo_direito;
    data.analise_tipo_imovel_verificada =
      data.analise_tipo_imovel_verificada ||
      data.analise_tipo_imovel !== scrap.analise_tipo_imovel;
    data.analise_porcentagem_titularidade_verificada =
      data.analise_porcentagem_titularidade_verificada ||
      data.analise_porcentagem_titularidade !==
        scrap.analise_porcentagem_titularidade;
    data.analise_hipoteca_verificada =
      data.analise_hipoteca_verificada ||
      data.analise_hipoteca !== scrap.analise_hipoteca;
    data.analise_alienacao_fiduciaria_verificada =
      data.analise_alienacao_fiduciaria_verificada ||
      data.analise_alienacao_fiduciaria !== scrap.analise_alienacao_fiduciaria;
    data.analise_debito_exequendo_verificada =
      data.analise_debito_exequendo_verificada ||
      data.analise_debito_exequendo !== scrap.analise_debito_exequendo;

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
        analise_porcentagem_titularidade: data.analise_porcentagem_titularidade,
        analise_porcentagem_titularidade_verificada:
          data.analise_porcentagem_titularidade_verificada ? 1 : 0,
        analise_hipoteca: data.analise_hipoteca,
        analise_hipoteca_verificada: data.analise_hipoteca_verificada ? 1 : 0,
        analise_alienacao_fiduciaria: data.analise_alienacao_fiduciaria,
        analise_alienacao_fiduciaria_verificada:
          data.analise_alienacao_fiduciaria_verificada ? 1 : 0,
        analise_debito_exequendo: data.analise_debito_exequendo,
        analise_debito_exequendo_verificada:
          data.analise_debito_exequendo_verificada ? 1 : 0,
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
          <div className="flex-grow overflow-auto pb-4 grid grid-cols-1 gap-4">
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

function CampoPorcentagemTitularidade() {
  const form = useFormContext<z.infer<typeof Schema>>();
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

function CampoHipoteca() {
  const form = useFormContext<z.infer<typeof Schema>>();
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

function CampoDebitoExequendo() {
  const form = useFormContext<z.infer<typeof Schema>>();
  const temDebitoExequendo = !!form.watch("analise_debito_exequendo");
  const fields = (
    <>
      <FormField
        control={form.control}
        name="analise_debito_exequendo.debito_exequendo"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Valor do débito exequendo</FormLabel>
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
        name="analise_debito_exequendo.despesa_condominio"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked)}
              />
            </FormControl>
            <FormLabel>Despesa condominial</FormLabel>
            <FormDescription></FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="analise_debito_exequendo.justificativa"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Justificativa</FormLabel>
            <FormControl>
              <Textarea
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
    </>
  );
  return (
    <>
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-bold">Débito Exequendo</h1>
        <StatusVerificado
          campo="analise_debito_exequendo"
          campoVerificacao="analise_debito_exequendo_verificada"
        />
      </div>
      <Switch
        checked={temDebitoExequendo}
        onCheckedChange={(checked) => {
          if (!checked) {
            form.setValue("analise_debito_exequendo", null, {
              shouldDirty: true,
            });
          } else {
            form.setValue(
              "analise_debito_exequendo",
              {
                debito_exequendo: 0,
                despesa_condominio: false,
                justificativa: "",
              },
              { shouldDirty: true },
            );
          }
        }}
      />
      {temDebitoExequendo && fields}
    </>
  );
}

function CampoAlienacaoFiduciaria() {
  const form = useFormContext<z.infer<typeof Schema>>();
  const temAlienacaoFiduciaria = !!form.watch("analise_alienacao_fiduciaria");
  const fields = (
    <>
      <FormField
        control={form.control}
        name="analise_alienacao_fiduciaria.credor"
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
      <FormField
        control={form.control}
        name="analise_alienacao_fiduciaria.data_constituicao"
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
        name="analise_alienacao_fiduciaria.valor"
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
      <FormField
        control={form.control}
        name="analise_alienacao_fiduciaria.ativo"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked)}
              />
            </FormControl>
            <FormLabel>Financiamento em vigor</FormLabel>
            <FormDescription></FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="analise_alienacao_fiduciaria.justificativa"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Justificativa</FormLabel>
            <FormControl>
              <Textarea
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
    </>
  );
  return (
    <>
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-bold">Alienação Fiduciária</h1>
        <StatusVerificado
          campo="analise_alienacao_fiduciaria"
          campoVerificacao="analise_alienacao_fiduciaria_verificada"
        />
      </div>
      <Switch
        checked={temAlienacaoFiduciaria}
        onCheckedChange={(checked) => {
          if (!checked) {
            form.setValue("analise_alienacao_fiduciaria", null, {
              shouldDirty: true,
            });
          } else {
            form.setValue(
              "analise_alienacao_fiduciaria",
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
      {temAlienacaoFiduciaria && fields}
    </>
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

function formatNumber(value: string) {
  return Number(Number(value).toFixed(2));
}
