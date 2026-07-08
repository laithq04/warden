import { Navigate, Route, Routes } from "react-router";
import Foundations from "./routes/foundations/Foundations";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/foundations" replace />} />
      <Route path="/foundations" element={<Foundations />} />
    </Routes>
  );
}
