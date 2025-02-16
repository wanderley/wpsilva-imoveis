import { CampoAlienacaoFiduciaria } from "@/features/auction/scrap/components/EditarLote/CampoAlienacaoFiduciaria";
import { CampoDebitoExequendo } from "@/features/auction/scrap/components/EditarLote/CampoDebitoExequendo";
import { CampoDebitoOutros } from "@/features/auction/scrap/components/EditarLote/CampoDebitoOutros";
import { CampoHipoteca } from "@/features/auction/scrap/components/EditarLote/CampoHipoteca";
import { CampoPorcentagemTitularidade } from "@/features/auction/scrap/components/EditarLote/CampoPorcentagemTitularidade";
import { CampoTipoDireito } from "@/features/auction/scrap/components/EditarLote/CampoTipoDireito";
import { CampoTipoExecucao } from "@/features/auction/scrap/components/EditarLote/CampoTipoExecucao";
import { CampoTipoImovel } from "@/features/auction/scrap/components/EditarLote/CampoTipoImovel";
import { z } from "zod";

export type Formulario = z.infer<typeof SchemaFormulario>;
export const SchemaFormulario = z.object({
  ...CampoTipoDireito.schema.shape,
  ...CampoTipoImovel.schema.shape,
  ...CampoPorcentagemTitularidade.schema.shape,
  ...CampoHipoteca.schema.shape,
  ...CampoAlienacaoFiduciaria.schema.shape,
  ...CampoDebitoExequendo.schema.shape,
  ...CampoDebitoOutros.schema.shape,
  ...CampoTipoExecucao.schema.shape,
});
