export const ID = "newsalert_submit";

const dialog = {
  callback_id: ID,
  title: "Pitch an Alert",
  submit_label: "Submit",
  elements: [
    {
      label: "Language for the alert",
      type: "textarea",
      max_length: 140,
      name: "language",
      placeholder: "Breaking news...",
      hint: "Provide the language for this alert."
    },
    {
      label: "Link",
      type: "text",
      name: "link",
      placeholder: "http://...",
      hint: "Provide the link for the alert."
    },
    {
      label: "Desk",
      type: "select",
      name: "desk",
      value: "news",
      hint: "Which desk?",
      options: [
        {
          label: "News",
          value: "news"
        },
        {
          label: "Business",
          value: "business"
        }
      ]
    },
    {
      label: "Owner",
      type: "select",
      name: "owner",
      data_source: "users",
      placeholder: "Owner",
      hint: "Who owns this alert?"
    },
    {
      label: "Approval",
      type: "select",
      name: "approval1",
      data_source: "users",
      placeholder: "Require approval from",
      hint: "Who should approve?"
    }
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
