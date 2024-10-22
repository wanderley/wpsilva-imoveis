import Link from "next/link";

import { SCRAPERS } from "./constants";

export default function Page() {
  return (
    <>
      <h1 className="text-2xl">Dashboard</h1>
      <h2 className="text-xl">Scapers</h2>
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(SCRAPERS).map((s) => (
            <tr key={`scraper/${s[0]}`}>
              <td>
                <Link href={`/scraper/${s[0]}`}>{s[1]}</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
