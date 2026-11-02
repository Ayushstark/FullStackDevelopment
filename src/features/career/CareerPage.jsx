import {
  Briefcase,
  FileText,
  Search,
} from "lucide-react";
import { useState } from "react";
import { ApplicationsPage } from "../applications/ApplicationsPage.jsx";
import { OpportunityPage } from "../opportunities/OpportunityPage.jsx";

export function CareerPage({ defaultTab = "applications" }) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <div className="career-page-wrapper">
      {/* Top Header & Tab Switcher */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          padding: "20px 24px 0 24px",
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        <div>
          <p className="eyebrow">Career Pipeline & Opportunities</p>
          <h1 style={{ margin: "4px 0 0 0", fontSize: 24, color: "var(--color-text-title)" }}>
            Career Management
          </h1>
        </div>

        <div className="tab-bar" style={{ margin: 0, paddingBottom: 0, borderBottom: "none" }}>
          <button
            className={`tab-btn ${activeTab === "applications" ? "active" : ""}`}
            onClick={() => setActiveTab("applications")}
            type="button"
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <FileText size={15} /> Applications Pipeline
          </button>
          <button
            className={`tab-btn ${activeTab === "opportunities" ? "active" : ""}`}
            onClick={() => setActiveTab("opportunities")}
            type="button"
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <Search size={15} /> Explore Roles & Internships
          </button>
        </div>
      </div>

      {/* Render active sub-view */}
      <div>
        {activeTab === "applications" ? (
          <ApplicationsPage />
        ) : (
          <OpportunityPage />
        )}
      </div>
    </div>
  );
}
