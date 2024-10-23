"use client";

import { Navbar as FNavbar } from "flowbite-react";
import Link from "next/link";

export function Navbar() {
  return (
    <FNavbar fluid rounded className="bg-gray-200">
      <FNavbar.Brand as={Link} href="/">
        <span className="self-center whitespace-nowrap text-xl font-semibold">
          W&P Silva Imóveis
        </span>
      </FNavbar.Brand>
      <FNavbar.Toggle />
      <FNavbar.Collapse>
        <FNavbar.Link href="/scraper" as={Link} className="hover:text-gray-300">
          Scrapers
        </FNavbar.Link>
      </FNavbar.Collapse>
    </FNavbar>
  );
}
