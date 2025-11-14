import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { BusDashboard } from "./pages/BusDashboard";
import { ManageRoute } from "./pages/ManageRoute";

export default function App() {
	return (
		<Layout>
			<Routes>
				<Route path="/" element={<Navigate to="/busDashboard" replace />} />
				<Route path="/busDashboard" element={<BusDashboard />} />
				<Route path="/manageRoute" element={<ManageRoute />} />
				<Route path="*" element={<Navigate to="/busDashboard" replace />} />
			</Routes>
		</Layout>
	);
}
