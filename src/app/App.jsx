import {
  Activity,
  BriefcaseBusiness,
  CalendarDays,
  LayoutDashboard,
  Settings,
} from "lucide-react";
import { CareerPage } from "../features/career";
import { CalendarPage } from "../features/calendar";
import { DashboardPage } from "../features/dashboard";
import { GrowthPage } from "../features/growth";
import { AuthPage } from "../features/auth";
import { SettingsPage } from "../features/settings";
import { NotFoundPage } from "../features/notfound";
import { AppShell } from "../shared/components/AppShell.jsx";
import { AppProvider, useAppContext } from "../shared/context/AppContext.jsx";

function AppContent() {
  const {
    activePage,
    setActivePage,
    applications,
    growthStats,
    closeAuthPage,
  } = useAppContext();

  const navigation = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    {
      id: "growth",
      label: "Individual Analytics",
      icon: Activity,
      badge: growthStats?.streakBroken
        ? "Broken"
        : growthStats?.streakAtRisk
        ? "At Risk"
        : undefined,
    },
    { id: "calendar", label: "Contests & Events", icon: CalendarDays },
    {
      id: "career",
      label: "Career & Pipeline",
      icon: BriefcaseBusiness,
      badge: applications.length > 0 ? applications.length : undefined,
    },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  if (activePage === "auth") {
    return <AuthPage onClose={closeAuthPage} />;
  }

  // Standalone 404 Page (no header or shell navigation)
  const knownPages = ["overview", "career", "opportunities", "applications", "growth", "calendar", "settings"];
  if (!knownPages.includes(activePage)) {
    return <NotFoundPage />;
  }

  const renderActivePage = () => {
    switch (activePage) {
      case "career":
        return <CareerPage />;
      case "opportunities":
        return <CareerPage defaultTab="opportunities" />;
      case "applications":
        return <CareerPage defaultTab="applications" />;
      case "growth":
        return <GrowthPage />;
      case "calendar":
        return <CalendarPage />;
      case "settings":
        return <SettingsPage />;
      case "overview":
      default:
        return <DashboardPage />;
    }
  };

  return (
    <AppShell
      navigation={navigation}
      activePage={activePage}
      onNavigate={setActivePage}
    >
      {renderActivePage()}
    </AppShell>
  );
}

export function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

