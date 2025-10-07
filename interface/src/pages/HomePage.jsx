import HomePageLayout from "@/layouts/HomepageLayout"

export default function HomePage() {
  return (
    <HomePageLayout title="Página Inicial">
      <p>Conteúdo da Página Inicial.</p>
      <p className="mt-4">
        Agora o layout que está dentro deste div vai conseguir se esticar.
      </p>
    </HomePageLayout>
  );
}