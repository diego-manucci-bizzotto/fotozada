import { BrowserRouter, Route, Routes } from "react-router-dom";
import Kiosk from "./routes/Kiosk";
import Admin from "./routes/Admin";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Kiosk />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}
