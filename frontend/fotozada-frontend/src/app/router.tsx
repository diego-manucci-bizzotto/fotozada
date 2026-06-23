import { BrowserRouter, Route, Routes } from "react-router-dom";
import { TotemPage } from "@/features/print/totem-page";
import { AdminPage } from "@/features/admin/admin-page";
import { ArraiáPage } from "@/features/arraiá/arraiá-page";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TotemPage />} />
        <Route path="/arraiá" element={<ArraiáPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  );
}
