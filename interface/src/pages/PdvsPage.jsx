import PdvsPageLayout from "@/layouts/PdvsPageLayout"
import HourlyRevenueChart from "@/components/FatpHora";
import PdvHistoryLog from "@/components/MovHistpPdv";

export default function PdvsPage() {
  return (
    <PdvsPageLayout
    HoldPrincipal={<HourlyRevenueChart/>}
    HistoricoVendas={<PdvHistoryLog/>}
    />
  );
}