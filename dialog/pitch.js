import { NOT_SET } from "../dialog/constants";

export const PA_EDIT_ID = "pa|"; // pitch alert
export const PA_NEW_ID = "pan"; // pitch alert new

const audienceOptions = [
  "Breaking News",
  "Top Stories",
  "Apple News",
  "Politics",
  "Business",
  "New York",
  "Sports",
  "Targeted"
].map(a => ({ label: a, value: a }));

const dialog = ({ slug = "faux-slug", language, desk, audience, audience2, message_ts } = {}) => {
  const isEdit = !!message_ts;
  return {
    callback_id: isEdit ? `${PA_EDIT_ID}${message_ts}` : PA_NEW_ID,
    title: isEdit ? "Update Alert" : "Start an Alert Thread",
    submit_label: isEdit ? "Update" : "Submit",
    elements: [
      {
        label: "Slug (or URL)",
        type: "text",
        name: "slug",
        value: slug,
        placeholder: "",
        hint: "All fields can be changed later."
      },
      {
        label: "Language for the alert",
        type: "textarea",
        max_length: 150,
        name: "language",
        value: language === NOT_SET ? undefined : language,
        placeholder: "Breaking news...",
        // hint: "You can change this later.",
        optional: true
      },
      {
        label: "Desk Editor",
        type: "select",
        name: "desk",
        value: desk === NOT_SET ? undefined : desk,
        data_source: "users",
        placeholder: "Desk Editor",
        // hint: "You can change this later.",
        optional: true
      },
      {
        label: "Audience",
        type: "select",
        name: "audience",
        value: audience === NOT_SET ? undefined : audience,
        // hint: "You can change this later.",
        options: audienceOptions,
        optional: true
      },
      {
        label: "Secondary Audience",
        type: "select",
        name: "audience2",
        value: audience2,
        // hint: "You can change this later.",
        options: audienceOptions,
        optional: true
      }
    ]
  };
};

export default dialog;
