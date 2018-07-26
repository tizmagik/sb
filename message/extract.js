/**
 * Extraction helpers to help extract values from original_message payloads
 *
 */
import { unformatValue } from "./update";
import { ALERT_PREFIX, NOT_SET, IDX } from "../dialog/constants";

const extractSlug = msg =>
  msg.attachments[IDX.ALERT].text
    .split(ALERT_PREFIX)[1]
    .replace(/`/g, "") // this removes the ` from displaying
    .replace(/\<|\>/g, ""); // this removes the extra "<>" arround URLs

const extractField = (field, msg) => {
  const value = msg.attachments[IDX.FIELDS].fields.find(
    // this indexOf is to paper over "audience2" which we want to resolve to "Audience"
    // the .replace(/s$/) is so that "reader" can resolve to to "Readers" (same for "Approvals")
    f =>
      field.indexOf(
        f.title
          .split(" ")[0]
          .toLowerCase()
          .replace(/s$/, "")
      ) > -1
  ).value;

  // to handle audience
  if (field.startsWith("audience")) {
    const [audience, audience2] = value.split(", ");
    return field === "audience" ? audience : audience2;
  }

  // to handle reader
  if (field.startsWith("reader")) {
    const [reader, reader2] = value.split(", ");
    return unformatValue(field, field === "reader" ? reader : reader2);
  }

  return unformatValue(field, value);
};

const extractApprovals = msg => {
  const approvals = msg.attachments[IDX.FIELDS].fields.find(
    f => f.title.toLowerCase() === "approvals"
  ).value;

  if (approvals === NOT_SET) return [];

  return unformatValue("approvals", approvals).split(", ");
};

const extract = (field, msg) => {
  if (field === "slug") {
    return extractSlug(msg);
  }

  if (field === "approvals") {
    return extractApprovals(msg);
  }

  return extractField(field, msg);
};

export default extract;
