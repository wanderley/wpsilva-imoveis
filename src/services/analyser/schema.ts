import { z } from "zod";

declare module "zod" {
  interface ZodType {
    questions: (...questions: string[]) => this;
    getQuestions: () => string[];
    knowledge: (...knowledge: string[]) => this;
    getKnowledge: () => string[];
  }
}

z.ZodType.prototype.questions = function (...questions: string[]) {
  this._def.questions = questions;
  return this;
};

z.ZodType.prototype.getQuestions = function () {
  return this._def.questions || [];
};

z.ZodType.prototype.knowledge = function (...knowledge: string[]) {
  this._def.knowledge = knowledge;
  return this;
};

z.ZodType.prototype.getKnowledge = function () {
  return this._def.knowledge || [];
};

function getQuestions(schema: z.ZodType): string[] {
  const questions: string[] = schema.getQuestions();

  if (schema instanceof z.ZodObject) {
    const shape = schema._def.shape();
    // @ts-expect-error TypeScript thinks shape is unknown
    Object.values(shape).forEach((field: z.ZodType) => {
      questions.push(...getQuestions(field));
    });
  } else if (schema instanceof z.ZodArray) {
    questions.push(...getQuestions(schema.element));
  }
  return questions;
}

export function getAllQuestions(): string[] {
  return getQuestions(schema);
}

function getKnowledge(schema: z.ZodType): string[] {
  const knowledge: string[] = schema.getKnowledge();

  if (schema instanceof z.ZodObject) {
    const shape = schema._def.shape();
    // @ts-expect-error TypeScript thinks shape is unknown
    Object.values(shape).forEach((field: z.ZodType) => {
      knowledge.push(...getKnowledge(field));
    });
  } else if (schema instanceof z.ZodArray) {
    knowledge.push(...getKnowledge(schema.element));
  }
  return knowledge;
}

export function getAllKnowledge(): string[] {
  return getKnowledge(schema);
}

export const schema = z.object({
  title: z.string().describe("Título ou manchete do imóvel."),
  description: z
    .string()
    .describe("Descrição detalhada do imóvel.  Entre 50 e 100 palavras."),
  property_type: z
    .enum([
      "Apartamento",
      "Casa",
      "Terreno",
      "Comercial",
      "Vaga de Garagem",
      "Loja",
    ])
    .describe("Tipo do imóvel.")
    .questions("Qual é o tipo de imóvel?"),
  address: z
    .string()
    .describe("Endereço completo do imóvel.")
    .questions("Qual é o endereço completo do imóvel?"),
  occupancy_status: z
    .enum(["Ocupado", "Desocupado", "Indeterminado"])
    .describe("Status atual de ocupação do imóvel.")
    .questions("O imóvel está ocupado no momento?"),
  area: z
    .object({
      private: z
        .number()
        .optional()
        .describe("Área privativa em metros quadrados."),
      common: z.number().optional().describe("Área comum em metros quadrados."),
      total: z.number().describe("Área total em metros quadrados."),
    })
    .questions(
      "Qual é a área privativa do imóvel em metros quadrados?",
      "Qual é a área comum do imóvel em metros quadrados?",
      "Qual é a área total do imóvel em metros quadrados?",
    ),
  house_details: z.object({
    floors: z.number().int().optional().describe("Número de andares na casa."),
    rooms: z
      .object({
        bedrooms: z.number().int().optional().describe("Número de quartos."),
        bathrooms: z.number().int().optional().describe("Número de banheiros."),
        living_rooms: z
          .number()
          .int()
          .optional()
          .describe("Número de salas de estar."),
        kitchen: z.number().int().optional().describe("Número de cozinhas."),
        service_areas: z
          .number()
          .int()
          .optional()
          .describe("Número de áreas de serviço."),
        garages: z
          .number()
          .int()
          .optional()
          .describe("Número de vagas de garagem.")
          .questions(
            "O imóvel possui vaga de garagem?",
            "Se o imóvel possui vaga de garagem, a mesma está na mesma matrícula ou tem matrícula independente?",
            "Se o imóvel possui vaga de garagem, a avaliação do imóvel inclui a vaga de garagem?",
            "Se o imóvel for um apartamento, a vaga aparece explicitamente nos documentos do leilão?",
          ),
      })
      .describe("Detalhes da casa."),
    extras: z
      .array(z.string())
      .describe("Lista de características extras (ex: varanda, piscina)."),
  }),
  auction: z.object({
    auctioneer_name: z
      .string()
      .describe("Nome do arrematante.")
      .questions("Qual é o nome do arrematante?"),
    auctioneer_registration: z
      .string()
      .describe("Matrícula do leiloeiro. Por exemplo: JUCESP 12345.")
      .questions("Qual é a matrícula do leiloeiro?"),
    auctionner_website: z
      .string()
      .describe("Website do leiloeiro.")
      .questions("Qual é o website do leiloeiro?"),
  }),
  legal: z.object({
    property_ownership_type: z
      .enum([
        "Propriedade plena",
        "Nua-propriedade",
        "Usufruto",
        "Direito real de superfície",
        "Parte ideal/fração ideal",
        "Indeterminado",
      ])
      .describe(
        "Modalidade da propriedade do imóvel, como Propriedade Plena, Nua-Propriedade, etc.",
      )
      .questions(
        "Qual é a modalidade da propriedade do imóvel?",
        "O imóvel é uma propriedade plena?",
        "O imóvel é uma nua-propriedade?",
        "O imóvel é um usufruto?",
        "O imóvel é um direito real de superfície?",
        "O imóvel é uma parte ideal/fração ideal?",
      )
      .knowledge(
        "Se o edital informa 'Nua-propriedade', então essa arrematação não é recomendada, pois você terá apenas a titularidade formal do imóvel sem poder usar, gozar ou habitar o bem enquanto durar o usufruto em favor de terceiro.",
        "Se o edital informa 'Direito de Usufruto', então essa arrematação não é recomendada, pois o direito é temporário e se extingue com a morte do usufrutuário, tornando-o um investimento arriscado e de difícil revenda.",
        "Se o edital informa 'Direito de Superfície', então essa arrematação não é recomendada, pois o direito é temporário e se limita apenas às construções ou plantações sobre o terreno, sem incluir a propriedade do solo.",
        "Se o edital informa 'Parte Ideal/Fração Ideal', então essa arrematação não é recomendada, pois você precisará da concordância dos demais coproprietários para qualquer decisão sobre o imóvel, gerando potenciais conflitos e dificuldades de gestão.",
      ),
    registration_number: z
      .string()
      .optional()
      .describe("Número de registro do imóvel no cartório."),
    registry_office: z
      .string()
      .optional()
      .describe("Nome do cartório de registro."),
    tax_id: z.string().optional().describe("Identificação fiscal do imóvel."),
    liens: z.array(
      z.object({
        type: z
          .string()
          .describe("Tipo de ônus (ex: hipoteca, judicial, penhora, etc.)."),
        details: z.string().optional().describe("Detalhes do ônus."),
        document_mentioned: z
          .string()
          .describe("Documento que menciona o ônus. Entre 100 e 200 palavras."),
        excerpt_document: z
          .string()
          .describe(
            "Trecho do documento que menciona o ônus. Entre 100 e 200 palavras.",
          ),
      }),
    ),
  }),
  financial: z.object({
    evaluation: z.object({
      value: z.number().describe("Valor avaliado do imóvel."),
      evaluation_date: z
        .string()
        .optional()
        .describe("Data da avaliação. Formato: AAAA-MM-DD"),
    }),
    specific_debts: z
      .object({
        IPTU: z
          .object({
            value: z.number().describe("Valor da dívida de IPTU."),
            responsible: z
              .enum(["Arrematante", "Proprietário", "Indeterminado"])
              .describe("Pessoa responsável pela dívida de IPTU.")
              .questions(
                "Qual é o trecho do documento que menciona a dívida de IPTU e seu pagamento?",
                "Por quem será paga a dívida de IPTU? (Classifique como 'arrematante', 'proprietário' ou 'produto da venda judicial') Leve em consideração a resposta da pergunta anterior.",
                "Qual valor da dívida de IPTU que será paga pelo arrematante?  (Responda com 0 se a dívida não for paga pelo arrematante)",
              ),
            document_mentioned: z
              .enum(["Edital", "Laudo", "Matrícula"])
              .describe("Documento que menciona a dívida de IPTU."),
            excerpt_document: z
              .string()
              .describe(
                "Trecho do documento que menciona a dívida de IPTU e o trecho do documento que menciona quem é responsável pelo pagamento da dívida. Entre 100 e 200 palavras.",
              ),
          })
          .optional(),
        active_debt: z
          .object({
            value: z.number().describe("Valor da dívida ativa."),
            responsible: z
              .enum(["Arrematante", "Proprietário", "Indeterminado"])
              .describe("Pessoa responsável pela dívida ativa.")
              .questions(
                "Qual é o trecho do documento que menciona a dívida ativa e seu pagamento?",
                "Por quem será paga a dívida ativa? (Classifique como 'arrematante', 'proprietário' ou 'produto da venda judicial') Leve em consideração a resposta da pergunta anterior.",
                "Qual valor da dívida ativa que será paga pelo arrematante?  (Responda com 0 se a dívida não for paga pelo arrematante)",
              ),
            document_mentioned: z
              .enum(["Edital", "Laudo", "Matrícula"])
              .describe("Documento que menciona a dívida ativa."),
            excerpt_document: z
              .string()
              .describe(
                "Trecho do documento que menciona a dívida ativa e o trecho do documento que menciona quem é responsável pelo pagamento da dívida. Entre 100 e 200 palavras.",
              ),
          })
          .optional(),
        condominium: z
          .object({
            value: z.number().describe("Valor da dívida de condomínio."),
            responsible: z
              .enum(["Arrematante", "Proprietário", "Indeterminado"])
              .describe("Pessoa responsável pela dívida de condomínio.")
              .questions(
                "Qual é o trecho do documento que menciona a dívida de condomínio e seu pagamento?",
                "Por quem será paga a dívida de condomínio? (Classifique como 'arrematante', 'proprietário' ou 'produto da venda judicial') Leve em consideração a resposta da pergunta anterior.",
                "Qual valor da dívida de condomínio que será paga pelo arrematante?  (Responda com 0 se a dívida não for paga pelo arrematante)",
              ),
            document_mentioned: z
              .enum(["Edital", "Laudo", "Matrícula"])
              .describe("Documento que menciona a dívida de condomínio."),
            excerpt_document: z
              .string()
              .describe(
                "Trecho do documento que menciona a dívida de condomínio e o trecho do documento que menciona quem é responsável pelo pagamento da dívida. Entre 100 e 200 palavras.",
              ),
          })
          .optional(),
      })
      .describe("Dívidas específicas do imóvel.")
      .questions("Quais dívidas serão pagas com o produto da venda judicial?"),
    other_debts: z
      .array(
        z.object({
          value: z.number().describe("Valor da dívida."),
          responsible: z
            .enum(["Arrematante", "Proprietário", "Indeterminado"])
            .describe("Pessoa responsável pela dívida."),
          document_mentioned: z
            .string()
            .describe("Documento que menciona a dívida."),
          excerpt_document: z
            .string()
            .describe(
              "Trecho do documento que menciona a dívida. Entre 100 e 200 palavras.",
            ),
        }),
      )
      .describe("Outras dívidas do imóvel."),
  }),
  condominium_details: z
    .object({
      classification: z
        .enum([
          "Econômico",
          "Padrão Médio",
          "Alto Padrão",
          "Luxo",
          "Comercial",
          "Residencial Simples",
          "Residencial Completo",
          "Resort",
          "Misto",
        ])
        .describe("Classificação do condomínio.")
        .knowledge(
          "Condomínios classificados como 'Econômico' tem as seguintes características: Condomínios com poucas amenidades, padrão básico e voltados para custo reduzido.",
          "Condomínios classificados como 'Padrão Médio' tem as seguintes características: Infraestrutura básica, com algumas amenidades como salão de festas ou playground.",
          "Condomínios classificados como 'Alto Padrão' tem as seguintes características: Oferecem uma ampla variedade de amenidades, acabamentos de qualidade superior e foco no conforto.",
          "Condomínios classificados como 'Luxo' tem as seguintes características: Condomínios exclusivos, com amenidades premium (spa, cinema, quadras especializadas) e serviços diferenciados.",
          "Condomínios classificados como 'Comercial' tem as seguintes características: Voltados para empreendimentos comerciais, como salas e lojas.",
          "Condomínios classificados como 'Residencial Simples' tem as seguintes características: Foco em residências acessíveis sem muitas áreas de lazer.",
          "Condomínios classificados como 'Residencial Completo' tem as seguintes características: Equipado com diversas opções de lazer e segurança avançada.",
          "Condomínios classificados como 'Resort' tem as seguintes características: Estruturas que oferecem uma experiência similar a resorts, com diversas opções de lazer e recreação.",
          "Condomínios classificados como 'Misto' tem as seguintes características: Uso residencial e comercial, podendo ter lojas ou escritórios no mesmo empreendimento.",
        ),
      amenities: z
        .array(z.string())
        .describe("Lista de comodidades do condomínio."),
    })
    .optional(),
  appraisal: z.object({
    general_condition: z
      .enum(["Ruim", "Boa", "Ótima", "Indeterminado"])
      .describe("Condição geral do imóvel.")
      .questions(
        "Qual é a condição geral do imóvel?",
        "O imóvel precisa de reforma?",
      )
      .knowledge(
        "Se o laudo não especifica a condição do imóvel, então não é possível avaliar a condição do imóvel; portanto, presume-se a necessidade de uma reforma completa.",
      ),
    type_of_reform: z
      .enum([
        "Não precisa de reforma",
        "Reforma simples",
        "Reforma pesada",
        "Indeterminado",
      ])
      .describe("Tipo de reforma necessária no imóvel.")
      .questions(
        "Se o imóvel precisa de reforma, qual é o tipo de reforma necessária no imóvel?",
      )
      .knowledge(
        "Se o laudo não especifica a condição do imóvel, então não é possível avaliar a condição do imóvel; portanto, presume-se a necessidade de uma reforma completa.",
        "Se a condição do imóvel é 'Ruim', então a reforma necessária é 'Reforma pesada'.",
      ),
  }),
  risks: z
    .object({
      risk: z
        .enum(["Baixo", "Médio", "Alto"])
        .describe("Risco de arrematação."),
      justification: z
        .string()
        .describe(
          "Justificativa para o risco de arrematação. Entre 100 e 200 palavras.",
        ),
    })
    .knowledge(
      "Se o imóvel está sob processo de usucapião, então essa arrematação não é recomendada devido ao alto custo do processo de obtenção da posse.",
      "Para calcular o risco do imóvel, é necessário considerar a legalidade da arrematação, os ônus que podem impedir a efetivação da arrematação e a condição do imóvel.",
      "Não inclua na análise de risco dívidas das quais o arrematante não será responsável ou você não consegue determinar quem é responsável pelo pagamento da dívida.",
    ),
  notes: z
    .array(z.string())
    .optional()
    .describe("Notas ou observações adicionais sobre o imóvel."),
});

export type Schema = z.infer<typeof schema>;
