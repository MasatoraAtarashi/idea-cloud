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
    api: "API keys (MCP)",
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

  workspace: {
    label: "Workspace",
    members: {
      description: "Everyone in this workspace can read and edit its ideas and inspirations.",
      createInvite: "Create invite link",
      inviteLabel: "Invite link (valid {days} days; anyone signed in with Google can join)",
      joined: "Joined",
      self: " (you)",
      remove: "Remove",
      activeInvites: "Active invite links",
      inviteRow: "Joins as {role} · used {uses}/{max} · until {until}",
      revoke: "Revoke",
      inviteNote:
        "The link itself is not stored, so it cannot be shown again. Create a new one if needed.",
      leaveTitle: "Leave this workspace",
      leaveBody: "You will switch to another workspace. The last admin cannot leave.",
      leave: "Leave",
      leaveConfirm: "Leave this workspace?",
    },
    general: {
      name: "Workspace name",
      ownerOnly: "Only admins can rename the workspace.",
      saved: "Saved.",
      mine: "Your workspaces",
      current: "Current",
      switch: "Switch",
      createTitle: "Create a new workspace",
      createPlaceholder: "Team or project name",
      create: "Create",
    },
    api: {
      title: "API keys (MCP)",
      description:
        "The Authorization: Bearer value agents such as Cursor or Claude Desktop use to connect to /mcp. A key can only read and write this workspace.",
      ownerOnly: "Only admins can issue and manage keys.",
      namePlaceholder: "Purpose (e.g. Cursor)",
      nameLabel: "Key name",
      issue: "Issue",
      createdLabel: "Your new key. It is shown only now and cannot be recovered later.",
      none: "No keys yet.",
      lastUsed: "Last used {date}",
      unused: "Unused",
    },
    copy: "Copy",
    copied: "Copied",
    join: {
      metaTitle: "Join workspace — Idea Cloud",
      eyebrow: "Workspace invitation",
      cannot: "Cannot join",
      alreadyMember: "You are already a member. Opening it.",
      willJoin: "Joining lets you read and edit this workspace's ideas and inspirations.",
      open: "Open",
      join: "Join",
      status: {
        missing: "This invite link was not found.",
        expired: "This invite link has expired.",
        revoked: "This invite link was revoked.",
        exhausted: "This invite link has reached its use limit.",
      },
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
