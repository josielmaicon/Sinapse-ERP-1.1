import PdvsPageLayout from "@/layouts/PdvsPageLayout"

export default function PdvsPage() {
  return (
    <PdvsPageLayout title="Página Inicial">
      <p>Conteúdo da Página Inicial.</p>
      <p className="mt-4">
        Agora o layout que está dentro deste div vai conseguir se esticar.
      </p>
    </PdvsPageLayout>
  );
}