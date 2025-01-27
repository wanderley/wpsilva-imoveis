import { SystemFile } from "@/services/file/system-file";
import { TextoExtraido } from "@/services/processo-judicial/types";
import { Cookie } from "puppeteer";

export type Subdocumento = {
  primeiraPagina: number;
  ultimaPagina: number;
  href: string;
};

export type Documento = {
  numeroProcesso: string;
  codigoDocumento: string;
  dataInclusao: Date;
  titulo: string;
  primeiraPagina: number;
  ultimaPagina: number;
  tipoDocumentoDigital: string;
  folhaPeticaoInicial: boolean;
  codigoProcessoOrigem: string | undefined;
  partesProcessoOrigem?: ParteInteressada[];
  subdocumentos: Subdocumento[];
  file: SystemFile;
  cookies: Cookie[];
  textoExtraido?: TextoExtraido;
};

export type ParteInteressada = {
  tipo: string;
  nomes: string[];
};

export type DadosPrincipais = {
  classe: string | undefined;
  assunto: string | undefined;
  foro: string | undefined;
  vara: string | undefined;
  juiz: string | undefined;
  distribuicao: Date | undefined;
  numeroControle: string | undefined;
  area: string | undefined;
  valorAcao: number | undefined;
  situacao: string | undefined;
  processoPrincipal: string | undefined;
  partes: ParteInteressada[];
  apensos: {
    numeroProcesso: string | undefined;
    classe: string | undefined;
    apensamento: string | undefined;
    motivo: string | undefined;
  }[];
};
