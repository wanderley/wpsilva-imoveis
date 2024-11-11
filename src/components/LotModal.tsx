"use client";

import { useScrapDetails, useUpdateScrapMutation } from "@/hooks";
import { Modal } from "flowbite-react";
import { useEffect } from "react";

import { Lot } from "./Lot";

interface Props {
  scrapID: number;
  showModal: boolean;
  setShowModal: (show: boolean) => void;
}

export function LotModal({ scrapID, showModal, setShowModal }: Props) {
  const { data: scrap } = useScrapDetails(scrapID);
  const { mutate } = useUpdateScrapMutation();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowModal(false);
      }
    };

    if (showModal) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showModal, setShowModal]);

  return (
    <Modal show={showModal} onClose={() => setShowModal(false)} size="7xl">
      {scrap && <Modal.Header>{scrap.name}</Modal.Header>}
      <Modal.Body>
        <Lot scrapID={scrapID} />
      </Modal.Body>
    </Modal>
  );
}
