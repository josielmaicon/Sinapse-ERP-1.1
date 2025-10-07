export default function HomePageLayout({ title, children }) { // Mudei para export nomeado para consistência
  return (
    // 1. Adicione o padding (p-2) aqui.
    // 2. h-full garante que ele pegue a altura do <main>.
    <div className="flex-1 p-2 flex flex-col">
      {/* flex-grow faz o grid ocupar o espaço restante DENTRO do padding */}
      <div className="flex-grow grid grid-cols-[0.6fr_0.4fr] gap-2">
        {/* Coluna da Esquerda */}
        <div className="grid grid-rows-[0.6fr_0.4fr] gap-2">
          <div className="bg-card p-6 rounded-lg border">
            {children}
          </div>
          <div className="bg-card p-6 rounded-lg border">
            {/* Bloco 2 */}
          </div>
        </div>
        {/* Coluna da Direita */}
        <div className="bg-card p-6 rounded-lg border">
          {/* Bloco 3 */}
        </div>
      </div>
    </div>
  );
}