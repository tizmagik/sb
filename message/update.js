export const updateSlug = (slugOrUrl, msg) => {
  let text = "🚨 Alert for ";

  if (slugOrUrl.startsWith("http")) {
    text += slugOrUrl;
  }

  text += "`" + slugOrUrl + "`";

  msg.text = text;

  return msg;
};

// Which fields should get the username treatment?
const USERNAME_FIELD_TYPES = ["desk", "owner", "sender", "readers"];

/**
 * Formats @usernames for fields that should hyperlink users
 *
 * @param {string} field
 * @param {string} value
 */
const formatValue = (field, value) => {
  if (!value) return "_(not set)_";

  if (USERNAME_FIELD_TYPES.indexOf(field) !== -1) {
    return `<@${value}>`;
  }

  return value;
};

export const updateField = (field, value, msg) => {
  let i = -1;

  msg.attachments[0].fields.forEach((f, idx) => {
    const title = f.title.split(" ")[0].toLowerCase();
    if (field === title) {
      i = idx;
    }
  });

  if (i === -1) {
    console.error(`Couldn't find ${field}`);
    return;
  }

  const foundField = msg.attachments[0].fields[i];

  msg.attachments[0].fields[i] = {
    ...foundField,
    value: formatValue(field, value)
  };

  return msg;
};
