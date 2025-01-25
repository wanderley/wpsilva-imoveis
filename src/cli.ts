import { db } from "@/db";
import ManutencaoCommand from "@/services/manutencao/command";
import ProcessoJudicialCommand from "@/services/processo-judicial/command";
import ScraperCommand from "@/services/scraper/command";
import { program } from "commander";

program.addCommand(ScraperCommand());
program.addCommand(ProcessoJudicialCommand());
program.addCommand(ManutencaoCommand());

program
  .parseAsync()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    console.log("Closing database connection.");
    await db.$client.end();
    process.exit(0);
  });
