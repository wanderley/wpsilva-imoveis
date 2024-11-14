"use client";

import { LotsGrid } from "@/components/LotsGrid";
import { usePagination, useSearchLots } from "@/hooks";
import { SearchLotsFilters } from "@/models/scraps/actions";
import { Button, Label, Select, Spinner, TextInput } from "flowbite-react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChangeEvent, useState } from "react";
import { FaFolderOpen } from "react-icons/fa";

function Filters({
  filters,
  updateFilters,
  updateUrl,
  clearFilters,
}: {
  filters: SearchLotsFilters;
  updateFilters: (
    key: keyof SearchLotsFilters,
  ) => (
    value: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLSelectElement>,
  ) => void;
  updateUrl: () => void;
  clearFilters: () => void;
}) {
  return (
    <div className="w-full p-4 bg-white rounded-lg border border-gray-200">
      <div className="space-y-4">
        {/* Price Range */}
        <div>
          <div className="mb-2 block">
            <Label htmlFor="price-range" value="Faixa de Preço" />
          </div>
          <div className="flex gap-2">
            <TextInput
              id="min-price"
              type="number"
              placeholder="Min"
              value={filters.min}
              onChange={updateFilters("min")}
              onBlur={updateUrl}
              step={50000}
            />
            <TextInput
              id="max-price"
              type="number"
              placeholder="Max"
              value={filters.max}
              onChange={updateFilters("max")}
              onBlur={updateUrl}
              step={50000}
            />
          </div>
        </div>

        {/* Lot Phase */}
        <div>
          <div className="mb-2 block">
            <Label htmlFor="active" value="Quando vai acontecer?" />
          </div>
          <Select
            id="active"
            value={filters.active}
            onChange={updateFilters("active")}
          >
            <option value="1">Ainda vai acontecer</option>
            <option value="0">Já aconteceu</option>
          </Select>
        </div>

        {/* Lot Phase */}
        <div>
          <div className="mb-2 block">
            <Label htmlFor="phase" value="Fase" />
          </div>
          <Select
            id="phase"
            value={filters.phase}
            onChange={updateFilters("phase")}
          >
            <option value="">Todos</option>
            <option value="interesting">Interessante</option>
            <option value="pendingReview">Revisão Pendente</option>
          </Select>
        </div>

        {/* Apply Filters Button */}
        <Button color="dark" className="w-full" onClick={updateUrl}>
          Aplicar Filtros
        </Button>
        <Button color="light" className="w-full" onClick={clearFilters}>
          Limpar Filtros
        </Button>
      </div>
    </div>
  );
}

function useFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [newFilters, setNewFilters] = useState<SearchLotsFilters>({
    min: searchParams.get("min") || "",
    max: searchParams.get("max") || "",
    phase: (searchParams.get("phase") || "") as SearchLotsFilters["phase"],
    active: (searchParams.get("active") || "1") as SearchLotsFilters["active"],
  });

  const [filters, setFilters] = useState<SearchLotsFilters>({
    min: searchParams.get("min") || "",
    max: searchParams.get("max") || "",
    phase: (searchParams.get("phase") || "") as SearchLotsFilters["phase"],
    active: (searchParams.get("active") || "1") as SearchLotsFilters["active"],
  });

  const updateFilters =
    (key: keyof typeof filters) =>
    (value: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLSelectElement>) =>
      setNewFilters((prev) => ({ ...prev, [key]: value.target.value }));

  const updateUrl = () => {
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    router.push(`/lots?${params.toString()}`);
    setFilters(newFilters);
  };

  const clearFilters = () => {
    setNewFilters({
      min: "",
      max: "",
      phase: "",
      active: "1",
    });
    updateUrl();
  };

  return { newFilters, filters, updateFilters, updateUrl, clearFilters };
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 rounded-lg border border-gray-200">
      <FaFolderOpen className="w-12 h-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Nenhum lote encontrado
      </h3>
      <p className="text-gray-500">Mude os filtros para encontrar lotes.</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 rounded-lg border border-gray-200 min-h-[calc(100vh-200px)]">
      <Spinner size="lg" className="mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Carregando lotes
      </h3>
    </div>
  );
}

export default function Page() {
  const { newFilters, filters, updateFilters, updateUrl, clearFilters } =
    useFilters();
  const { currentPage, setCurrentPage, itemsPerPage } = usePagination();
  const { data, isLoading } = useSearchLots(filters);

  let body = <></>;
  if (isLoading) {
    body = <LoadingState />;
  } else if (data && data.length === 0) {
    body = <EmptyState />;
  } else {
    body = (
      <LotsGrid
        lots={data || []}
        openLotMode={"page"}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
      />
    );
  }
  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-6">Lotes</h2>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-64 flex-shrink-0">
          <Filters
            filters={newFilters}
            updateFilters={updateFilters}
            updateUrl={updateUrl}
            clearFilters={clearFilters}
          />
        </div>
        <div className="flex-1">{body}</div>
      </div>
    </div>
  );
}
