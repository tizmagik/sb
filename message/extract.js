/**
 * Extraction helpers to help extract values from original_message payloads
 *
 */
import { unformatValue } from "./update";
import { ALERT_PREFIX } from "../dialog/constants";

const extractSlug = msg => msg.text.split(ALERT_PREFIX)[1].replace(/`/g, "");

const extractField = (field, msg) => {
  print(msg.attachments[0].fields);
  const value = msg.attachments[0].fields.find(
    // this indexOf is to paper over "audience2" which we want to resolve to "audience"
    f => field.indexOf(f.title.split(" ")[0].toLowerCase()) > -1
  ).value;

  // to handle audience
  if (field.startsWith("audience")) {
    const [audience, audience2] = value.split(", ");
    return field === "audience" ? audience : audience2;
  }

  return unformatValue(field, value);
};

const extract = (field, msg) => {
  if (field === "slug") {
    return extractSlug(msg);
  }
  return extractField(field, msg);
};

export default extract;
