import { BrowserRouter, Route, Routes } from "react-router-dom";
import { TotemPage } from "@/features/print/totem-page";
import { AdminPage } from "@/features/admin/admin-page";
import { ArraialPage } from "@/features/arraial/arraial-page";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TotemPage />} />
        <Route path="/arraia" element={<ArraialPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  );
}
