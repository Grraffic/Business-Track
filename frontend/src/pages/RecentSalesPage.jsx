import RecentSalesList from "../components/RecentSalesList.jsx";
import { currency } from "../logic/ledger.js";

export default function RecentSalesPage({ sales }) {
  const income = sales.reduce((sum, sale) => sum + sale.amount, 0);

  return (
    <RecentSalesList
      allBusinesses
      sales={sales}
      subtitle={`${sales.length} sales · ${currency.format(income)} income`}
    />
  );
}
