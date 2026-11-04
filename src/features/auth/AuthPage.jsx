import { useState } from "react";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";
import DotGrid from "../../components/ui/DotGrid.jsx";
import { FlowButton } from "../../components/ui/FlowButton.jsx";
import { useAppContext } from "../../shared/context/AppContext.jsx";
import "./auth-page.css";

function FormField({ id, label, icon: Icon, children, onPointerMove }) {
  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <div className="auth-input-wrap" onPointerMove={onPointerMove}>
        <Icon size={17} aria-hidden="true" />
        {children}
      </div>
    </div>
  );
}

export function AuthPage({ onClose }) {
  const { login, register } = useAppContext();
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const moveSpotlight = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--spot-x", `${event.clientX - bounds.left}px`);
    event.currentTarget.style.setProperty("--spot-y", `${event.clientY - bounds.top}px`);
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError("");
    setSuccess(false);
    setSuccessMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") await login(email.trim(), password);
      else await register({ name: name.trim(), email: email.trim(), password });
      setSuccessMessage(mode === "login" ? "Signed in. Taking you to your dashboard…" : "Account created. Taking you to your dashboard…");
      setSuccess(true);
      window.setTimeout(onClose, 650);
    } catch (authError) {
      setError(authError.message || "We couldn’t verify those details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-page-grid" aria-hidden="true">
        <DotGrid
          baseColor="#365e6e"
          activeColor="#a8e7ff"
          shape="circle"
          dotSize={3.5}
          gap={22}
          proximity={135}
          strength={0.9}
          bounce={0.55}
          tension={0.35}
          returnDuration={0.85}
          shockRadius={300}
          shockStrength={4}
          swell={0.7}
          stretch={0.45}
          glow={0.55}
          fade={0}
          opacity={0.82}
          ignoreSelector=".auth-card"
          intro
        />
      </div>
      <div className="auth-page-vignette" aria-hidden="true" />

      <header className="auth-page-header">
        <button className="auth-brand" onClick={onClose} type="button" aria-label="Return to DevRhythm">
          <span className="auth-brand-mark"><Activity size={19} aria-hidden="true" /></span>
          <span>DevRhythm</span>
        </button>
        <FlowButton text="Back to dashboard" onClick={onClose} className="auth-back-flow" />
      </header>

      <section className="auth-content" aria-labelledby="auth-title">
        <div className="auth-card">
          <div className="auth-card-heading">
            <div className="auth-card-mark"><Activity size={19} aria-hidden="true" /></div>
            <div>
              <h2 id="auth-title">{mode === "login" ? "Welcome back" : "Create your account"}</h2>
              <p>{mode === "login" ? "Sign in to pick up where you left off." : "One account for your developer journey."}</p>
            </div>
          </div>

          <div className="auth-mode-switch" role="tablist" aria-label="Account access">
            <button
              className={mode === "login" ? "is-active" : ""}
              id="auth-login-tab"
              onClick={() => switchMode("login")}
              role="tab"
              aria-selected={mode === "login"}
              type="button"
            >
              Sign in
            </button>
            <button
              className={mode === "register" ? "is-active" : ""}
              id="auth-register-tab"
              onClick={() => switchMode("register")}
              role="tab"
              aria-selected={mode === "register"}
              type="button"
            >
              Create account
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {error && <div className="auth-feedback is-error" role="alert">{error}</div>}
            {success && (
              <div className="auth-feedback is-success" role="status">
                <CheckCircle2 size={17} aria-hidden="true" /> {successMessage}
              </div>
            )}

            {mode === "register" && (
              <FormField id="auth-name" label="Full name" icon={UserRound} onPointerMove={moveSpotlight}>
                <input
                  id="auth-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Your name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </FormField>
            )}

            <FormField id="auth-email" label="Email address" icon={Mail} onPointerMove={moveSpotlight}>
              <input
                id="auth-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </FormField>

            <FormField id="auth-password" label="Password" icon={LockKeyhole} onPointerMove={moveSpotlight}>
              <input
                id="auth-password"
                name="password"
                type={passwordVisible ? "text" : "password"}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                placeholder="At least 6 characters"
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button
                className="auth-password-toggle"
                type="button"
                onClick={() => setPasswordVisible((visible) => !visible)}
                aria-label={passwordVisible ? "Hide password" : "Show password"}
              >
                {passwordVisible ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </FormField>

            <button className="auth-submit" type="submit" disabled={loading || success}>
              {loading ? <LoaderCircle size={17} className="auth-spinner" /> : null}
              <span>{loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</span>
              {!loading && <ArrowRight size={17} aria-hidden="true" />}
              <span className="auth-submit-glow" aria-hidden="true" />
            </button>
          </form>

          <p className="auth-terms">
            {mode === "login" ? "New to DevRhythm?" : "Already have an account?"}{" "}
            <button type="button" onClick={() => switchMode(mode === "login" ? "register" : "login")}>
              {mode === "login" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </div>
      </section>
      <footer className="auth-page-footer">Built for the work you put in every day.</footer>
    </main>
  );
}
