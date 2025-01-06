"use client";

import { LotsFilters } from "@/features/auction/scrap/grid/api";
import { LotsGridByFilter } from "@/features/auction/scrap/grid/components/LotsGridByFilter";
import { Button, Label, Select, TextInput } from "flowbite-react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChangeEvent, useState } from "react";

function Filters({
  filters,
  updateFilters,
  updateUrl,
  clearFilters,
}: {
  filters: LotsFilters;
  updateFilters: (
    key: keyof LotsFilters,
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

        {/* Profit Limit */}
        <div>
          <div className="mb-2 block">
            <Label htmlFor="profit-min" value="Lucro mínimo" />
          </div>
          <Select
            id="profit-min"
            value={filters.profitMin}
            onChange={updateFilters("profitMin")}
          >
            <option value="">Sem limite</option>
            <option value="10">10%+</option>
            <option value="20">20%+</option>
            <option value="30">30%+</option>
            <option value="40">40%+</option>
          </Select>
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

        {/* Auction Status */}
        <div>
          <div className="mb-2 block">
            <Label htmlFor="auction-status" value="Status para lance" />
          </div>
          <Select
            id="auction-status"
            value={filters.auctionStatus}
            onChange={updateFilters("auctionStatus")}
          >
            <option value="all">Todos</option>
            <option value="available">Disponível</option>
            <option value="unavailable">Indisponível</option>
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

  const [newFilters, setNewFilters] = useState<LotsFilters>({
    min: searchParams.get("min") || "",
    max: searchParams.get("max") || "",
    phase: (searchParams.get("phase") || "") as LotsFilters["phase"],
    active: (searchParams.get("active") || "1") as LotsFilters["active"],
    auctionStatus: (searchParams.get("auctionStatus") ||
      "available") as LotsFilters["auctionStatus"],
    profitMin: (searchParams.get("profitMin") ||
      "") as LotsFilters["profitMin"],
  });

  const [filters, setFilters] = useState<LotsFilters>({
    min: searchParams.get("min") || "",
    max: searchParams.get("max") || "",
    phase: (searchParams.get("phase") || "") as LotsFilters["phase"],
    active: (searchParams.get("active") || "1") as LotsFilters["active"],
    auctionStatus: (searchParams.get("auctionStatus") ||
      "available") as LotsFilters["auctionStatus"],
    profitMin: (searchParams.get("profitMin") ||
      "") as LotsFilters["profitMin"],
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
      auctionStatus: "all",
      profitMin: "",
    });
    updateUrl();
  };

  return { newFilters, filters, updateFilters, updateUrl, clearFilters };
}

export default function Page() {
  const { newFilters, updateFilters, updateUrl, clearFilters } = useFilters();

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-6">Lotes</h2>
      <div className="flex gap-6">
        <div className="w-64 flex-shrink-0">
          <Filters
            filters={newFilters}
            updateFilters={updateFilters}
            updateUrl={updateUrl}
            clearFilters={clearFilters}
          />
        </div>
        <div className="flex-grow">
          <LotsGridByFilter
            showHeader={true}
            itemsPerPage={9}
            filter={newFilters}
            openLotMode={"page"}
          />
        </div>
      </div>
    </div>
  );
}
