import { AuthProvider } from "./contexts/authContext";
import { useRoutes } from "react-router-dom";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ReportSummary from "./pages/ReportSummary.jsx";
// TODO: Re-add this import when implementing .docx template generation:
// import ReportDownload from "./pages/ReportDownload.jsx";
import ErrorBoundary from "./components/auth/ErrorBoundary.jsx";
import "./index.css";

function App() {
  const routesArray = [
    {
      path: "*",
      element: <LandingPage />,
    },
    {
      path: "/login",
      element: <LoginPage />,
    },
    {
      path: "/register",
      element: <RegisterPage />,
    },
    {
      path: "/dashboard",
      element: <Dashboard />,
    },
    {
      path: "/report-summary",
      element: <ReportSummary />,
    },
  ];
  let routesElement = useRoutes(routesArray);
  return (
    <ErrorBoundary>
      <AuthProvider>
        <div className="w-full h-screen flex flex-col">{routesElement}</div>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
