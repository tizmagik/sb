/**
 * Extraction helpers to help extract values from original_message payloads
 *
 */
import { unformatValue, getField } from "./update";
import { ALERT_PREFIX, NOT_SET, IDX, FIELDS } from "../dialog/constants";

const extractSlug = msg =>
  unformatValue(FIELDS.SLUG, msg.attachments[IDX.ALERT].text.split(ALERT_PREFIX)[1]);

/**
 * Extracts the individual field values from Slack object
 *
 * e.g. [audience, audience2] <= "Audiences"
 *
 * @param {FIELD} field
 * @param {Slack Obj} msg
 */
const extract = (field, msg) => {
  // to handle slug
  if (field === FIELDS.SLUG) {
    return extractSlug(msg);
  }

  const value = getField(field, msg).value;

  // to handle audience
  if (field === FIELDS.AUDIENCE || field === FIELDS.AUDIENCE2) {
    const [audience, audience2] = value.split(", ");
    return field === FIELDS.AUDIENCE ? audience : audience2;
  }

  // to handle reader
  if (field === FIELDS.READER || field === FIELDS.READER2) {
    const [reader, reader2] = value.split(", ");
    return unformatValue(field, field === FIELDS.READER ? reader : reader2);
  }

  // to handle approvals
  if (field === FIELDS.APPROVALS) {
    return unformatValue(field, value)
      .split(", ")
      .filter(a => a !== NOT_SET);
  }

  return unformatValue(field, value);
};

export default extract;
