import { getMongoStatus } from "../config/db.js";
import { Application } from "../models/Application.js";
import { fallbackStore } from "../store/fallbackStore.js";

const STATUSES = ["Saved", "Applied", "Interviewing", "Offer", "Rejected"];
const TEXT_FIELDS = ["role", "company", "location", "deadline", "notes", "sourceUrl"];

// Copies only the fields a client may set, and rejects wrong types or values.
function pickApplicationFields(body) {
  const fields = {};
  for (const key of TEXT_FIELDS) {
    if (body[key] === undefined) continue;
    if (typeof body[key] !== "string" || body[key].length > 2000) {
      return { error: `${key} must be a string of at most 2000 characters.` };
    }
    fields[key] = body[key].trim();
  }
  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) {
      return { error: `status must be one of: ${STATUSES.join(", ")}.` };
    }
    fields.status = body.status;
  }
  if (fields.sourceUrl && !/^https?:\/\//i.test(fields.sourceUrl)) {
    return { error: "sourceUrl must start with http:// or https://." };
  }
  return { fields };
}




export async function getApplications(req, res) {
  try {
    const userId = req.user?.id;
    let applications = [];

    if (getMongoStatus()) {
      applications = await Application.find({ userId }).sort({ createdAt: -1 });
    } else {
      applications = fallbackStore.getApplications(userId).filter((a) => a.userId === userId);
    }

    res.json({
      success: true,
      count: applications.length,
      applications,
    });
  } catch (err) {
    console.error("Fetch applications error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch applications." });
  }
}




export async function createApplication(req, res) {
  try {
    const userId = req.user.id;
    const { fields, error } = pickApplicationFields(req.body || {});
    if (error) {
      return res.status(400).json({ success: false, error });
    }
    if (!fields.role || !fields.company) {
      return res.status(400).json({ success: false, error: "Role and company are required." });
    }

    const { opportunityId, matchScore } = req.body || {};
    const payload = {
      userId,
      opportunityId: typeof opportunityId === "string" ? opportunityId : `manual-${Date.now()}`,
      role: fields.role,
      company: fields.company,
      location: fields.location || "Remote",
      status: fields.status || "Applied",
      appliedDate: new Date().toISOString().split("T")[0],
      deadline: fields.deadline || "Ongoing",
      notes: fields.notes || "",
      sourceUrl: fields.sourceUrl || "",
      matchScore: Math.min(100, Math.max(0, Number(matchScore) || 85)),
    };

    let newApp = null;
    if (getMongoStatus()) {
      newApp = await Application.create(payload);
    } else {
      newApp = fallbackStore.createApplication(payload);
    }

    res.status(201).json({
      success: true,
      application: newApp,
    });
  } catch (err) {
    console.error("Create application error:", err);
    res.status(500).json({ success: false, error: "Failed to create application." });
  }
}




export async function updateApplication(req, res) {
  try {
    const { id } = req.params;
    const { fields: updates, error } = pickApplicationFields(req.body || {});
    if (error) {
      return res.status(400).json({ success: false, error });
    }

    let updated = null;
    if (getMongoStatus()) {
      updated = await Application.findOneAndUpdate(
        { _id: id, userId: req.user.id },
        { $set: updates },
        { new: true },
      );
    } else {
      const owned = fallbackStore.getApplications(req.user.id).some(
        (a) => (a._id === id || a.id === id) && a.userId === req.user.id,
      );
      updated = owned ? fallbackStore.updateApplication(id, updates) : null;
    }

    if (!updated) {
      return res.status(404).json({ success: false, error: "Application not found." });
    }

    res.json({
      success: true,
      application: updated,
    });
  } catch (err) {
    console.error("Update application error:", err);
    res.status(500).json({ success: false, error: "Failed to update application." });
  }
}




export async function deleteApplication(req, res) {
  try {
    const { id } = req.params;

    let deleted = false;
    if (getMongoStatus()) {
      const resDel = await Application.findOneAndDelete({ _id: id, userId: req.user.id });
      deleted = !!resDel;
    } else {
      const owned = fallbackStore.getApplications(req.user.id).some(
        (a) => (a._id === id || a.id === id) && a.userId === req.user.id,
      );
      deleted = owned ? fallbackStore.deleteApplication(id) : false;
    }

    if (!deleted) {
      return res.status(404).json({ success: false, error: "Application not found or already deleted." });
    }

    res.json({
      success: true,
      message: "Application deleted successfully.",
    });
  } catch (err) {
    console.error("Delete application error:", err);
    res.status(500).json({ success: false, error: "Failed to delete application." });
  }
}

