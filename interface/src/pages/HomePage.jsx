import HomePageLayout from "@/layouts/HomepageLayout"

export default function HomePage() {
  return (
    <HomePageLayout>
      {/* Todo o conteúdo específico da página de estoque vai aqui dentro */}
      <p>Aqui fica a tabela ou os cards para gerenciar o estoque.</p>
      <p className="mt-4">
        Você pode colocar qualquer componente aqui dentro, e ele aparecerá
        no contêiner branco com bordas.
      </p>
    </HomePageLayout>
  );
}