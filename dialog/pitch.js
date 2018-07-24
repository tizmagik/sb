export const ID = "newsalert_submit";

const dialog = {
  callback_id: ID,
  title: "Pitch an Alert",
  submit_label: "Submit",
  elements: [
    {
      label: "Slug (or URL)",
      type: "text",
      name: "slug",
      value: "faux-slug",
      placeholder: "",
      hint:
        "Provide the slug for the alert (or URL, if you have it). You can update this later."
    },
    {
      label: "Language for the alert",
      type: "textarea",
      // max_length: 140,
      name: "language",
      placeholder: "Breaking news...",
      hint: "You can change this later.",
      optional: true
    },
    {
      label: "Desk partner",
      type: "select",
      name: "desk",
      data_source: "users",
      placeholder: "Desk partner",
      hint: "You can change this later.",
      optional: true
    },
    {
      label: "Audience",
      type: "select",
      name: "audience",
      // value: "news",
      hint: "You can add more later.",
      options: [
        {
          label: "News",
          value: "news"
        },
        {
          label: "Business",
          value: "business"
        }
      ],
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

export default dialog;
