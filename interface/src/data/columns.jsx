export const columns = [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "nome",
    header: "Nome do Cliente",
  },
  {
    accessorKey: "cidade",
    header: "Cidade",
  },
  {
    accessorKey: "valor",
    header: "Valor Transportado (R$)",
    cell: ({ row }) => {
      const value = row.getValue("valor");
      return <span>R$ {Number(value).toLocaleString("pt-BR")}</span>;
    },
  },
];
