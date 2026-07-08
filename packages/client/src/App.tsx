import { Route, Routes } from "react-router";
import Foundations from "./routes/foundations/Foundations";
import Dashboard from "./routes/dashboard/Dashboard";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/foundations" element={<Foundations />} />
    </Routes>
  );
}
