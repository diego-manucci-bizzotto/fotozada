import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AdminPage } from "@/features/admin/admin-page";
import { ArraialPage } from "@/features/arraial/arraial-page";
import { LandingPage } from "@/features/landing/landing-page";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/arraia" element={<ArraialPage />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  );
}
