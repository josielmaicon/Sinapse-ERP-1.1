import PdvsPageLayout from "@/layouts/PdvsPageLayout"
import HourlyRevenueChart from "@/components/FatpHora";

export default function PdvsPage() {
  return (
    <PdvsPageLayout
    HoldPrincipal={<HourlyRevenueChart/>}
    />
  );
}