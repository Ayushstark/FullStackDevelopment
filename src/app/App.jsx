import {
  Activity,
  BriefcaseBusiness,
  CalendarDays,
  LayoutDashboard,
  Settings,
} from "lucide-react";
import { CareerPage } from "../features/career/CareerPage.jsx";
import { CalendarPage } from "../features/calendar/CalendarPage.jsx";
import { DashboardPage } from "../features/dashboard/DashboardPage.jsx";
import { GrowthPage } from "../features/growth/GrowthPage.jsx";
import { SettingsPage } from "../features/settings/SettingsPage.jsx";
import { AppShell } from "../shared/components/AppShell.jsx";
import { AppProvider, useAppContext } from "../shared/context/AppContext.jsx";

function AppContent() {
  const {
    activePage,
    setActivePage,
    applications,
    growthStats,
  } = useAppContext();

  const navigation = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    {
      id: "growth",
      label: "Streak & Practice",
      icon: Activity,
      badge: growthStats.streakAtRisk ? "At Risk" : undefined,
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

