import template from "./template";
import { updateField } from "./update";

export const initialMessage = submission => {
  const { slug, language, desk, audience, audience2 } = submission;

  const msg = { ...template };

  const aud =
    audience && audience2
      ? [audience, audience2].join(", ")
      : audience || audience2;

  updateField("slug", slug, msg);
  updateField("language", language, msg);
  updateField("desk", desk, msg);
  updateField("audience", aud, msg);

  return msg;
};
