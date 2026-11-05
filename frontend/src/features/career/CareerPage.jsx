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
      {/* Compact switcher keeps the two career tools easy to find without repeating page titles. */}
      <div className="career-toolbar">
        <span className="career-toolbar-label"><Briefcase size={14} /> CAREER SPACE</span>
        <div className="tab-bar career-switcher" aria-label="Career tools">
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
