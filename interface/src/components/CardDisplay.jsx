// src/components/StatDisplay.jsx

// Este componente é apenas o "recheio".
// Ele não tem Card, borda ou padding principal.
export default function StatDisplay({ mainValue, description, subValue, icon: Icon }) {
  return (
    // 'h-full' e 'w-full' fazem ele preencher o espaço que o pai der
    <div className="h-full w-full flex flex-col justify-between p-4">
      <div>
        {Icon && <Icon className="h-5 w-5 text-muted-foreground mb-2" />}
        <p className="text-2xl font-bold tracking-tight">{mainValue}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <p className="text-xs font-medium text-green-500">{subValue}</p>
    </div>
  );
}