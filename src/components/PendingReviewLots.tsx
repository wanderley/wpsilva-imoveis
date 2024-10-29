import { getPendingReviewLots } from "@/actions";
import LotCard from "@/components/LotCard";
import { useQuery } from "@tanstack/react-query";
import { Button, Label, Pagination, Select, TextInput } from "flowbite-react";
import React, { useState } from "react";

export function PendingReviewLots() {
  const [currentPage, setCurrentPage] = useState(1);
  const [valorMinimo, setValorMinimo] = useState<string>("");
  const [valorMaximo, setValorMaximo] = useState<string>("");
  const [descontoMinimo, setDescontoMinimo] = useState<string>("");
  const itemsPerPage = 3;

  // const filtrarImoveis = (imoveis: Imovel[]) => {
  //   return imoveis.filter((imovel) => {
  //     const valorMinFilter = valorMinimo
  //       ? imovel.bid && imovel.bid >= parseInt(valorMinimo)
  //       : true;
  //     const valorMaxFilter = valorMaximo
  //       ? imovel.bid && imovel.bid <= parseInt(valorMaximo)
  //       : true;
  //     const descontoFilter = descontoMinimo
  //       ? imovel.avaliacao &&
  //         imovel.bid &&
  //         ((imovel.avaliacao - imovel.bid) / imovel.avaliacao) * 100 >=
  //           parseInt(descontoMinimo)
  //       : true;
  //     return valorMinFilter && valorMaxFilter && descontoFilter;
  //   });
  // };

  // const imoveisFiltrados = filtrarImoveis(imoveisPendentes);
  const { data: pendingReviewLots } = useQuery({
    queryKey: ["pending-review-lots"],
    queryFn: async () => await getPendingReviewLots(),
    initialData: [],
  });
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = pendingReviewLots.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );

  const onPageChange = (page: number) => setCurrentPage(page);

  return (
    <section className="mb-12">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
        <h2 className="text-2xl font-semibold">Lotes com Revisão Pendente</h2>
        {pendingReviewLots.length > 0 && (
          <Button
            color="dark"
            onClick={() => alert("Iniciando revisão em lote")}
          >
            Iniciar Revisão
          </Button>
        )}
      </div>
      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <Label htmlFor="valorMinimo">Valor Mínimo</Label>
          <TextInput
            id="valorMinimo"
            type="number"
            placeholder="R$ 0"
            value={valorMinimo}
            onChange={(e) => setValorMinimo(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="valorMaximo">Valor Máximo</Label>
          <TextInput
            id="valorMaximo"
            type="number"
            placeholder="R$ 1.000.000"
            value={valorMaximo}
            onChange={(e) => setValorMaximo(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="descontoMinimo">Desconto Mínimo</Label>
          <Select
            id="descontoMinimo"
            value={descontoMinimo}
            onChange={(e) => setDescontoMinimo(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="10">10%</option>
            <option value="20">20%</option>
            <option value="30">30%</option>
            <option value="40">40%</option>
            <option value="50">50% ou mais</option>
          </Select>
        </div>
      </div> */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-4">
        {currentItems.map((imovel) => (
          <LotCard key={imovel.id} imovel={imovel} />
        ))}
      </div>
      <div className="flex overflow-x-auto sm:justify-center">
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(pendingReviewLots.length / itemsPerPage)}
          onPageChange={onPageChange}
          showIcons={true}
          previousLabel="Anterior"
          nextLabel="Próxima"
        />
      </div>
    </section>
  );
}
