import StyledMarkdown from "@/components/StyledMarkdown";
import { Button } from "@/components/ui/button";
import { type Scrap } from "@/db/schema";
import { ArrowLeftRight } from "lucide-react";
import { useState } from "react";

interface Props {
  scrap: Scrap;
}

export function DescricaoAnalise({ scrap }: Props) {
  const [mostrarResumo, setMostrarResumo] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const toggleVisualizacao = () => setMostrarResumo((prev) => !prev);
  const handleHover = (hoverState: boolean) => () => setIsHovered(hoverState);

  const conteudoDescricao = mostrarResumo ? (
    scrap.analyses[0]?.response.description || "Descrição não disponível"
  ) : (
    <StyledMarkdown
      components={{
        pre: ({ children }) => <p className="p-1">{children}</p>,
        code: ({ children }) => <>{children}</>,
      }}
    >
      {scrap.description_markdown || scrap.description || ""}
    </StyledMarkdown>
  );

  return (
    <div
      className="relative group"
      onMouseEnter={handleHover(true)}
      onMouseLeave={handleHover(false)}
    >
      <div className="text-muted-foreground h-full transition-opacity duration-200">
        {conteudoDescricao}
      </div>

      <div
        className={`absolute top-0 right-4 translate-y-1/2 transition-opacity duration-200 ${isHovered ? "opacity-100" : "opacity-0"}`}
      >
        <Button
          variant="secondary"
          size="icon"
          className="rounded-full shadow-lg transform transition-transform hover:scale-105"
          onClick={toggleVisualizacao}
          aria-label={
            mostrarResumo ? "Mostrar descrição completa" : "Mostrar resumo"
          }
        >
          <ArrowLeftRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
