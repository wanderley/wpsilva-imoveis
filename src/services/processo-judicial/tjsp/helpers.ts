export async function getProcessoLink(numeroProcesso: string): Promise<string> {
  const response = await fetch(
    `https://esaj.tjsp.jus.br/cpopg/search.do?conversationId=&cbPesquisa=NUMPROC&numeroDigitoAnoUnificado=&foroNumeroUnificado=&dadosConsulta.valorConsultaNuUnificado=&dadosConsulta.valorConsultaNuUnificado=UNIFICADO&dadosConsulta.valorConsulta=${numeroProcesso}&dadosConsulta.tipoNuProcesso=SAJ`,
  );
  return response.url;
}
