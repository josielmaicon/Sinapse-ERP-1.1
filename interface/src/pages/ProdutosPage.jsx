import ProdutosPageLayout from "@/layouts/ProdutosPageLayout"; 

export default function ProtudosPage() {
  return (
    <ProdutosPageLayout title="Página Inicial">
      <p>Conteúdo da Página Inicial.</p>
      <p className="mt-4">
        Agora o layout que está dentro deste div vai conseguir se esticar.
      </p>
    </ProdutosPageLayout>
  );
}