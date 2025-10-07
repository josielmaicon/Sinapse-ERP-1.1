import { Button } from "@/components/ui/button"; // Botão do shadcn

// Este componente recebe um 'título' e 'children' (o conteúdo da página)
export default function HomePageLayout({ title, children }) {
  return (
    <div className="container mx-auto px-4 py-6 md:px-6 md:py-8">
      {/* Cabeçalho da Página */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        
        {/* Exemplo de um botão de ação */}
        <Button>Adicionar Novo</Button>
      </div>

      {/* Conteúdo da Página */}
      <div className="bg-card p-6 rounded-lg border shadow-sm">
        {children}
      </div>
    </div>
  );
}