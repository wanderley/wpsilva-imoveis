import { z } from "zod";

export const AnalysisResult = z.object({
  analysis_result: z.object({
    tipo_imovel: z
      .enum([
        "Apartamento",
        "Casa",
        "Terreno",
        "Vaga de garagem",
        "Direitos fiduciários - Apartamento",
        "Imóvel comercial",
        "Outro",
      ])
      .describe(
        "Tipo do imóvel, como apartamento, casa, terreno, vaga de garagem, etc.",
      ),
    tamanho_imovel_m2: z
      .number()
      .describe("Área total do imóvel em metros quadrados"),
    area_construida_m2: z
      .number()
      .describe("Área construída do imóvel em metros quadrados"),
    endereco_completo: z
      .string()
      .describe(
        "Endereço completo do imóvel, incluindo rua, número, bairro, cidade, estado e CEP",
      ),
    endereco: z.object({
      rua: z.string().describe("Nome da rua"),
      numero: z.string().describe("Número do imóvel"),
      bairro: z.string().describe("Nome do bairro"),
      cidade: z.string().describe("Nome da cidade"),
      estado: z.string().describe("Sigla do estado"),
      cep: z.string().describe("CEP do imóvel"),
    }),
    vaga_garagem: z
      .enum(["Sim", "Não", "Não especificado"])
      .describe("Indica se o imóvel inclui vaga de garagem"),
    modalidade_propriedade: z
      .enum(["Propriedade plena", "Nua-propriedade", "Outro"])
      .describe(
        "Modalidade da propriedade do imóvel, como Propriedade Plena, Nua-Propriedade, etc.",
      ),
    divida_iptu: z
      .number()
      .describe(
        "Valor da dívida de IPTU registrada para este imóvel que não será paga com o produto da venda judicial. Inclua apenas se tiver certeza absoluta de que o arrematante deverá pagar.",
      ),
    divida_condominio: z
      .number()
      .describe(
        "Valor da dívida de condomínio registrada para este imóvel que não será paga com o produto da venda judicial. Inclua apenas se tiver certeza absoluta de que o arrematante deverá pagar.",
      ),
    penhoras: z
      .array(
        z.object({
          descricao_penhora: z
            .string()
            .describe(
              "Descrição detalhada da penhora e seu impacto para o arrematante",
            ),
          documento_mencionado: z
            .string()
            .describe(
              "Documento que menciona a penhora (exemplo: Edital, Matrícula ou Laudo)",
            ),
          trecho_documento: z
            .string()
            .describe(
              "Trecho do documento que menciona a penhora com no mínimo 20 palavras e no máximo 100 palavras",
            ),
        }),
      )
      .describe("Lista de penhoras registradas para o imóvel"),
    ocupacao_usucapiao: z
      .enum(["Sim", "Não", "Não especificado"])
      .describe("Indica se o ocupante é um invasor reivindicando usucapião"),
    condicao_geral: z
      .enum(["Ruim", "Boa", "Ótima"])
      .describe("Condição geral do imóvel"),
    tipo_reforma: z
      .enum(["Não precisa de reforma", "Reforma simples", "Reforma pesada"])
      .describe("Tipo de reforma necessária no imóvel"),
    imovel_ocupado: z
      .enum(["Sim", "Não"])
      .describe("Indica se o imóvel está ocupado no momento"),
  }),
});

export type AnalysisResult = z.infer<typeof AnalysisResult>;
