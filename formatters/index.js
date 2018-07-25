import { NOT_SET } from "../dialog/constants";

export const displayAudience = (audience, audience2) =>
  audience && audience2 ? [audience, audience2].join(", ") : audience || audience2;

export const displayUser = user => (user.startsWith("<@") ? user : `<@${user}>`);

export const displayReaders = (reader, reader2) => {
  // TODO: This doesn't handle case where we have reader2 but not reader
  if (reader === NOT_SET) return NOT_SET;
  let readers = "";

  readers += reader ? displayUser(reader) : "";
  readers += reader && reader2 ? ", " : "";
  readers += reader2 ? displayUser(reader2) : "";

  return readers;
};
