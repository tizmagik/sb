import { NOT_SET } from "../message/template";

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
    title: isEdit ? "Update Alert" : "Pitch an Alert",
    submit_label: isEdit ? "Update" : "Submit",
    elements: [
      {
        label: "Slug (or URL)",
        type: "text",
        name: "slug",
        value: slug,
        placeholder: "",
        hint: "Provide the slug for the alert (or URL, if you have it). You can update this later."
      },
      {
        label: "Language for the alert",
        type: "textarea",
        max_length: 150,
        name: "language",
        value: language === NOT_SET ? undefined : language,
        placeholder: "Breaking news...",
        hint: "You can change this later.",
        optional: true
      },
      {
        label: "Desk partner",
        type: "select",
        name: "desk",
        value: desk === NOT_SET ? undefined : language,
        data_source: "users",
        placeholder: "Desk partner",
        hint: "You can change this later.",
        optional: true
      },
      {
        label: "Audience",
        type: "select",
        name: "audience",
        value: audience === NOT_SET ? undefined : audience,
        hint: "You can change this later.",
        options: audienceOptions,
        optional: true
      },
      {
        label: "Secondary Audience",
        type: "select",
        name: "audience2",
        value: audience2,
        hint: "You can change this later.",
        options: audienceOptions,
        optional: true
      }
      // {
      //   label: "Approval",
      //   type: "select",
      //   name: "approval1",
      //   data_source: "users",
      //   placeholder: "Require approval from",
      //   hint: "Who should approve?"
      // }
      // {
      //   label: "Approval 2",
      //   type: "select",
      //   name: "approval2",
      //   data_source: "users",
      //   placeholder: "Require approval from",
      //   hint: "Who else should approve?"
      // }
    ]
  };
};

export default dialog;
