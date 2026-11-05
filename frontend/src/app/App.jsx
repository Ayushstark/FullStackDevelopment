import {
  Activity,
  BriefcaseBusiness,
  CalendarDays,
  LayoutDashboard,
} from "lucide-react";
import { CareerPage } from "../features/career";
import { CalendarPage } from "../features/calendar";
import { DashboardPage } from "../features/dashboard";
import { GrowthPage } from "../features/growth";
import { AuthPage } from "../features/auth";
import { ProfilePage } from "../features/profile";
import { NotFoundPage } from "../features/notfound";
import { AppShell } from "../shared/components/AppShell.jsx";
import { useEffect, useState } from "react";
import { AppProvider, useAppContext } from "../shared/context/AppContext.jsx";
import { PageSkeleton } from "../shared/components/PageSkeleton.jsx";
import { ErrorBoundary } from "../shared/components/ErrorBoundary.jsx";

function AppContent() {
  const {
    activePage,
    setActivePage,
    applications,
    growthStats,
    closeAuthPage,
  } = useAppContext();

  const [isTransitioning, setIsTransitioning] = useState(false);

  // Trigger smooth skeleton shimmer on tab transitions
  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 280);
    return () => clearTimeout(timer);
  }, [activePage]);

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
  ];

  if (activePage === "auth") {
    return <AuthPage onClose={closeAuthPage} />;
  }

  // Standalone 404 Page (no header or shell navigation)
  const knownPages = ["overview", "career", "opportunities", "applications", "growth", "calendar", "profile"];
  if (!knownPages.includes(activePage)) {
    return <NotFoundPage />;
  }

  const renderActivePage = () => {
    if (isTransitioning) {
      return (
        <main className="page-content">
          <PageSkeleton type={activePage} />
        </main>
      );
    }

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
      case "profile":
        return <ProfilePage />;
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
      <ErrorBoundary onGoHome={() => setActivePage("overview")}>
        {renderActivePage()}
      </ErrorBoundary>
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
