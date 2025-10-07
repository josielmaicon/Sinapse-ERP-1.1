import EstoquePageLayout from "@/layouts/EstoquePageLayout"; 

export default function HomePage() {
  return (
    <EstoquePageLayout title="Página Inicial">
      <p>Conteúdo da Página Inicial.</p>
      <p className="mt-4">
        Agora o layout que está dentro deste div vai conseguir se esticar.
      </p>
    </EstoquePageLayout>
  );
}