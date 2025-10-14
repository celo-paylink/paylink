import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import "./index.css";
import App from "./App";
import AppProvider from "./components/app-provider";
import { AuthProvider } from "./context/auth-context";
import Navbar from "./components/navbar";
import LayoutGuard from "./components/auth-guard";
import { ToastContainer } from "react-toastify";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AppProvider>
        <AuthProvider>
          <Navbar />
          <LayoutGuard>
            <App />
          </LayoutGuard>
          <ToastContainer />
        </AuthProvider>
      </AppProvider>
    </BrowserRouter>
  </StrictMode>
);
