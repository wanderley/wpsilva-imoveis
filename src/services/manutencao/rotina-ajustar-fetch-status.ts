import { db } from "@/db";
import { scrapsTable } from "@/db/schema";
import { updateDb } from "@/services/manutencao/lib/update-db";
import { eq } from "drizzle-orm";

export const descricao = "Atualiza o status de fetch dos scraps";

export const rotina = updateDb({
  query: db.query.scrapsTable.findMany({
    columns: {
      id: true,
      name: true,
      address: true,
      case_number: true,
      edital_link: true,
      matricula_link: true,
    },
    where: eq(scrapsTable.fetch_status, "failed"),
  }),
  workers: 100,
  update: async (scrap) => {
    const requiredFields = [
      scrap.name,
      scrap.address,
      scrap.case_number,
      scrap.edital_link,
      scrap.matricula_link,
    ];
    let status: "fetched" | "failed" = "fetched";
    if (requiredFields.some((field) => field == null)) {
      status = "failed";
    }
    await db
      .update(scrapsTable)
      .set({ fetch_status: status })
      .where(eq(scrapsTable.id, scrap.id));
  },
});
