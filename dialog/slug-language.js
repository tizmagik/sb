export const ID = "sl|"; // sign language

const dialog = ({ slug, language, message_ts }) => {
  return {
    callback_id: `${ID}${message_ts}`,
    title: "Edit slug or language",
    submit_label: "Update",
    elements: [
      {
        label: "Slug (or URL)",
        type: "text",
        name: "slug",
        value: slug,
        placeholder: "",
        hint:
          "Update the slug (or URL) here. A message with the update will be posted."
      },
      {
        label: "Language for the alert",
        type: "textarea",
        value: language,
        // max_length: 140,
        name: "language",
        placeholder: "Breaking news...",
        hint:
          "Update the language here. A message with the before/after will be posted.",
        optional: true
      }
    ]
  };
};

export default dialog;
