import { BrowserRouter, Route, Routes } from "react-router-dom";
import { TotemPage } from "@/features/print/totem-page";
import { AdminPage } from "@/features/admin/admin-page";

// "/admin" exists but is intentionally NOT linked anywhere — reachable only by
// typing the URL.
export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TotemPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  );
}
