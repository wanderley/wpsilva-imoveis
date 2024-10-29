import { getPendingReviewLots } from "@/actions";
import LotCard from "@/components/LotCard";
import { usePendingReviewLots } from "@/hooks";
import { useQuery } from "@tanstack/react-query";
import { Button, Label, Pagination, Select, TextInput } from "flowbite-react";
import React, { useState } from "react";
import { FaClipboardCheck } from "react-icons/fa";

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 rounded-lg border border-gray-200">
      <FaClipboardCheck className="w-12 h-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Nenhum lote pendente de revisão
      </h3>
      <p className="text-gray-500">
        Quando houver lotes que precisam ser revisados, eles aparecerão aqui.
      </p>
    </div>
  );
}

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
  const { data: pendingReviewLots } = usePendingReviewLots();
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
      {pendingReviewLots.length === 0 ? (
        <EmptyState />
      ) : (
        <>
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
        </>
      )}
    </section>
  );
}
