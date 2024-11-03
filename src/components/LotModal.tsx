"use client";

import { LotStatusBadge } from "@/components/LotStatusBadge";
import { ScrapWithFiles } from "@/db/schema";
import {
  useRequestAnalysisMutation,
  useScrapDetails,
  useUpdateScrapMutation,
  useUpdateScraperMutation,
} from "@/hooks";
import { computePotentialProfit } from "@/models/scraps/helpers";
import { UseMutateFunction } from "@tanstack/react-query";
import {
  Button,
  Card,
  Carousel,
  Label,
  Modal,
  Progress,
  TextInput,
  Tooltip,
} from "flowbite-react";
import { useEffect, useState } from "react";
import {
  BarChart,
  Check,
  CheckSquare,
  Edit3,
  ExternalLink,
  FileText,
  RotateCcw,
  RotateCw,
  ThumbsDown,
  ThumbsUp,
  X,
} from "react-feather";

interface Props {
  scrapID: number;
  showModal: boolean;
  setShowModal: (show: boolean) => void;
}

function AnalysisCard({ scrap }: { scrap: ScrapWithFiles }) {
  const { isPending, mutate: requestAnalysisMutation } =
    useRequestAnalysisMutation(scrap.id);
  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Análise do Lote</h2>
        {scrap.analysis_result_json && (
          <Button
            color="gray"
            size="sm"
            onClick={() => requestAnalysisMutation()}
            disabled={isPending}
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        )}
      </div>
      {(isPending || !scrap.analysis_result_json) && (
        <div className="flex flex-col items-center justify-center p-6">
          <BarChart className="w-16 h-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            {isPending ? "Solicitando análise..." : "Análise não realizada"}
          </h3>
          {!isPending && (
            <>
              <p className="text-gray-600 text-center mb-4">
                Solicite uma análise detalhada para obter informações cruciais
                sobre este lote.
              </p>
              <Button
                color="dark"
                onClick={() => requestAnalysisMutation()}
                className="flex items-center gap-2"
                disabled={isPending}
              >
                <BarChart className="w-5 h-5" />
                Solicitar Análise
              </Button>
            </>
          )}
        </div>
      )}
      {!isPending && scrap.analysis_result_json && (
        <>
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="w-1/2 mb-8">
              <h3 className="text-xl font-bold mb-4">Dados do Imóvel</h3>
              <p className="text-sm text-gray-600">
                <strong>Tipo de Imóvel:</strong>{" "}
                {scrap.analysis_result_json.analysis_result.tipo_imovel}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Tamanho do Imóvel:</strong>{" "}
                {scrap.analysis_result_json.analysis_result.tamanho_imovel_m2}{" "}
                m²
              </p>
              <p className="text-sm text-gray-600">
                <strong>Área construída:</strong>{" "}
                {scrap.analysis_result_json.analysis_result.area_construida_m2}{" "}
                m²
              </p>
              <p className="text-sm text-gray-600">
                <strong>Endereço:</strong>{" "}
                {scrap.analysis_result_json.analysis_result.endereco.rua},{" "}
                {scrap.analysis_result_json.analysis_result.endereco.numero},{" "}
                {scrap.analysis_result_json.analysis_result.endereco.bairro},{" "}
                {scrap.analysis_result_json.analysis_result.endereco.cidade},{" "}
                {scrap.analysis_result_json.analysis_result.endereco.estado},{" "}
                {scrap.analysis_result_json.analysis_result.endereco.cep}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Vaga de Garagem:</strong>{" "}
                {scrap.analysis_result_json.analysis_result.vaga_garagem}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Modalidade de Propriedade:</strong>{" "}
                {
                  scrap.analysis_result_json.analysis_result
                    .modalidade_propriedade
                }
              </p>
              <p className="text-sm text-gray-600">
                <strong>Condição Geral:</strong>{" "}
                {scrap.analysis_result_json.analysis_result.condicao_geral}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Tipo de Reforma:</strong>{" "}
                {scrap.analysis_result_json.analysis_result.tipo_reforma}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Imóvel Ocupado:</strong>{" "}
                {scrap.analysis_result_json.analysis_result.imovel_ocupado}
              </p>
            </div>

            <div className="w-1/2 mb-8">
              <h3 className="text-xl font-bold mb-4">
                Informações do Processo
              </h3>
              <p className="text-sm text-gray-600">
                <strong>Divida de IPTU:</strong> R${" "}
                {scrap.analysis_result_json.analysis_result.divida_iptu.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Divida de Condomínio:</strong> R${" "}
                {scrap.analysis_result_json.analysis_result.divida_condominio.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Ocupação Usucapião:</strong>{" "}
                {scrap.analysis_result_json.analysis_result.ocupacao_usucapiao}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Usufrutuários:</strong>{" "}
                {scrap.analysis_result_json.analysis_result.usufrutuarios}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Penhoras:</strong>{" "}
                <ul>
                  {scrap.analysis_result_json.analysis_result.penhoras.map(
                    (penhora) => (
                      <li
                        key={penhora.descricao_penhora}
                        className="list-disc list-inside"
                      >
                        <div className="inline-block">
                          <Tooltip
                            id={penhora.descricao_penhora}
                            content={
                              <div>
                                <em>{penhora.trecho_documento}</em> -{" "}
                                {penhora.documento_mencionado}
                              </div>
                            }
                            className="inline-block ml-2 cursor-help"
                          >
                            {penhora.descricao_penhora}
                          </Tooltip>
                        </div>
                      </li>
                    ),
                  )}
                </ul>
              </p>
              {scrap.analysis_result_json.analysis_result.risco_arrematacao && (
                <p className="text-sm text-gray-600">
                  <strong>Risco de Arrematação:</strong>{" "}
                  {
                    scrap.analysis_result_json.analysis_result.risco_arrematacao
                      .risco
                  }{" "}
                  <em>
                    (
                    {
                      scrap.analysis_result_json.analysis_result
                        .risco_arrematacao.justificativa
                    }
                    )
                  </em>
                </p>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-600">
            <strong>Texto da Análise:</strong>
            <br />
            <pre className="whitespace-pre-wrap">
              {scrap.analysis_result_text}
            </pre>
          </p>
        </>
      )}
    </Card>
  );
}

function DescriptionCard({
  scrap,
  mutate,
}: {
  scrap: ScrapWithFiles;
  mutate: UseMutateFunction<void, Error, ScrapWithFiles, unknown>;
}) {
  const isPastDate = (date: Date | null) => {
    if (!date) return false;
    return date < new Date();
  };
  const { isPending, mutate: refreshScrapsMutation } = useUpdateScraperMutation(
    scrap.scraper_id,
  );

  return (
    <Card>
      <h2 className="text-2xl font-bold mb-4">Descrição do Lote</h2>
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-2/3">
          <div className="mb-4">
            <dt className="font-semibold">Endereço:</dt>
            <dd>{scrap.address || "N/A"}</dd>
          </div>
          <div className="flex flex-col items-center mb-6">
            <p className="font-normal text-gray-700 dark:text-gray-400">
              <strong>Descrição:</strong>{" "}
              {scrap.description || "Não disponível"}
            </p>
          </div>
        </div>
        <div className="w-px bg-gray-200 dark:bg-gray-700 self-stretch hidden lg:block"></div>
        <div className="lg:w-1/3">
          <dl className="space-y-2">
            <div>
              <dt className="font-semibold">Avaliação:</dt>
              <dd>R$ {scrap.appraisal?.toLocaleString()}</dd>
            </div>
            <div>
              <dt className="font-semibold">Lance Atual:</dt>
              <dd className="text-2xl font-bold text-green-600">
                R$ {scrap.bid?.toLocaleString() || "N/A"}
              </dd>
            </div>
            <div>
              <dt className="font-semibold">1º Leilão:</dt>
              <dd
                className={
                  isPastDate(scrap.first_auction_date) ? "line-through" : ""
                }
              >
                {scrap.first_auction_date
                  ? `${new Date(scrap.first_auction_date).toLocaleString()} - R$ ${scrap.first_auction_bid?.toLocaleString()}`
                  : "Não definido"}
              </dd>
            </div>
            <div>
              <dt className="font-semibold">2º Leilão:</dt>
              <dd
                className={
                  isPastDate(scrap.second_auction_date) ? "line-through" : ""
                }
              >
                {scrap.second_auction_date
                  ? `${new Date(scrap.second_auction_date).toLocaleString()} - R$ ${scrap.second_auction_bid?.toLocaleString()}`
                  : "Não definido"}
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Status:</dt>
              <dd>
                <LotStatusBadge scrap={scrap} />
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Última Atualização:</dt>
              <dd className="flex items-center gap-2">
                {new Date(scrap.updated_at).toLocaleString()}{" "}
                <RotateCw
                  className={`w-4 h-4 cursor-pointer ${
                    isPending ? "animate-spin" : ""
                  }`}
                  onClick={() =>
                    !isPending &&
                    refreshScrapsMutation({
                      scrapID: scrap.scraper_id,
                      url: scrap.url,
                      id: scrap.id,
                    })
                  }
                />
              </dd>
            </div>
          </dl>
          <div className="mt-6">
            <div className="pb-2">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  color={scrap.is_interesting === 1 ? "dark" : "light"}
                  className="flex items-center justify-center gap-2"
                  onClick={() => {
                    mutate({
                      ...scrap,
                      is_interesting: scrap.is_interesting === 1 ? null : 1,
                    });
                  }}
                >
                  <ThumbsUp className="w-4 h-4 mr-1" />
                  Interessante
                </Button>
                <Button
                  color={scrap.is_interesting === 0 ? "dark" : "light"}
                  className="flex items-center justify-center gap-2"
                  onClick={() => {
                    mutate({
                      ...scrap,
                      is_interesting: scrap.is_interesting === 0 ? null : 0,
                    });
                  }}
                >
                  <ThumbsDown className="w-4 h-4 mr-1" />
                  Não interessante
                </Button>
              </div>
            </div>
            <div className="pb-2">
              <Button
                color="light"
                className="flex items-center justify-center gap-2"
                href={scrap.url}
                target="_blank"
              >
                <ExternalLink className="w-4 h-4" />
                Site do Leilão
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {scrap.edital_link && (
                <Button
                  color="light"
                  className="flex items-center justify-center gap-2"
                  href={scrap.edital_link}
                  target="_blank"
                >
                  <FileText className="w-4 h-4" />
                  Edital
                </Button>
              )}
              {scrap.matricula_link && (
                <Button
                  color="light"
                  className="flex items-center justify-center gap-2"
                  href={scrap.matricula_link}
                  target="_blank"
                >
                  <FileText className="w-4 h-4" />
                  Matrícula
                </Button>
              )}
              {scrap.laudo_link && (
                <Button
                  color="light"
                  className="flex items-center justify-center gap-2"
                  href={scrap.laudo_link}
                  target="_blank"
                >
                  <CheckSquare className="w-4 h-4" />
                  Laudo
                </Button>
              )}
              {scrap.case_link && (
                <Button
                  color="light"
                  className="flex items-center justify-center gap-2"
                  href={scrap.case_link}
                  target="_blank"
                >
                  <FileText className="w-4 h-4" />
                  Processo
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function PotentialProfitCard({
  scrap,
  mutate,
}: {
  scrap: ScrapWithFiles;
  mutate: UseMutateFunction<void, Error, ScrapWithFiles, unknown>;
}) {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [valorArrematacao, setValorArrematacao] = useState<number>(
    scrap.valor_arrematacao,
  );
  const [valorVenda, setValorVenda] = useState<number>(scrap.valor_venda);
  const {
    total_custo_arrematacao_percentual,
    total_custo_pos_imissao_percentual,
    total_custo_pos_arrematacao_percentual,
    total_custo_pos_venda_percentual,
    lucro_percentual,
    total_custo_arrematacao,
    total_custo_pos_imissao,
    total_custo_pos_arrematacao,
    total_custo_pos_venda,
    lucro,
    total_custo_sem_imposto_venda,
  } = computePotentialProfit({
    ...scrap,
    valor_arrematacao: valorArrematacao,
    valor_venda: valorVenda,
  });
  const mutateWithPotentialProfit = (scrap: ScrapWithFiles) => {
    mutate({
      ...scrap,
      lucro: lucro,
      lucro_percentual: lucro_percentual,
      potential_profit_status: "overridden",
    });
  };
  return (
    <Card>
      <h2 className="text-2xl font-bold mb-4">Potencial de Lucro</h2>
      <div>
        <div className="mb-6">
          <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-blue-500 cursor-pointer"
              style={{ width: `${total_custo_arrematacao_percentual}%` }}
              onClick={() =>
                setActiveSection(
                  activeSection === "custoArrematacao"
                    ? null
                    : "custoArrematacao",
                )
              }
              title={`R$ ${total_custo_arrematacao.toFixed(2)}`}
            ></div>
            <div
              className="h-full bg-green-500 cursor-pointer"
              style={{ width: `${total_custo_pos_imissao_percentual}%` }}
              onClick={() =>
                setActiveSection(
                  activeSection === "extraPosImissao"
                    ? null
                    : "extraPosImissao",
                )
              }
              title={`R$ ${total_custo_pos_imissao.toFixed(2)}`}
            ></div>
            <div
              className="h-full bg-yellow-500 cursor-pointer"
              style={{ width: `${total_custo_pos_arrematacao_percentual}%` }}
              onClick={() =>
                setActiveSection(
                  activeSection === "custoPosArrematacao"
                    ? null
                    : "custoPosArrematacao",
                )
              }
              title={`R$ ${total_custo_pos_arrematacao.toFixed(2)}`}
            ></div>
            <div
              className="h-full bg-red-500 cursor-pointer"
              style={{ width: `${total_custo_pos_venda_percentual}%` }}
              onClick={() =>
                setActiveSection(
                  activeSection === "posVenda" ? null : "posVenda",
                )
              }
              title={`R$ ${total_custo_pos_venda.toFixed(2)}`}
            ></div>
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <div
              className="flex items-center cursor-pointer"
              onClick={() =>
                setActiveSection(
                  activeSection === "custoArrematacao"
                    ? null
                    : "custoArrematacao",
                )
              }
            >
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span>Custos de Arrematação</span>
            </div>
            <div
              className="flex items-center cursor-pointer"
              onClick={() =>
                setActiveSection(
                  activeSection === "extraPosImissao"
                    ? null
                    : "extraPosImissao",
                )
              }
            >
              <div className="w-3 h-3 bg-green-500 rounded-full  mr-2"></div>
              <span>Custos Pós Imissão</span>
            </div>
            <div
              className="flex items-center cursor-pointer"
              onClick={() =>
                setActiveSection(
                  activeSection === "custoPosArrematacao"
                    ? null
                    : "custoPosArrematacao",
                )
              }
            >
              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
              <span>Custos Pós Arrematação</span>
            </div>
            <div
              className="flex items-center cursor-pointer"
              onClick={() =>
                setActiveSection(
                  activeSection === "posVenda" ? null : "posVenda",
                )
              }
            >
              <div className="w-3 h-3 bg-red-500 rounded-full  mr-2"></div>
              <span>Custos Pós Venda</span>
            </div>
          </div>
        </div>

        <div className="grid  grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-gray-100 rounded-lg">
            <h4 className="font-semibold mb-2">Valor da Arrematação</h4>
            <div className="flex items-center">
              {editingField === "valorArremate" ? (
                <div className="flex items-center">
                  <TextInput
                    type="number"
                    value={valorArrematacao?.toString() || ""}
                    onChange={(e) => {
                      setValorArrematacao(Number(e.currentTarget.value));
                    }}
                    addon={"R$"}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === "Tab") {
                        mutateWithPotentialProfit({
                          ...scrap,
                          valor_arrematacao: Number(valorArrematacao),
                        });
                        setEditingField(null);
                      }
                    }}
                    step={1000}
                  />
                  <Check
                    className="w-4 h-4 text-green-500 cursor-pointer ml-2"
                    onClick={() => {
                      mutateWithPotentialProfit({
                        ...scrap,
                        valor_arrematacao: Number(valorArrematacao),
                      });
                      setEditingField(null);
                    }}
                  />
                  <X
                    className="w-4 h-4 text-red-500 cursor-pointer ml-2"
                    onClick={() => {
                      setValorArrematacao(scrap.valor_arrematacao);
                      setEditingField(null);
                    }}
                  />
                  <RotateCcw
                    className="w-4 h-4 text-blue-500 cursor-pointer ml-2"
                    onClick={() =>
                      setValorArrematacao(scrap.bid || scrap.valor_arrematacao)
                    }
                  />
                </div>
              ) : (
                <>
                  <p className="text-2xl font-bold mr-2">
                    R$ {valorArrematacao.toLocaleString()}
                  </p>
                  <Edit3
                    className="w-4 h-4 text-gray-500 cursor-pointer"
                    onClick={() => setEditingField("valorArremate")}
                  />
                </>
              )}
            </div>
          </div>
          <div className="p-4 bg-gray-100 rounded-lg">
            <h4 className="font-semibold mb-2">Valor da Venda</h4>
            <div className="flex items-center">
              {editingField === "valorVenda" ? (
                <div className="flex items-center">
                  <input
                    type="number"
                    value={valorVenda?.toString() || ""}
                    onChange={(e) => {
                      setValorVenda(Number(e.currentTarget.value));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === "Tab") {
                        mutateWithPotentialProfit({
                          ...scrap,
                          valor_venda: valorVenda,
                        });
                        setEditingField(null);
                      }
                    }}
                    className="block w-full rounded-md border-0 py-1.5 pl-2 pr-8 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    step={1000}
                  />
                  <Check
                    className="w-4 h-4 text-green-500 cursor-pointer ml-2"
                    onClick={() => {
                      mutateWithPotentialProfit({
                        ...scrap,
                        valor_venda: valorVenda,
                      });
                      setEditingField(null);
                    }}
                  />
                  <X
                    className="w-4 h-4 text-red-500 cursor-pointer ml-2"
                    onClick={() => {
                      setValorVenda(scrap.valor_venda);
                      setEditingField(null);
                    }}
                  />
                  <RotateCcw
                    className="w-4 h-4 text-blue-500 cursor-pointer ml-2"
                    onClick={() =>
                      setValorVenda(scrap.appraisal || scrap.valor_venda)
                    }
                  />
                </div>
              ) : (
                <>
                  <p className="text-2xl font-bold mr-2">
                    R$ {valorVenda.toLocaleString()}
                  </p>
                  <Edit3
                    className="w-4 h-4 text-gray-500 cursor-pointer"
                    onClick={() => setEditingField("valorVenda")}
                  />
                </>
              )}
            </div>
          </div>
          <div className="p-4 bg-gray-100 rounded-lg">
            <h4 className="font-semibold mb-2">Lucro</h4>
            <div className="flex justify-between items-center">
              <p className="text-2xl font-bold">
                {lucro_percentual.toFixed(2)}%
              </p>
              <p
                className={`text-2xl font-semibold ${
                  lucro_percentual > 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                R$ {lucro.toLocaleString()}
              </p>
            </div>
            <Progress
              progress={lucro_percentual}
              color={lucro_percentual > 0 ? "green" : "red"}
              size="sm"
              className="mt-2"
            />
          </div>
        </div>

        {activeSection === "custoArrematacao" && (
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-4">
              Custos de Arrematação (R${" "}
              {total_custo_arrematacao.toLocaleString()})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="w-2/4">
                <Label htmlFor="comissaoLeiloeiro" className="mb-2 block">
                  Comissão do Leiloeiro
                </Label>
                <div className="flex items-center">
                  <TextInput
                    id="comissaoLeiloeiro"
                    type="number"
                    className="w-1/2"
                    value={
                      scrap.custo_arrematacao_comissao_leiloeiro_percentual *
                      100
                    }
                    onChange={(e) =>
                      mutateWithPotentialProfit({
                        ...scrap,
                        custo_arrematacao_comissao_leiloeiro_percentual:
                          Number(e.currentTarget.value) / 100,
                      })
                    }
                    addon="%"
                    step={1}
                  />
                  <p className="ml-2 text-gray-600">
                    R${" "}
                    {(
                      scrap.custo_arrematacao_comissao_leiloeiro_percentual *
                      valorArrematacao
                    ).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="w-2/4">
                <Label htmlFor="itbi" className="mb-2 block">
                  ITBI
                </Label>
                <div className="flex items-center">
                  <TextInput
                    id="itbi"
                    type="number"
                    className="w-1/2"
                    value={scrap.custo_arrematacao_itbi_percentual * 100}
                    onChange={(e) =>
                      mutateWithPotentialProfit({
                        ...scrap,
                        custo_arrematacao_itbi_percentual:
                          Number(e.currentTarget.value) / 100,
                      })
                    }
                    addon="%"
                    step={1}
                  />
                  <p className="ml-2 text-gray-600">
                    R${" "}
                    {(
                      scrap.custo_arrematacao_itbi_percentual * valorArrematacao
                    ).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="w-2/4">
                <Label htmlFor="registro" className="mb-2 block">
                  Registro
                </Label>
                <div className="flex items-center">
                  <TextInput
                    id="registro"
                    type="number"
                    className="w-full"
                    value={scrap.custo_arrematacao_registro}
                    onChange={(e) =>
                      mutateWithPotentialProfit({
                        ...scrap,
                        custo_arrematacao_registro: Number(
                          e.currentTarget.value,
                        ),
                      })
                    }
                    addon="R$"
                    step={500}
                  />
                </div>
              </div>
              <div className="w-2/4">
                <Label htmlFor="advogado" className="mb-2 block">
                  Valor do Advogado
                </Label>
                <div className="flex items-center">
                  <TextInput
                    id="advogado"
                    type="number"
                    className="w-full"
                    value={scrap.custo_arrematacao_advogado}
                    onChange={(e) =>
                      mutateWithPotentialProfit({
                        ...scrap,
                        custo_arrematacao_advogado: Number(
                          e.currentTarget.value,
                        ),
                      })
                    }
                    addon="R$"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === "extraPosImissao" && (
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-4">
              Custos Pós Imissão (R$ {total_custo_pos_imissao.toLocaleString()})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="w-2/4">
                <Label htmlFor="reforma" className="mb-2 block">
                  Reforma
                </Label>
                <div className="flex items-center">
                  <TextInput
                    id="advogado"
                    type="number"
                    className="w-full"
                    value={scrap.custo_pos_imissao_reforma}
                    onChange={(e) =>
                      mutateWithPotentialProfit({
                        ...scrap,
                        custo_pos_imissao_reforma: Number(
                          e.currentTarget.value,
                        ),
                      })
                    }
                    addon="R$"
                    step={500}
                  />
                </div>
              </div>
              <div className="w-2/4">
                <Label htmlFor="outros" className="mb-2 block">
                  Outros
                </Label>
                <div className="flex items-center">
                  <TextInput
                    id="outros"
                    type="number"
                    className="w-full"
                    value={scrap.custo_pos_imissao_outros}
                    onChange={(e) =>
                      mutateWithPotentialProfit({
                        ...scrap,
                        custo_pos_imissao_outros: Number(e.currentTarget.value),
                      })
                    }
                    addon="R$"
                    step={500}
                  />
                </div>
              </div>
              <div className="w-2/4">
                <Label htmlFor="iptu" className="mb-2 block">
                  IPTU
                </Label>
                <div className="flex items-center">
                  <TextInput
                    id="iptu"
                    type="number"
                    className="w-full"
                    value={scrap.custo_pos_imissao_divida_iptu}
                    onChange={(e) =>
                      mutateWithPotentialProfit({
                        ...scrap,
                        custo_pos_imissao_divida_iptu: Number(
                          e.currentTarget.value,
                        ),
                      })
                    }
                    addon="R$"
                    step={500}
                  />
                </div>
              </div>
              <div className="w-2/4">
                <Label htmlFor="condominio" className="mb-2 block">
                  Condomínio
                </Label>
                <div className="flex items-center">
                  <TextInput
                    id="condominio"
                    type="number"
                    className="w-full"
                    value={scrap.custo_pos_imissao_divida_condominio}
                    onChange={(e) =>
                      mutateWithPotentialProfit({
                        ...scrap,
                        custo_pos_imissao_divida_condominio: Number(
                          e.currentTarget.value,
                        ),
                      })
                    }
                    addon="R$"
                    step={500}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === "custoPosArrematacao" && (
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-4">
              Custos Pós Arrematação (R${" "}
              {total_custo_pos_arrematacao.toLocaleString()})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="prazoVenda" className="mb-2 block">
                  Prazo da Venda (em meses)
                </Label>
                <TextInput
                  id="prazoVenda"
                  type="number"
                  value={scrap.custo_pos_arrematacao_prazo_de_venda_em_meses}
                  onChange={(e) =>
                    mutateWithPotentialProfit({
                      ...scrap,
                      custo_pos_arrematacao_prazo_de_venda_em_meses: Number(
                        e.currentTarget.value,
                      ),
                    })
                  }
                  step={1}
                />
              </div>
              <div>
                <Label htmlFor="iptuMensal" className="mb-2 block">
                  IPTU Mensal
                </Label>
                <TextInput
                  id="iptuMensal"
                  type="number"
                  value={scrap.custo_pos_arrematacao_valor_iptu_mensal}
                  onChange={(e) =>
                    mutateWithPotentialProfit({
                      ...scrap,
                      custo_pos_arrematacao_valor_iptu_mensal: Number(
                        e.currentTarget.value,
                      ),
                    })
                  }
                  step={500}
                />
              </div>
              <div>
                <Label htmlFor="condominionMensal" className="mb-2 block">
                  Condomínio Mensal
                </Label>
                <TextInput
                  id="condominionMensal"
                  type="number"
                  value={scrap.custo_pos_arrematacao_valor_condominio_mensal}
                  onChange={(e) =>
                    mutateWithPotentialProfit({
                      ...scrap,
                      custo_pos_arrematacao_valor_condominio_mensal: Number(
                        e.currentTarget.value,
                      ),
                    })
                  }
                  step={500}
                />
              </div>
            </div>
          </div>
        )}

        {activeSection === "posVenda" && (
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-4">
              Custos Pós Venda (R$ {total_custo_pos_venda.toLocaleString()})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="w-2/4">
                <Label htmlFor="comissaoCorretora" className="mb-2 block">
                  Comissão da Corretora
                </Label>
                <div className="flex items-center">
                  <TextInput
                    id="comissaoCorretora"
                    type="number"
                    className="w-1/2"
                    value={
                      scrap.custo_pos_venda_comissao_corretora_percentual * 100
                    }
                    onChange={(e) =>
                      mutateWithPotentialProfit({
                        ...scrap,
                        custo_pos_venda_comissao_corretora_percentual:
                          Number(e.currentTarget.value) / 100,
                      })
                    }
                    addon="%"
                    step={1}
                  />
                  <p className="ml-2 text-gray-600">
                    R${" "}
                    {(
                      scrap.custo_pos_venda_comissao_corretora_percentual *
                      valorVenda
                    ).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="w-2/4">
                <Label htmlFor="imposto" className="mb-2 block">
                  Imposto de Ganho de Capital
                </Label>
                <div className="flex items-center">
                  <TextInput
                    id="imposto"
                    type="number"
                    className="w-1/2"
                    value={
                      scrap.custo_pos_venda_imposto_ganho_capita_percentual *
                      100
                    }
                    onChange={(e) =>
                      mutateWithPotentialProfit({
                        ...scrap,
                        custo_pos_venda_imposto_ganho_capita_percentual:
                          Number(e.currentTarget.value) / 100,
                      })
                    }
                    addon="%"
                    step={1}
                  />
                  <p className="ml-2 text-gray-600">
                    R${" "}
                    {(
                      scrap.custo_pos_venda_imposto_ganho_capita_percentual *
                      total_custo_sem_imposto_venda
                    ).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

export function LotModal({ scrapID, showModal, setShowModal }: Props) {
  const { data: scrap, isLoading } = useScrapDetails(scrapID);
  const { mutate } = useUpdateScrapMutation();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowModal(false);
      }
    };

    if (showModal) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showModal, setShowModal]);

  return (
    <Modal show={showModal} onClose={() => setShowModal(false)} size="7xl">
      {scrap && <Modal.Header>{scrap.name}</Modal.Header>}
      <Modal.Body>
        {isLoading && <p>Carregando...</p>}
        {scrap && (
          <div className="space-y-4">
            <div className="h-56 sm:h-64 xl:h-80 2xl:h-96 mb-4 bg-gray-950 rounded-lg overflow-hidden">
              <Carousel className="h-full">
                {scrap.files
                  .filter((file) => file.file_type === "jpg")
                  .map((image) => (
                    <div
                      key={image.id}
                      className="flex items-center justify-center h-full"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image.url}
                        alt={`Imagem ${image.id}`}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  ))}
              </Carousel>
            </div>
            <DescriptionCard scrap={scrap} mutate={mutate} />
            <PotentialProfitCard scrap={scrap} mutate={mutate} />
            <AnalysisCard scrap={scrap} />
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
}
