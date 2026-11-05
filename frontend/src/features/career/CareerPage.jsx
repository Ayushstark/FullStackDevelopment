import {
  Briefcase,
} from "lucide-react";
import { ApplicationsPage } from "../applications/ApplicationsPage.jsx";

export function CareerPage() {
  return (
    <div className="career-page-wrapper">
      <div className="career-toolbar">
        <span className="career-toolbar-label"><Briefcase size={14} /> CAREER SPACE</span>
      </div>
      <ApplicationsPage />
    </div>
  );
}
