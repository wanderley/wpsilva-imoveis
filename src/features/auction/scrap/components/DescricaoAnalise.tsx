import StyledMarkdown from "@/components/StyledMarkdown";
import { Button } from "@/components/ui/button";
import { type Scrap } from "@/db/schema";
import { ArrowLeftRight } from "lucide-react";
import { useState } from "react";

export function DescricaoAnalise({ scrap }: { scrap: Scrap }) {
  const [mostrarResumo, setMostrarResumo] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="text-muted-foreground h-full">
        {mostrarResumo ? (
          scrap.analyses[0].response.description
        ) : (
          <StyledMarkdown>
            {scrap.description_markdown || scrap.description || ""}
          </StyledMarkdown>
        )}
      </div>
      {isHovered && (
        <div className="absolute top-0 right-4 translate-y-1/2">
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full shadow-lg"
            onClick={() => setMostrarResumo(!mostrarResumo)}
          >
            <ArrowLeftRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
