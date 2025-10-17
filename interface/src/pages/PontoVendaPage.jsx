import * as React from "react"
import ComprasPageLayout from "@/layouts/PontoVendaLayout";
import SaleItemsList from "@/components/itensvenda";
import PosHeaderStatus from "@/components/Header2";
import SaleResume from "@/components/subtotal";
import PosSidePanel from "@/components/PainelLateral";
import PosFooterStatus from "@/components/rodape";

const mockCartItems = [
    { id: "7891000315517", name: "Leite Integral 1L", quantity: 2, unitPrice: 5.99, totalPrice: 11.98 },
    { id: "7890000000025", name: "Pão Francês", quantity: 5, unitPrice: 0.80, totalPrice: 4.00 },
    { id: "7894900010015", name: "Coca-Cola 2L", quantity: 1, unitPrice: 9.50, totalPrice: 9.50 },
];

export default function PontoVenda() {

  const [cartItems, setCartItems] = React.useState(mockCartItems);
  const lastItem = cartItems.length > 0 ? cartItems[cartItems.length - 1] : null;
  const [saleStatus, setSaleStatus] = React.useState("livre");

  return (
    <ComprasPageLayout
      Header1={<div>Nome e Versão</div>}
      Header2={<PosHeaderStatus />}
      
      SidePanel={<PosSidePanel lastItem={lastItem} />}

      MainContent={<SaleItemsList items={cartItems} />}
      Resume={<SaleResume items={cartItems} />}
      Footer={<PosFooterStatus status={saleStatus} />}
    />
  );
}