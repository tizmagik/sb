import template from "./template.json";
import { updateSlug, updateField } from "./update";

export const initialMessage = submission => {
  const { slug, language, desk, audience } = submission;

  const msg = { ...template };

  updateField("slug", slug, msg);
  updateField("language", language, msg);
  updateField("desk", desk, msg);
  updateField("audience", audience, msg);

  return msg;
};
