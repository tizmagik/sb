import { ALERT_PREFIX, NOT_SET } from "../dialog/constants";
import { displayUser } from "../formatters";
import extract from "./extract";

export const updateSlug = (slugOrUrl, msg) => {
  let text = ALERT_PREFIX;
  const oldSlug = extract("slug", msg);

  text += slugOrUrl.startsWith("http") ? slugOrUrl : "`" + slugOrUrl + "`";
  msg.text = text;

  return slugOrUrl !== oldSlug && oldSlug; // return old value, if the value differs
};

// Which fields should get the username treatment?
const USERNAME_FIELD_TYPES = ["desk", "owner", "sender", "reader", "reader2"];

/**
 * Formats @usernames for fields that should hyperlink users
 *
 * @param {string} field
 * @param {string} value
 */
const formatValue = (field, value) => {
  if (!value) return NOT_SET;
  if (value === NOT_SET) return value;

  if (USERNAME_FIELD_TYPES.indexOf(field) !== -1) {
    return displayUser(value);
  }

  return value;
};

/**
 * Unformats <@usernames> for populating dialogs
 *
 * @param {string} field
 * @param {string} value
 */
export const unformatValue = (field, value) => {
  if (!value) return value;
  if (USERNAME_FIELD_TYPES.indexOf(field) !== -1) {
    return value.replace(/\<\@/g, "").replace(/\>/g, "");
  }

  return value;
};

export const updateField = (field, value, msg) => {
  if (field === "slug") return updateSlug(value, msg);

  let i = -1;

  msg.attachments[0].fields.forEach((f, idx) => {
    const title = f.title.split(" ")[0].toLowerCase();
    if (field === title) {
      i = idx;
    }
  });

  if (i === -1) {
    print(msg.attachments[0].fields);
    console.error(`Couldn't find ${field}`);
    return;
  }

  const foundField = msg.attachments[0].fields[i];

  const old = foundField.value;
  const newValue = formatValue(field, value);

  msg.attachments[0].fields[i] = {
    ...foundField,
    value: newValue
  };

  return old !== newValue && old;
};
