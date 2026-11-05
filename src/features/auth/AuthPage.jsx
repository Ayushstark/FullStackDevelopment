import { useState } from "react";
import {
  Activity,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";
import { useAppContext } from "../../shared/context/AppContext.jsx";
import developerWorkspacePhoto from "./assets/devrhythm-workspace.webp";
import "./auth-page.css";

function FormField({ id, label, icon: Icon, children }) {
  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <div className="auth-input-wrap">
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
      <div className="auth-page-atmosphere" aria-hidden="true" />

      <header className="auth-page-header">
        <button className="auth-brand" onClick={onClose} type="button" aria-label="Return to DevRhythm">
          <span className="auth-brand-mark"><Activity size={19} aria-hidden="true" /></span>
          <span>DevRhythm</span>
        </button>
        <button className="auth-back-button" onClick={onClose} type="button">Back to dashboard <span aria-hidden="true">↗</span></button>
      </header>

      <section className="auth-content" aria-labelledby="auth-title">
        <div className="auth-hero-column">
          <div className="auth-hero-copy">
            <span className="auth-form-eyebrow">{mode === "login" ? "YOUR DEVELOPER RHYTHM" : "A CLEARER VIEW OF YOUR PROGRESS"}</span>
            <h1>{mode === "login" ? "Welcome Back, Dev." : "Build Your Rhythm."}</h1>
            <p>Track your rhythm, analyze your workflow, and ship with confidence.</p>
          </div>
          <div className="auth-workspace-frame"><img src={developerWorkspacePhoto} alt="Developer working at a laptop" /></div>
          <p className="auth-hero-footer">Your developer journey, thoughtfully tracked.</p>
        </div>

        <div className="auth-card">
          <div className="auth-form-panel">
            <div className="auth-mode-switch" role="tablist" aria-label="Account access">
              <button type="button" role="tab" aria-selected={mode === "login"} className={mode === "login" ? "is-active" : ""} onClick={() => switchMode("login")}>Sign in</button>
              <button type="button" role="tab" aria-selected={mode === "register"} className={mode === "register" ? "is-active" : ""} onClick={() => switchMode("register")}>Create account</button>
            </div>
            <div className="auth-form-heading">
              <span className="auth-form-eyebrow">{mode === "login" ? "WELCOME BACK" : "GET STARTED"}</span>
              <h2 id="auth-title">{mode === "login" ? "Sign in" : "Create your account"}</h2>
              <p>{mode === "login" ? "Enter your details to continue." : "Create an account to start tracking your progress."}</p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
            {error && <div className="auth-feedback is-error" role="alert">{error}</div>}
            {success && (
              <div className="auth-feedback is-success" role="status">
                <CheckCircle2 size={17} aria-hidden="true" /> {successMessage}
              </div>
            )}

            {mode === "register" && (
              <FormField id="auth-name" label="Full name" icon={UserRound}>
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

            <FormField id="auth-email" label="Email address" icon={Mail}>
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

            <FormField id="auth-password" label="Password" icon={LockKeyhole}>
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

            <button className="auth-submit" type="submit" disabled={loading || success} aria-busy={loading}>
              {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
              <span aria-hidden="true">→</span>
            </button>
          </form>

          <p className="auth-terms">
            {mode === "login" ? "New to DevRhythm?" : "Already have an account?"}{" "}
            <button type="button" onClick={() => switchMode(mode === "login" ? "register" : "login")}>
              {mode === "login" ? "Create an account" : "Sign in"}
            </button>
          </p>
          </div>
        </div>
      </section>
    </main>
  );
}
