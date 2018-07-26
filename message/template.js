import { NOT_SET } from "../dialog/constants";

export default {
  text: ":rotating_light: Alert for ",
  response_type: "in_channel",
  as_user: true,
  attachments: [
    {
      mrkdwn_in: ["fields"],
      fields: [
        {
          title: "Language",
          value: NOT_SET,
          short: false
        },
        {
          title: "Desk Editor",
          value: NOT_SET,
          short: true
        },
        {
          title: "Audience",
          value: NOT_SET,
          short: true
        },
        {
          title: "Owner",
          value: NOT_SET,
          short: true
        },
        {
          title: "Sender",
          value: NOT_SET,
          short: true
        },
        {
          title: "Readers",
          value: NOT_SET,
          short: true
        },
        {
          title: "Approvals",
          value: NOT_SET,
          short: true
        }
      ]
    },
    {
      mrkdwn_in: ["text"],
      text: "",
      fallback:
        "Your Slack client does not support interactive messages. Please try a different Slack client.",
      color: "#ffffff",
      attachment_type: "default",
      callback_id: "action_selection",
      actions: [
        {
          name: "approve",
          text: "✅  Approve",
          type: "button",
          value: "approve"
        },
        {
          name: "edit",
          text: "✏️  Edit Alert…",
          type: "button",
          value: "edit"
        },
        {
          name: "people",
          text: "👥  Edit People…",
          type: "button",
          value: "people"
        },
        {
          name: "sent",
          text: "🏁  Mark as Sent",
          type: "button",
          value: "sent",
          confirm: {
            title: "Mark this as sent?",
            text: "Are you sure you want to mark this alert as sent?",
            ok_text: "Yes",
            dismiss_text: "No"
          }
        }
        // {
        //   name: "action_list",
        //   text: "Choose an action...",
        //   type: "select",
        //   options: [
        //     {
        //       text: "✏️ Edit the slug or language...",
        //       value: "edit"
        //     },
        //     {
        //       text: "👥 Edit desk, audience or owner...",
        //       value: "editmeta"
        //     },
        //     {
        //       text: "🔲 Request approval from...",
        //       value: "request"
        //     },
        //     {
        //       text: "✅ Add approval",
        //       value: "approve"
        //     },
        //     {
        //       text: "🏁 Mark as sent",
        //       value: "sent"
        //     }
        //   ]
        // }
      ]
    }
  ]
};
