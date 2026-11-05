import { Activity, LogOut, UserRound } from "lucide-react";
import { FlowButton } from "../../components/ui/FlowButton.jsx";
import { useAppContext } from "../context/AppContext.jsx";

export function AppShell({ navigation, activePage, onNavigate, children }) {
  const {
    profile,
    user,
    logout,
    openAuthPage,
  } = useAppContext();

  const initials = profile.name
    ? profile.name
        .split(" ")
        .map((name) => name[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "OP";

  return (
    <div className="app-shell">
      <header className="site-nav-shell">
        <button className="site-brand" onClick={() => onNavigate("overview")} type="button" aria-label="DevRhythm home">
          <span className="brand-mark"><Activity size={18} aria-hidden="true" /></span>
          <span>DevRhythm</span>
        </button>

        <nav className="site-nav-main" aria-label="Main navigation">
          {navigation.map(({ id, label, icon: Icon, badge }) => {
            const isCurrent = (activePage === "opportunities" || activePage === "applications" ? "career" : activePage) === id;
            return (
              <button
                key={id}
                type="button"
                className={`site-nav-link ${isCurrent ? "is-current" : ""}`}
                aria-current={isCurrent ? "page" : undefined}
                onClick={() => onNavigate(id)}
              >
                <Icon size={14} aria-hidden="true" />
                <span>{label}</span>
                {badge !== undefined && <small>{badge}</small>}
              </button>
            );
          })}
        </nav>

        <div className="site-nav-auth">
          {user ? (
            <div className="user-profile-badge">
              <button
                className="user-profile-info"
                onClick={() => onNavigate("settings")}
                title="Go to settings"
                type="button"
              >
                <span className="avatar">{initials}</span>
                <span className="avatar-meta">
                  <strong>{user.name || profile.name}</strong>
                  <span>{user.email || profile.email}</span>
                </span>
              </button>
              <button className="icon-btn-ghost" onClick={logout} title="Log out" type="button">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <FlowButton text="Sign In / Register" icon={UserRound} onClick={openAuthPage} className="nav-auth-flow" />
          )}
        </div>
      </header>

      <div className="main-area">
        <div className="runtime-strip" aria-label="Platform connection status">
          <span className="runtime-node">DEVRHYTHM // LIVE</span>
          <span className="runtime-status"><i aria-hidden="true" />{["leetcode", "codeforces", "codechef", "geeksforgeeks", "github"].filter((platform) => profile.platformHandles?.[platform]).length} PLATFORMS CONNECTED</span>
          <span className="runtime-detail">LOCAL SYNC · READY</span>
          <span className="runtime-detail runtime-user">{user?.name ? `SESSION: ${user.name.toUpperCase()}` : "SESSION: GUEST"}</span>
        </div>
        {children}
      </div>
    </div>
  );
}
