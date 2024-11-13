"use client";

import { LotStatusBadge } from "@/components/LotStatusBadge";
import { selectOptionBasedOnProfitBand } from "@/components/lib/scraps";
import { Badge } from "@/components/ui/badge";
import { Button as UIButton } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Scrap, ScrapProfit } from "@/db/schema";
import {
  useFetchScrapFromSourceMutation,
  useRequestAnalysisMutation,
  useScrapDetails,
  useUpdateScrapMutation,
  useUpdateScrapProfitMutation,
} from "@/hooks";
import {
  computeProfit,
  getPreferredAuctionDate,
} from "@/models/scraps/helpers";
import { Schema } from "@/services/analyser/schema";
import { UseMutateFunction } from "@tanstack/react-query";
import {
  Button,
  Card,
  Carousel,
  Label,
  Progress,
  TextInput,
} from "flowbite-react";
import {
  AlertTriangle,
  Banknote,
  BarChart,
  Bath,
  Bed,
  Building,
  Car,
  Home,
  Info,
  Layers,
  RefreshCw,
  Scale,
  Sofa,
  StickyNote,
} from "lucide-react";
import { useState } from "react";
import {
  Check,
  CheckSquare,
  Edit3,
  ExternalLink,
  FileText,
  ThumbsDown,
  ThumbsUp,
  X,
} from "react-feather";

import { formatCurrency } from "./lib/currency";

const getConditionBadgeVariant = (
  condition: Schema["appraisal"]["general_condition"],
) => {
  switch (condition) {
    case "Ruim":
      return "destructive";
    case "Boa":
      return "warning";
    case "Ótima":
      return "success";
    case "Indeterminado":
      return "secondary";
  }
};

const getRiskBadgeVariant = (risk: Schema["risks"]["risk"]) => {
  switch (risk) {
    case "Alto":
      return "destructive";
    case "Médio":
      return "warning";
    case "Baixo":
      return "success";
  }
};

const getReformTypeBadgeVariant = (
  type: Schema["appraisal"]["type_of_reform"],
) => {
  switch (type) {
    case "Não precisa de reforma":
      return "success";
    case "Reforma simples":
      return "warning";
    case "Reforma pesada":
      return "destructive";
    case "Indeterminado":
      return "secondary";
  }
};

function Analysis({ scrap }: { scrap: Scrap }) {
  const { isPending, mutate: requestAnalysisMutation } =
    useRequestAnalysisMutation(scrap.id);

  const analysis = scrap.analyses.length > 0 ? scrap.analyses[0] : null;
  if (!analysis) {
    return null;
  }

  return (
    <div className="lg:w-2/3 grid grid-cols-1 gap-8">
      <section className="space-y-4">
        <Tabs defaultValue="analysis" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="analysis" className="flex-1">
              Resumo
            </TabsTrigger>
            <TabsTrigger value="auction" className="flex-1">
              Descrição do Leiloeiro
            </TabsTrigger>
          </TabsList>
          <TabsContent value="analysis">
            <p className="text-muted-foreground">
              {analysis.response.description}
            </p>
          </TabsContent>
          <TabsContent value="auction">
            <p className="text-muted-foreground">
              {scrap.description || "Não disponível"}
            </p>
          </TabsContent>
        </Tabs>
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" /> Avaliação e Riscos
          <button
            onClick={() => !isPending && requestAnalysisMutation()}
            className="p-2 rounded-full hover:bg-muted/50 transition-colors"
            aria-label="Atualizar dados"
          >
            <RefreshCw
              className={`w-4 h-4 cursor-pointer ${
                isPending ? "animate-spin" : ""
              }`}
            />
          </button>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 p-4 bg-muted rounded-lg">
          <div>
            <p className="font-medium">Avaliação de Riscos</p>
            <Badge
              className="text-base"
              variant={getRiskBadgeVariant(analysis.response.risks.risk)}
            >
              Risco {analysis.response.risks.risk}
            </Badge>
            <p className="mt-2 text-sm">
              {analysis.response.risks.justification}
            </p>
          </div>
          <div>
            <p className="font-medium">Status de Ocupação</p>
            <Badge
              className="text-base"
              variant={
                analysis.response.occupancy_status === "Ocupado"
                  ? "destructive"
                  : "success"
              }
            >
              {analysis.response.occupancy_status}
            </Badge>
          </div>
          <div>
            <p className="font-medium">Condição Geral</p>
            <Badge
              className="text-base"
              variant={getConditionBadgeVariant(
                analysis.response.appraisal.general_condition,
              )}
            >
              {analysis.response.appraisal.general_condition}
            </Badge>
          </div>
          <div>
            <p className="font-medium">Tipo de Reforma</p>
            <Badge
              className="text-base"
              variant={getReformTypeBadgeVariant(
                analysis.response.appraisal.type_of_reform,
              )}
            >
              {analysis.response.appraisal.type_of_reform}
            </Badge>
          </div>
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center">
          <Home className="w-5 h-5 mr-2" /> Informações Gerais
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold">Endereço</h3>
            <p>{analysis.response.address}</p>
          </div>
          <div>
            <h3 className="font-semibold">Áreas</h3>
            <div className="grid grid-cols-3 gap-4">
              {analysis.response.area.private !== undefined && (
                <div>
                  <p className="text-sm text-muted-foreground">Privativa</p>
                  <p className="font-medium">
                    {analysis.response.area.private} m²
                  </p>
                </div>
              )}
              {analysis.response.area.common !== undefined && (
                <div>
                  <p className="text-sm text-muted-foreground">Comum</p>
                  <p className="font-medium">
                    {analysis.response.area.common} m²
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="font-medium">{analysis.response.area.total} m²</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center">
          <Info className="w-5 h-5 mr-2" /> Detalhes do Imóvel
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {analysis.response.house_details.floors != null && (
            <div>
              <p className="text-sm text-muted-foreground flex items-center">
                <Layers className="w-4 h-4 mr-1" /> Andares
              </p>
              <p className="font-medium">
                {analysis.response.house_details.floors}
              </p>
            </div>
          )}
          {analysis.response.house_details.rooms.bedrooms != null && (
            <div>
              <p className="text-sm text-muted-foreground flex items-center">
                <Bed className="w-4 h-4 mr-1" /> Quartos
              </p>
              <p className="font-medium">
                {analysis.response.house_details.rooms.bedrooms}
              </p>
            </div>
          )}
          {analysis.response.house_details.rooms.bathrooms != null && (
            <div>
              <p className="text-sm text-muted-foreground flex items-center">
                <Bath className="w-4 h-4 mr-1" /> Banheiros
              </p>
              <p className="font-medium">
                {analysis.response.house_details.rooms.bathrooms}
              </p>
            </div>
          )}
          {analysis.response.house_details.rooms.living_rooms != null && (
            <div>
              <p className="text-sm text-muted-foreground flex items-center">
                <Sofa className="w-4 h-4 mr-1" /> Salas
              </p>
              <p className="font-medium">
                {analysis.response.house_details.rooms.living_rooms}
              </p>
            </div>
          )}
          {analysis.response.house_details.rooms.garages != null && (
            <div>
              <p className="text-sm text-muted-foreground flex items-center">
                <Car className="w-4 h-4 mr-1" /> Vagas
              </p>
              <p className="font-medium">
                {analysis.response.house_details.rooms.garages}
              </p>
            </div>
          )}
          {analysis.response.condominium_details && (
            <div>
              <p className="text-sm text-muted-foreground flex items-center">
                <Building className="w-4 h-4 mr-1" /> Condomínio
              </p>
              <p className="font-medium">
                {analysis.response.condominium_details.classification}
              </p>
            </div>
          )}
        </div>
        <div>
          <h3 className="font-semibold">Extras</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
            {analysis.response.house_details.extras.map((extra, index) => (
              <div key={index} className="flex items-center">
                <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full mr-2"></span>
                <span>{extra}</span>
              </div>
            ))}
          </div>
        </div>
        {analysis.response.condominium_details &&
          (analysis.response.condominium_details.amenities ?? []).length >
            0 && (
            <div>
              <h3 className="font-semibold mt-4">Detalhes do Condomínio</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                {analysis.response.condominium_details.amenities.map(
                  (amenity, index) => (
                    <div key={index} className="flex items-center">
                      <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full mr-2"></span>
                      <span className="text-sm">{amenity}</span>
                    </div>
                  ),
                )}
              </div>
            </div>
          )}
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center">
          <Scale className="w-5 h-5 mr-2" /> Informações Legais
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <div className="gap-1">
            <p>
              <span className="font-semibold">Tipo de Propriedade:</span>{" "}
              {analysis.response.legal.property_ownership_type}
            </p>
            {analysis.response.legal.registration_number && (
              <p>
                <span className="font-semibold">Matrícula:</span>{" "}
                {analysis.response.legal.registration_number}
              </p>
            )}
            {analysis.response.legal.registry_office && (
              <p>
                <span className="font-semibold">Cartório:</span>{" "}
                {analysis.response.legal.registry_office}
              </p>
            )}
            {analysis.response.legal.tax_id && (
              <p>
                <span className="font-semibold">Inscrição Fiscal:</span>{" "}
                {analysis.response.legal.tax_id}
              </p>
            )}
          </div>
          <div className="gap-1">
            <p>
              <span className="font-semibold">Leiloeiro:</span>{" "}
              {analysis.response.auction.auctioneer_name}
            </p>
            <p>
              <span className="font-semibold">Registro:</span>{" "}
              {analysis.response.auction.auctioneer_registration}
            </p>
            <p>
              <span className="font-semibold">Website:</span>{" "}
              <a
                href={analysis.response.auction.auctionner_website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {analysis.response.auction.auctionner_website}
              </a>
            </p>
          </div>
        </div>
        {analysis.response.legal.liens.length > 0 && (
          <div>
            <h3 className="font-semibold">Ônus</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              {analysis.response.legal.liens.map((lien, index) => (
                <Popover key={index}>
                  <PopoverTrigger asChild>
                    <div className="p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                      <p className="font-medium">{lien.type}</p>
                      <p className="text-sm text-muted-foreground">
                        {lien.details}
                      </p>
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <p className="text-sm">{lien.excerpt_document}</p>
                    <p className="text-sm text-right">
                      {lien.document_mentioned}
                    </p>
                  </PopoverContent>
                </Popover>
              ))}
            </div>
          </div>
        )}
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center">
          <Banknote className="w-5 h-5 mr-2" /> Informações Financeiras
        </h2>

        <div>
          <h3 className="font-semibold">Débitos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            {analysis.response.financial.specific_debts.IPTU && (
              <Popover>
                <PopoverTrigger asChild>
                  <div className="p-4 border rounded-lg w-full cursor-pointer hover:bg-muted/50">
                    <p className="font-medium">IPTU</p>
                    <p className="text-xl font-bold">
                      {formatCurrency(
                        analysis.response.financial.specific_debts.IPTU.value,
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Responsável:{" "}
                      {
                        analysis.response.financial.specific_debts.IPTU
                          .responsible
                      }
                    </p>
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <p className="text-sm">
                    {
                      analysis.response.financial.specific_debts.IPTU
                        .excerpt_document
                    }
                  </p>
                  <p className="text-sm text-right">
                    {
                      analysis.response.financial.specific_debts.IPTU
                        .document_mentioned
                    }
                  </p>
                </PopoverContent>
              </Popover>
            )}
            {analysis.response.financial.specific_debts.active_debt && (
              <Popover>
                <PopoverTrigger asChild>
                  <div className="p-4 border rounded-lg w-full cursor-pointer hover:bg-muted/50">
                    <p className="font-medium">Dívida Ativa</p>
                    <p className="text-xl font-bold">
                      {formatCurrency(
                        analysis.response.financial.specific_debts.active_debt
                          .value,
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Responsável:{" "}
                      {
                        analysis.response.financial.specific_debts.active_debt
                          .responsible
                      }
                    </p>
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <p className="text-sm">
                    {
                      analysis.response.financial.specific_debts.active_debt
                        .excerpt_document
                    }
                  </p>
                  <p className="text-sm text-right">
                    {
                      analysis.response.financial.specific_debts.active_debt
                        .document_mentioned
                    }
                  </p>
                </PopoverContent>
              </Popover>
            )}
            {analysis.response.financial.specific_debts.condominium && (
              <Popover>
                <PopoverTrigger asChild>
                  <div className="p-4 border rounded-lg w-full cursor-pointer hover:bg-muted/50">
                    <p className="font-medium">Condomínio</p>
                    <p className="text-xl font-bold">
                      {formatCurrency(
                        analysis.response.financial.specific_debts.condominium
                          .value,
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Responsável:{" "}
                      {
                        analysis.response.financial.specific_debts.condominium
                          .responsible
                      }
                    </p>
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <p className="text-sm">
                    {
                      analysis.response.financial.specific_debts.condominium
                        .excerpt_document
                    }
                  </p>
                  <p className="text-sm text-right">
                    {
                      analysis.response.financial.specific_debts.condominium
                        .document_mentioned
                    }
                  </p>
                </PopoverContent>
              </Popover>
            )}
            {analysis.response.financial.other_debts.length > 0 && (
              <div className="col-span-full">
                <h3 className="font-semibold mt-4 mb-2">Outros Débitos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysis.response.financial.other_debts.map(
                    (debt, index) => (
                      <Popover key={index}>
                        <PopoverTrigger asChild>
                          <div className="p-4 border rounded-lg w-full cursor-pointer hover:bg-muted/50">
                            <p className="font-medium">
                              Outro Débito {index + 1}
                            </p>
                            <p className="text-xl font-bold">
                              {formatCurrency(debt.value)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Responsável: {debt.responsible}
                            </p>
                          </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <p className="text-sm">{debt.excerpt_document}</p>
                          <p className="text-sm text-right">
                            {debt.document_mentioned}
                          </p>
                        </PopoverContent>
                      </Popover>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {analysis.response.notes && analysis.response.notes.length > 0 && (
        <>
          <Separator />
          <section className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center">
              <StickyNote className="w-5 h-5 mr-2" /> Observações
            </h2>
            <ul className="list-disc list-inside space-y-2">
              {analysis.response.notes.map((note, index) => (
                <li key={index} className="text-sm">
                  {note}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}

function OriginalDescription({ scrap }: { scrap: Scrap }) {
  const { isPending, mutate: requestAnalysisMutation } =
    useRequestAnalysisMutation(scrap.id);
  return (
    <div className="lg:w-2/3">
      <div className="mb-4">
        <dt className="font-semibold">Endereço:</dt>
        <dd>{scrap.address || "N/A"}</dd>
      </div>
      <div className="flex flex-col items-center mb-6">
        <p className="font-normal text-gray-700 dark:text-gray-400">
          <strong>Descrição:</strong> {scrap.description || "Não disponível"}
        </p>
      </div>
      {scrap.analyses.length === 0 && (
        <div className="mt-4">
          <UIButton
            onClick={() => requestAnalysisMutation()}
            className="w-full"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <BarChart className="w-4 h-4 mr-2" />
                Solicitar Análise
              </>
            )}
          </UIButton>
        </div>
      )}
    </div>
  );
}

function DescriptionCard({
  scrap,
  mutate,
}: {
  scrap: Scrap;
  mutate: UseMutateFunction<void, Error, Scrap, unknown>;
}) {
  const isPastDate = (date: Date | null) => {
    if (!date) {
      return false;
    }
    const preferredAuctionDate = getPreferredAuctionDate(scrap);
    if (preferredAuctionDate && date < preferredAuctionDate) {
      return true;
    }
    return date < new Date();
  };
  const { isPending, mutate: fetchScrapFromSource } =
    useFetchScrapFromSourceMutation(scrap.scraper_id);

  return (
    <Card>
      <h2 className="text-2xl font-bold mb-4">Descrição do Lote</h2>
      <div className="flex flex-col lg:flex-row gap-6">
        {scrap.analyses.length === 0 ? (
          <OriginalDescription scrap={scrap} />
        ) : (
          <Analysis scrap={scrap} />
        )}

        <div className="w-px bg-gray-200 dark:bg-gray-700 self-stretch hidden lg:block"></div>
        <div className="lg:w-1/3 lg:sticky lg:top-4 lg:h-fit">
          <dl className="space-y-2">
            <div>
              <dt className="font-semibold">Avaliação:</dt>
              <dd>{formatCurrency(scrap.appraisal)}</dd>
            </div>
            <div>
              <dt className="font-semibold">Lance Atual:</dt>
              <dd className="text-2xl font-bold text-green-600">
                {formatCurrency(scrap.bid)}
              </dd>
            </div>
            {scrap.profit && (
              <div>
                <dt className="font-semibold">
                  {selectOptionBasedOnProfitBand(scrap.profit, {
                    else: "Lucro Esperado:",
                    loss: "Prejuízo Esperado:",
                  })}
                </dt>
                <dd
                  className={selectOptionBasedOnProfitBand(scrap.profit, {
                    loss: "text-2xl font-bold text-red-600",
                    low_profit: "text-2xl font-bold text-gray-600",
                    moderate_profit: "text-2xl font-bold text-yellow-400",
                    high_profit: "text-2xl font-bold text-green-600",
                  })}
                >
                  {formatCurrency(Math.abs(scrap.profit.lucro))} (
                  {Math.abs(scrap.profit.lucro_percentual).toFixed(0)}%)
                </dd>
              </div>
            )}
            <div>
              <dt className="font-semibold">1º Leilão:</dt>
              <dd
                className={
                  isPastDate(scrap.first_auction_date) ? "line-through" : ""
                }
              >
                {scrap.first_auction_date
                  ? `${new Date(scrap.first_auction_date).toLocaleString()} - ${formatCurrency(scrap.first_auction_bid)}`
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
                  ? `${new Date(scrap.second_auction_date).toLocaleString()} - ${formatCurrency(scrap.second_auction_bid)}`
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
                <RefreshCw
                  className={`w-4 h-4 cursor-pointer ${
                    isPending ? "animate-spin" : ""
                  }`}
                  onClick={() =>
                    !isPending &&
                    fetchScrapFromSource({
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

function PotentialProfitEmptyCard() {
  return (
    <Card>
      <h2 className="text-2xl font-bold mb-4">Potencial de Lucro</h2>
      <div>
        <p>Não há dados suficientes para calcular o potencial de lucro.</p>
      </div>
    </Card>
  );
}

function PotentialProfitCard({ scrap }: { scrap: Scrap }) {
  const { mutate } = useUpdateScrapProfitMutation();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [valorArrematacao, setValorArrematacao] = useState<number>(
    scrap.profit?.valor_arrematacao || 0,
  );
  const [valorVenda, setValorVenda] = useState<number>(
    scrap.profit?.valor_venda || 0,
  );
  const profit = scrap.profit;
  if (profit == null) {
    return <PotentialProfitEmptyCard />;
  }
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
  } = computeProfit({
    ...profit,
    valor_arrematacao: valorArrematacao,
    valor_venda: valorVenda,
  });
  const mutateWithPotentialProfit = (profit: ScrapProfit) => {
    mutate({
      ...profit,
      lucro: lucro,
      lucro_percentual: lucro_percentual,
      status: "overridden",
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
              title={formatCurrency(total_custo_arrematacao)}
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
              title={formatCurrency(total_custo_pos_imissao)}
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
              title={formatCurrency(total_custo_pos_arrematacao)}
            ></div>
            <div
              className="h-full bg-red-500 cursor-pointer"
              style={{ width: `${total_custo_pos_venda_percentual}%` }}
              onClick={() =>
                setActiveSection(
                  activeSection === "posVenda" ? null : "posVenda",
                )
              }
              title={formatCurrency(total_custo_pos_venda)}
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
                          ...profit,
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
                        ...profit,
                        valor_arrematacao: Number(valorArrematacao),
                      });
                      setEditingField(null);
                    }}
                  />
                  <X
                    className="w-4 h-4 text-red-500 cursor-pointer ml-2"
                    onClick={() => {
                      setValorArrematacao(profit.valor_arrematacao);
                      setEditingField(null);
                    }}
                  />
                  <RefreshCw
                    className="w-4 h-4 text-blue-500 cursor-pointer ml-2"
                    onClick={() =>
                      setValorArrematacao(scrap.bid || profit.valor_arrematacao)
                    }
                  />
                </div>
              ) : (
                <>
                  <p className="text-2xl font-bold mr-2">
                    {formatCurrency(valorArrematacao)}
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
                          ...profit,
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
                        ...profit,
                        valor_venda: valorVenda,
                      });
                      setEditingField(null);
                    }}
                  />
                  <X
                    className="w-4 h-4 text-red-500 cursor-pointer ml-2"
                    onClick={() => {
                      setValorVenda(profit.valor_venda);
                      setEditingField(null);
                    }}
                  />
                  <RefreshCw
                    className="w-4 h-4 text-blue-500 cursor-pointer ml-2"
                    onClick={() =>
                      setValorVenda(scrap.appraisal || profit.valor_venda)
                    }
                  />
                </div>
              ) : (
                <>
                  <p className="text-2xl font-bold mr-2">
                    {formatCurrency(valorVenda)}
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
                {formatCurrency(lucro)}
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
              Custos de Arrematação ({formatCurrency(total_custo_arrematacao)})
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
                      profit.custo_arrematacao_comissao_leiloeiro_percentual *
                      100
                    }
                    onChange={(e) =>
                      mutateWithPotentialProfit({
                        ...profit,
                        custo_arrematacao_comissao_leiloeiro_percentual:
                          Number(e.currentTarget.value) / 100,
                      })
                    }
                    addon="%"
                    step={1}
                  />
                  <p className="ml-2 text-gray-600">
                    {formatCurrency(
                      profit.custo_arrematacao_comissao_leiloeiro_percentual *
                        valorArrematacao,
                    )}
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
                    value={profit.custo_arrematacao_itbi_percentual * 100}
                    onChange={(e) =>
                      mutateWithPotentialProfit({
                        ...profit,
                        custo_arrematacao_itbi_percentual:
                          Number(e.currentTarget.value) / 100,
                      })
                    }
                    addon="%"
                    step={1}
                  />
                  <p className="ml-2 text-gray-600">
                    {formatCurrency(
                      profit.custo_arrematacao_itbi_percentual *
                        valorArrematacao,
                    )}
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
                    value={profit.custo_arrematacao_registro}
                    onChange={(e) =>
                      mutateWithPotentialProfit({
                        ...profit,
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
                    value={profit.custo_arrematacao_advogado}
                    onChange={(e) =>
                      mutateWithPotentialProfit({
                        ...profit,
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
              Custos Pós Imissão ({formatCurrency(total_custo_pos_imissao)})
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
                    value={profit.custo_pos_imissao_reforma}
                    onChange={(e) =>
                      mutateWithPotentialProfit({
                        ...profit,
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
                    value={profit.custo_pos_imissao_outros}
                    onChange={(e) =>
                      mutateWithPotentialProfit({
                        ...profit,
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
                    value={profit.custo_pos_imissao_divida_iptu}
                    onChange={(e) =>
                      mutateWithPotentialProfit({
                        ...profit,
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
                    value={profit.custo_pos_imissao_divida_condominio}
                    onChange={(e) =>
                      mutateWithPotentialProfit({
                        ...profit,
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
              Custos Pós Arrematação (
              {formatCurrency(total_custo_pos_arrematacao)})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="prazoVenda" className="mb-2 block">
                  Prazo da Venda (em meses)
                </Label>
                <TextInput
                  id="prazoVenda"
                  type="number"
                  value={profit.custo_pos_arrematacao_prazo_de_venda_em_meses}
                  onChange={(e) =>
                    mutateWithPotentialProfit({
                      ...profit,
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
                  value={profit.custo_pos_arrematacao_valor_iptu_mensal}
                  onChange={(e) =>
                    mutateWithPotentialProfit({
                      ...profit,
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
                  value={profit.custo_pos_arrematacao_valor_condominio_mensal}
                  onChange={(e) =>
                    mutateWithPotentialProfit({
                      ...profit,
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
              Custos Pós Venda ({formatCurrency(total_custo_pos_venda)})
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
                      profit.custo_pos_venda_comissao_corretora_percentual * 100
                    }
                    onChange={(e) =>
                      mutateWithPotentialProfit({
                        ...profit,
                        custo_pos_venda_comissao_corretora_percentual:
                          Number(e.currentTarget.value) / 100,
                      })
                    }
                    addon="%"
                    step={1}
                  />
                  <p className="ml-2 text-gray-600">
                    {formatCurrency(
                      profit.custo_pos_venda_comissao_corretora_percentual *
                        valorVenda,
                    )}
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
                      profit.custo_pos_venda_imposto_ganho_capita_percentual *
                      100
                    }
                    onChange={(e) =>
                      mutateWithPotentialProfit({
                        ...profit,
                        custo_pos_venda_imposto_ganho_capita_percentual:
                          Number(e.currentTarget.value) / 100,
                      })
                    }
                    addon="%"
                    step={1}
                  />
                  <p className="ml-2 text-gray-600">
                    {formatCurrency(
                      profit.custo_pos_venda_imposto_ganho_capita_percentual *
                        total_custo_sem_imposto_venda,
                    )}
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

export function Lot({ scrapID }: { scrapID: number }) {
  const { data: scrap, isLoading } = useScrapDetails(scrapID);
  const { mutate } = useUpdateScrapMutation();

  return (
    <>
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
          <PotentialProfitCard scrap={scrap} />
        </div>
      )}
    </>
  );
}
