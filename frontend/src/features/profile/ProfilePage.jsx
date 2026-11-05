import {
  Camera,
  Check,
  Code2,
  ExternalLink,
  GitBranch,
  LoaderCircle,
  LogOut,
  Save,
  UserRound,
} from "lucide-react";
import { useRef, useState } from "react";
import { useAppContext } from "../../shared/context/AppContext.jsx";
import "./profile-page.css";

const platforms = [
  {
    key: "leetcode",
    label: "LeetCode",
    monogram: "LC",
    url: (handle) => `https://leetcode.com/u/${encodeURIComponent(handle)}/`,
  },
  {
    key: "codeforces",
    label: "Codeforces",
    monogram: "CF",
    url: (handle) => `https://codeforces.com/profile/${encodeURIComponent(handle)}`,
  },
  {
    key: "codechef",
    label: "CodeChef",
    monogram: "CC",
    url: (handle) => `https://www.codechef.com/users/${encodeURIComponent(handle)}`,
  },
  {
    key: "geeksforgeeks",
    label: "GeeksforGeeks",
    monogram: "GFG",
    url: (handle) => `https://www.geeksforgeeks.org/user/${encodeURIComponent(handle)}/`,
  },
  {
    key: "github",
    label: "GitHub",
    monogram: "GH",
    url: (handle) => `https://github.com/${encodeURIComponent(handle)}`,
  },
];

const MAX_AVATAR_FILE_SIZE = 8 * 1024 * 1024;
const MAX_AVATAR_SIZE = 170 * 1024;

function readAsDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Could not read the processed image."));
    };
    reader.onerror = () => reject(new Error("Could not read the processed image."));
    reader.readAsDataURL(blob);
  });
}

function createAvatarImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = async () => {
      URL.revokeObjectURL(objectUrl);
      try {
        const sourceSize = Math.min(image.naturalWidth, image.naturalHeight);
        const sourceX = (image.naturalWidth - sourceSize) / 2;
        const sourceY = (image.naturalHeight - sourceSize) / 2;

        for (const size of [360, 280, 220]) {
          const canvas = document.createElement("canvas");
          canvas.width = size;
          canvas.height = size;
          const context = canvas.getContext("2d");
          if (!context) throw new Error("Your browser could not process this image.");

          context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, size, size);
          for (const quality of [0.86, 0.72, 0.58]) {
            const blob = await new Promise((resolveBlob) => {
              canvas.toBlob(resolveBlob, "image/jpeg", quality);
            });
            if (blob && blob.size <= MAX_AVATAR_SIZE) {
              resolve(await readAsDataUrl(blob));
              return;
            }
          }
        }
        reject(new Error("This image could not be reduced below 170 KB. Try a smaller image."));
      } catch (error) {
        reject(error);
      }
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Choose a valid image file."));
    };
    image.src = objectUrl;
  });
}

export function ProfilePage() {
  const { profile, updateProfile, user, logout } = useAppContext();
  const fileInputRef = useRef(null);
  const [name, setName] = useState(profile.name || "");
  const [profileImage, setProfileImage] = useState(profile.profileImage || "");
  const [handles, setHandles] = useState(() => ({
    leetcode: profile.platformHandles?.leetcode || "",
    codeforces: profile.platformHandles?.codeforces || "",
    codechef: profile.platformHandles?.codechef || "",
    geeksforgeeks: profile.platformHandles?.geeksforgeeks || profile.platformHandles?.gfg || "",
    github: profile.platformHandles?.github || "",
  }));
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const savedHandles = profile.platformHandles || {};
  const isDirty = name.trim() !== (profile.name || "")
    || profileImage !== (profile.profileImage || "")
    || platforms.some(({ key }) => {
      const savedHandle = key === "geeksforgeeks"
        ? savedHandles.geeksforgeeks || savedHandles.gfg || ""
        : savedHandles[key] || "";
      return handles[key].trim() !== savedHandle;
    });

  const handleImageChange = async (event) => {
    const [file] = event.target.files || [];
    event.target.value = "";
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setFeedback({ type: "error", text: "Choose a JPG, PNG, or WebP image." });
      return;
    }
    if (file.size > MAX_AVATAR_FILE_SIZE) {
      setFeedback({ type: "error", text: "Choose an image smaller than 8 MB." });
      return;
    }

    try {
      const avatar = await createAvatarImage(file);
      setProfileImage(avatar);
      setFeedback(null);
    } catch (error) {
      setFeedback({ type: "error", text: error.message });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setFeedback(null);
    try {
      await updateProfile({
        name: name.trim(),
        profileImage,
        platformHandles: {
          ...handles,
          gfg: handles.geeksforgeeks,
        },
      });
      setFeedback({ type: "success", text: "Your profile has been saved." });
    } catch (error) {
      setFeedback({
        type: "error",
        text: error.message || "We couldn't save your profile. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="page-content profile-page">
      <form className="profile-edit-form" onSubmit={handleSubmit}>
        <section className="profile-identity-card" aria-label="Profile photo and account">
          <div className="profile-identity-avatar">
            {profileImage ? (
              <img src={profileImage} alt="Your profile" />
            ) : (
              <UserRound size={36} strokeWidth={1.5} aria-hidden="true" />
            )}
            <button
              className="profile-photo-button"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label={profileImage ? "Change profile photo" : "Add profile photo"}
            >
              <Camera size={16} aria-hidden="true" />
            </button>
            <input
              ref={fileInputRef}
              className="profile-file-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              aria-label="Upload a profile photo"
            />
          </div>
          <div className="profile-identity-copy">
            <p className="profile-identity-label">DEVELOPER PROFILE</p>
            <h2>{name.trim() || "Your name"}</h2>
            <p>{profile.email || "Add your name and connect your accounts below."}</p>
          </div>
          <div className="profile-photo-actions">
            <button
              className="profile-photo-action"
              type="button"
              onClick={() => fileInputRef.current?.click()}
            >
              Change photo
            </button>
            {profileImage && (
              <button
                className="profile-photo-action profile-photo-remove"
                type="button"
                onClick={() => {
                  setProfileImage("");
                  setFeedback(null);
                }}
              >
                Remove
              </button>
            )}
            <span>JPG, PNG or WebP · up to 8 MB</span>
          </div>
        </section>

        <div className="profile-edit-grid">
          <section className="profile-panel profile-name-panel">
            <div className="profile-panel-heading">
              <div className="profile-panel-icon"><UserRound size={18} /></div>
              <div>
                <p className="eyebrow">THE PERSON BEHIND THE PRACTICE</p>
                <h2>Personal details</h2>
              </div>
            </div>
            <label className="profile-field" htmlFor="profile-name">
              <span>Full name</span>
              <input
                id="profile-name"
                className="form-input"
                autoComplete="name"
                maxLength={80}
                required
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setFeedback(null);
                }}
                placeholder="Your name"
              />
            </label>
            <div className="profile-email-field">
              <span>Email address</span>
              <strong>{profile.email || "Not signed in"}</strong>
              <small>Your email is tied to your account and can’t be changed here.</small>
            </div>
          </section>

          <section className="profile-panel profile-platforms-panel">
            <div className="profile-panel-heading profile-platform-heading">
              <div className="profile-panel-icon"><Code2 size={18} /></div>
              <div>
                <p className="eyebrow">ONE PRACTICE, FIVE PLATFORMS</p>
                <h2>Coding accounts</h2>
                <p className="profile-panel-description">
                  Add the usernames you use to practice. Leave a field blank to unlink it.
                </p>
              </div>
            </div>

            <div className="profile-platform-grid">
              {platforms.map(({ key, label, monogram, url }) => (
                <label className="profile-platform-field" htmlFor={`handle-${key}`} key={key}>
                  <span className={`profile-platform-mark profile-platform-mark-${key}`}>
                    {key === "github" ? <GitBranch size={17} aria-hidden="true" /> : monogram}
                  </span>
                  <span className="profile-platform-input-wrap">
                    <span className="profile-platform-label">{label}</span>
                    <input
                      id={`handle-${key}`}
                      className="form-input"
                      autoComplete="off"
                      maxLength={80}
                      value={handles[key]}
                      onChange={(event) => {
                        setHandles((previous) => ({ ...previous, [key]: event.target.value }));
                        setFeedback(null);
                      }}
                      placeholder={`${label} username`}
                    />
                  </span>
                  {handles[key].trim() && (
                    <a
                      className="profile-platform-link"
                      href={url(handles[key].trim())}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Open ${label} profile in a new tab`}
                    >
                      <ExternalLink size={15} aria-hidden="true" />
                    </a>
                  )}
                </label>
              ))}
            </div>
          </section>
        </div>

        <footer className="profile-save-row">
          <div className={`profile-save-feedback ${feedback ? `is-${feedback.type}` : ""}`} role="status" aria-live="polite">
            {feedback?.type === "success" && <Check size={16} aria-hidden="true" />}
            {feedback?.text}
          </div>
          <div className="profile-actions">
            {user && (
              <button className="button button-secondary profile-logout-button" onClick={logout} type="button">
                <LogOut size={16} aria-hidden="true" />
                Log out
              </button>
            )}
            {isDirty && (
              <button className="button button-primary profile-save-button" type="submit" disabled={isSaving}>
                {isSaving ? <LoaderCircle className="profile-save-spinner" size={16} /> : <Save size={16} />}
                {isSaving ? "Saving profile..." : "Save profile"}
              </button>
            )}
          </div>
        </footer>
      </form>
    </main>
  );
}
