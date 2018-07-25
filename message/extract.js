/**
 * Extraction helpers to help extract values from original_message payloads
 *
 */
import { unformatValue } from "./update";
import { ALERT_PREFIX } from "../dialog/constants";

const extractSlug = msg => msg.text.split(ALERT_PREFIX)[1].replace(/`/g, "");

const extractField = (field, msg) => {
  print(msg.attachments[0].fields);
  console.log(field);
  const value = msg.attachments[0].fields.find(
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

  console.log("field", field, " / ", "value", value);

  // to handle audience
  if (field.startsWith("audience")) {
    const [audience, audience2] = value.split(", ");
    return field === "audience" ? audience : audience2;
  }

  // to handle reader
  if (field.startsWith("reader")) {
    const [reader, reader2] = value.split(", ");
    return field === "reader" ? reader : reader2;
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
