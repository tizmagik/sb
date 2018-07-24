/**
 * Extraction helpers to help extract values from original_message payloads
 *
 */

const extractSlug = msg => msg.text.split(" Alert for ")[1].replace(/`/g, "");
const extractField = (field, msg) =>
  msg.attachments[0].fields.find(f => f.title.toLowerCase() === field).value;
const extract = (field, msg) => {
  if (field === "slug") {
    return extractSlug(msg);
  }
  return extractField(field, msg);
};

export default extract;
