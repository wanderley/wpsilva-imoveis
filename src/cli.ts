import { db } from "@/db";
import ProcessoJudicialCommand from "@/services/processo-judicial/command";
import { program } from "commander";

import ScraperCommand from "./services/scraper/command";

program.addCommand(ScraperCommand());
program.addCommand(ProcessoJudicialCommand());

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
