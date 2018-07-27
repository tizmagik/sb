import { titleCase } from "change-case";

export const IDX = {
  ALERT: 0,
  FIELDS: 1,
  ACTIONS: 2
};

export const STATES = {
  // these can be #HEX colors
  INITIAL: "danger",
  APPROVED: "warning",
  SENT: "good"
};

export const ACTIONS = {
  APPROVE: "approve",
  EDIT: "edit",
  PEOPLE: "people",
  SENT: "sent"
};

export const ALERT_PREFIX = ":rotating_light: Alert for ";
export const NOT_SET = "_(none yet)_";
export const READY_TO_SEND = "_🏁 Ready to send!_";

export const USER = "user"; // this is for formatting purposes when talking to user directly
export const SLUG = "slug";
export const LANGUAGE = "language";
export const DESK = "desk";
export const AUDIENCE = "audience";
export const AUDIENCE2 = "audience2";
export const OWNER = "owner";
export const READER = "reader";
export const READER2 = "reader2";
export const SENDER = "sender";
export const APPROVALS = "approvals";

// Which fields should get the username treatment?
const USERNAME_FIELD_TYPES = [USER, DESK, OWNER, SENDER, READER, READER2, APPROVALS];

const toDisplay = (field, plural = false) => {
  const Field = titleCase(field);

  if (plural) {
    if (field === READER || field === AUDIENCE) return Field + "s";
  }

  // for READER2 or AUDIENCE2
  if (field.indexOf("2") !== -1) {
    return "Secondary " + field.replace(/2$/, "");
  }

  if (field === READER) return "Primary " + Field;
  if (field === DESK) return Field + " Editor";
  if (field === OWNER) return "News Desk " + Field;

  return Field;
};

const isUserField = field => USERNAME_FIELD_TYPES.indexOf(field) !== -1;

export const FIELDS = {
  USER,
  SLUG,
  LANGUAGE,
  DESK,
  AUDIENCE,
  AUDIENCE2,
  OWNER,
  READER,
  READER2,
  SENDER,
  APPROVALS,

  // methods
  toDisplay,
  isUserField
};
