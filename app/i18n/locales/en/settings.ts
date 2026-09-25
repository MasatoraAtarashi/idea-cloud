import type { Dictionary } from "../../dictionary";

export const settings: Dictionary["settings"] = {
  metaTitle: "Settings — Idea Cloud",
  title: "Settings",

  groups: {
    workspace: "Workspace",
    personal: "Personal",
  },
  sections: {
    members: "Members and access",
    general: "General",
    team: "Team",
    stages: "Stages and labels",
    profile: "Profile",
    notify: "Notifications and reminders",
    shortcuts: "Shortcuts",
  },
  stub: "Nothing here yet.",

  language: {
    title: "Language",
    description: "Change the language of the interface.",
  },

  members: {
    description: "Who can read and edit an idea is decided per team.",
    invite: "Invite member",
    inviteDisabled: "Not wired up",
    columns: {
      member: "Member",
      role: "Role",
      lastSeen: "Last seen",
    },
    roles: {
      owner: "Admin",
      member: "Member",
    },
    online: "Signed in",
    visibility: {
      heading: "Default visibility",
      team: { title: "Whole team", body: "Everyone on the team can read and edit" },
      author: { title: "Author only", body: "Visible to you until you share it" },
      workspace: { title: "Whole workspace", body: "Readable across every team" },
      note: "Display only. Nothing is saved yet.",
    },
  },

  profile: {
    account: "Signed-in Google account",
    unknown: "Unknown",
    note: "Your name and picture follow your Google settings. Payment is handled on Stripe.",
  },

  billing: {
    plan: "Plan",
    premium: "Premium (AI included)",
    free: "Free (no AI)",
    comped: "Granted by an admin, so there is nothing to pay.",
    canceledPrefix: "Available until",
    renewsPrefix: "Renews",
    pastDueSuffix: " (retrying payment)",
    upgrade: "Go premium",
    manage: "Payment and cancellation",
  },

  dateLocale: "en-US",
};
