import { Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "../features/auth/pages";
import { DashboardPage } from "../features/dashboard/pages";
import { LandingPage } from "../features/marketing/pages";
import { InstallGuidePage } from "../features/docs/pages/InstallGuidePage";
import {
  ProjectDetailPage,
  ProjectListPage,
  ProjectUploadPage,
  SuggestionsPage,
} from "../features/projects/pages";
import { MainLayout } from "./layouts/MainLayout";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/docs" element={<InstallGuidePage />} />

      <Route element={<MainLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/projects" element={<ProjectListPage />} />
        <Route path="/projects/detail" element={<ProjectDetailPage />} />
        <Route path="/upload" element={<ProjectUploadPage />} />
        <Route path="/suggestions" element={<SuggestionsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
