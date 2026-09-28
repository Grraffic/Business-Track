import { businesses } from "../logic/ledger.js";

export function getPageFromPath(pathname) {
  if (pathname === "/app" || pathname === "/app/") return "overview";
  if (pathname === "/app/report" || pathname === "/app/report/") {
    return "report";
  }
  if (pathname === "/app/sales" || pathname === "/app/sales/") {
    return "sales";
  }
  if (pathname === "/app/admin" || pathname === "/app/admin/") {
    return "admin";
  }
  if (pathname === "/app/inventory") return "inventory";
  const businessId = pathname.match(/^\/app\/business\/([^/]+)\/?$/)?.[1];
  return businesses.some(({ id }) => id === businessId) ? businessId : null;
}
