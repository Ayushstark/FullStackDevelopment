import { Activity, LogIn, LogOut, User } from "lucide-react";
import PillNav from "../../components/ui/PillNav.jsx";
import GridScan from "../../components/ui/GridScan.jsx";
import { useAppContext } from "../context/AppContext.jsx";
import { AuthModal } from "./AuthModal.jsx";

export function AppShell({ navigation, activePage, onNavigate, children }) {
  const {
    profile,
    user,
    logout,
    isAuthModalOpen,
    openAuthModal,
    closeAuthModal,
  } = useAppContext();

  const initials = profile.name
    ? profile.name
        .split(" ")
        .map((name) => name[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "OP";

  const items = navigation.map(({ id, label, icon: Icon, badge }) => ({
    href: id,
    label,
    icon: (
      <>
        {Icon && <Icon aria-hidden="true" />}
        {badge !== undefined && <span className="pill-nav-badge">{badge}</span>}
      </>
    ),
  }));

  function AppNavButton({ href, className, children: linkChildren, ...props }) {
    return (
      <button
        type="button"
        className={className}
        {...props}
        onClick={(event) => {
          props.onClick?.(event);
          if (href === "#brand") onNavigate("overview");
        }}
      >
        {linkChildren}
      </button>
    );
  }

  return (
    <div className="app-shell">
      <div className="app-background" aria-hidden="true">
        <GridScan
          linesColor="#7b8497"
          scanColor="#7dd3fc"
          cells={8}
          depth={3}
          scanDuration={2.4}
          scanDelay={1.6}
          clickEffect="ping"
        />
      </div>

      <header className="site-nav-shell">
        <button className="site-brand" onClick={() => onNavigate("overview")} type="button" aria-label="DevRhythm home">
          <span className="brand-mark"><Activity size={18} aria-hidden="true" /></span>
          <span>DevRhythm</span>
        </button>

        <div className="site-nav-main">
          <PillNav
            items={items}
            activeHref={activePage === "opportunities" || activePage === "applications" ? "career" : activePage}
            onItemClick={(item) => onNavigate(item.href)}
            linkComponent={AppNavButton}
            theme="dark"
            layout="split"
            itemStyle="plain"
            hoverEffect="fill"
            indicator="dot"
            surface="glass"
            size="md"
            highlightColor="#7dd3fc"
            highlightTextColor="#08202a"
            barColor="rgba(14, 19, 23, 0.76)"
            textColor="#aab8c0"
            collapse="auto"
            ariaLabel="Main navigation"
            className="site-pill-nav"
          />
        </div>

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
            <button className="button button-accent button-sm" onClick={openAuthModal} type="button">
              <LogIn size={15} /> Sign In / Register
            </button>
          )}
        </div>
      </header>

      <div className="main-area">{children}</div>

      <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} />
    </div>
  );
}
