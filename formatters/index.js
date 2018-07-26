import { NOT_SET, FIELDS } from "../dialog/constants";
import slackDiff from "./slackDiff";

export const displayAudience = (audience, audience2) =>
  audience && audience2 ? [audience, audience2].join(", ") : audience || audience2;

export const formatValue = (field, value) => {
  if (!value) return NOT_SET;
  if (value === NOT_SET) return NOT_SET;

  if (FIELDS.isUserField(field)) {
    return value.startsWith("<@") ? value : `<@${value}>`;
  }

  return value;
};

// TODO: For now
export const displayUser = user => formatValue(FIELDS.USER, user);

export const displayReaders = (reader, reader2) => {
  // TODO: This doesn't handle case where we have reader2 but not reader
  if (reader === NOT_SET) return NOT_SET;
  let readers = "";

  readers += reader ? displayUser(reader) : "";
  readers += reader && reader2 ? ", " : "";
  readers += reader2 ? displayUser(reader2) : "";

  return readers;
};

export const display = (field, val1, val2) => {
  if (field === FIELDS.READER) return displayReaders(val1, val2);
  if (field === FIELDS.AUDIENCE) return displayAudience(val1, val2);
  if (FIELDS.isUserField(field)) return displayUser(val1);
  return val1;
};

export const whatChanged = (field, oldValue, newValue1, newValue2) => {
  if (!oldValue) return "";

  let text = `*${FIELDS.toDisplay(field, true)}* `;

  if (field === FIELDS.LANGUAGE) {
    return text + `to \n> ${slackDiff(oldValue === NOT_SET ? newValue1 : oldValue, newValue1)}\n`;
  }

  if (oldValue === NOT_SET) {
    return text + "to " + display(field, newValue1, newValue2) + "\n";
  }

  return text + `from ~${display(field, oldValue)}~ to ${display(field, newValue1, newValue2)}\n`;
};
