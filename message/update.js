import { ALERT_PREFIX, FIELDS, IDX, STATES, NOT_SET, READY_TO_SEND } from "../dialog/constants";
import { formatValue } from "../formatters";
import extract from "./extract";

export const updateSlug = (slugOrUrl, msg) => {
  let text = ALERT_PREFIX;
  const oldSlug = extract("slug", msg);

  text += slugOrUrl.startsWith("http") ? slugOrUrl : "`" + slugOrUrl + "`";
  msg.attachments[IDX.ALERT].text = text;

  return slugOrUrl !== oldSlug && oldSlug; // return old value, if the value differs
};

/**
 * Unformats <@usernames> for populating dialogs
 *
 * @param {string} field
 * @param {string} value
 */
export const unformatValue = (field, value) => {
  if (!value) return value;
  if (FIELDS.isUserField(field)) {
    return value.replace(/\<\@/g, "").replace(/\>/g, "");
  }

  return value;
};

const updateApprovals = (value, msg) => {
  const field = msg.attachments[IDX.FIELDS].fields.find(f => f.title.toLowerCase() === "approvals");

  const approvals = extract("approvals", msg);

  if (approvals.indexOf(value) === -1) {
    // not already in list
    field.value = approvals
      .concat(value)
      .map(v => formatValue("approvals", v))
      .join(", ");
    return true;
  }

  // already in approval list, no reason to do anything
  return false;
};

/**
 * Finds and returns the index of the requested field
 *
 * @param {FIELDS enum} field The field to find
 * @param {SLACK object} msg The Slack message object
 * @returns {int} Index of the found field, or -1 if not found
 */
const findField = (field, msg) => {
  let i = -1;

  msg.attachments[IDX.FIELDS].fields.forEach((f, idx) => {
    const title = f.title.split(" ")[0].toLowerCase(); // TODO: will need a "fromDisplay()"
    if (field === title) {
      i = idx;
    }
  });

  if (i === -1) {
    console.error(`Couldn't find ${field}`);
  }

  return i;
};

export const updateField = (field, value, msg) => {
  if (field === "slug") return updateSlug(value, msg);
  if (field === "approvals") return updateApprovals(value, msg);

  let i = findField(field, msg);
  if (i === -1) return;

  const foundField = msg.attachments[IDX.FIELDS].fields[i];

  const old = foundField.value;
  const newValue = formatValue(field, value);

  msg.attachments[IDX.FIELDS].fields[i] = {
    ...foundField,
    value: newValue
  };

  return old !== newValue && old;
};

const getStatusText = msg => {
  let statusText = "";

  // get the desk, readers and approvals fields
  const desk = extract(FIELDS.DESK, msg);
  const readers = [extract(FIELDS.READER, msg), extract(FIELDS.READER2, msg)].filter(Boolean);
  const approvals = extract(FIELDS.APPROVALS, msg);
  const lang = extract(FIELDS.LANGUAGE, msg);

  const dispDesk = formatValue(FIELDS.DESK, desk);

  printw("🧠", { desk, readers, approvals, lang });

  if (desk === NOT_SET) {
    return `_Waiting on a *${FIELDS.toDisplay(FIELDS.DESK)}* to be assigned._`;
  }

  if (lang === NOT_SET) {
    return `_Waiting on ${dispDesk} to click ✏️ *Edit Alert* and propose language._`;
  }

  if (approvals[0] === NOT_SET) {
    // maybe equivalent conditional: if (approvals.indexOf(desk) === -1) {
    return `_Waiting on ${formatValue(
      FIELDS.DESK,
      desk
    )} to fact-check and ✅ *Approve* the language._`;
  }

  if (readers[0] === NOT_SET) {
    return `_Waiting on *Readers* to be assigned._`;
  }

  const reqApprovers = readers
    .concat(desk)
    .filter(p => p !== NOT_SET)
    .filter(r => approvals.indexOf(r) === -1);

  if (reqApprovers.length > 0) {
    return `_Waiting on ✅ *Approval${reqApprovers.length > 1 ? "s" : ""}* from ${reqApprovers
      .map(r => formatValue(FIELDS.USER, r))
      .join(", ")}_`;
  }

  return READY_TO_SEND;
};

/**
 * This will *mutate* msg to include the "Waiting for approvals from" text
 * as well as update the `color` property of the msg.
 *
 * @param {SLACK obj} msg The slack object
 */
export const updateStatus = msg => {
  msg.attachments[IDX.ACTIONS].text = getStatusText(msg) + "\n\n";
  // We set the color to "APPROVALS" state if we have at least 1 approval
  const color = extract(FIELDS.APPROVALS, msg)[0] === NOT_SET ? STATES.INITIAL : STATES.APPROVED;
  msg.attachments.forEach(a => {
    a.color = color;
  });
};

export const updateSent = (byUser, msg) => {
  const actions = msg.attachments[IDX.ACTIONS];

  Reflect.deleteProperty(actions, "actions");

  const now = new Date();
  const date = `<!date^${Math.floor(now / 1000)}^{date_short_pretty}|${now.toLocaleString()}>`;
  // const date = "<!date^1392734382^{date_short}^asdf>";

  actions.text = `🏁 Sent by ${formatValue(FIELDS.USER, byUser)}, ${date}`;
  msg.attachments.forEach(a => {
    a.color = STATES.SENT;
  });
};
