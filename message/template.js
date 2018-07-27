import { ALERT_PREFIX, NOT_SET, STATES, FIELDS, ACTIONS } from "../dialog/constants";

const { toDisplay } = FIELDS;

export default {
  response_type: "in_channel",
  as_user: true,
  attachments: [
    {
      mrkdwn_in: ["text"],
      text: ALERT_PREFIX,
      fallback: "",
      color: STATES.INITIAL,
      attachment_type: "default",
      callback_id: "action_selection"
    },
    {
      mrkdwn_in: ["fields"],
      color: STATES.INITIAL,
      fields: [
        {
          title: toDisplay(FIELDS.LANGUAGE),
          value: NOT_SET,
          short: false
        },
        {
          title: toDisplay(FIELDS.DESK),
          value: NOT_SET,
          short: true
        },
        {
          title: toDisplay(FIELDS.AUDIENCE, true),
          value: NOT_SET,
          short: true
        },
        {
          title: toDisplay(FIELDS.OWNER),
          value: NOT_SET,
          short: true
        },
        {
          title: toDisplay(FIELDS.SENDER),
          value: NOT_SET,
          short: true
        },
        {
          title: toDisplay(FIELDS.READER, true),
          value: NOT_SET,
          short: true
        },
        {
          title: toDisplay(FIELDS.APPROVALS),
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
      color: "#fff",
      attachment_type: "default",
      callback_id: "action_selection",
      actions: [
        {
          name: ACTIONS.APPROVE,
          text: "✅  Approve",
          type: "button",
          value: ACTIONS.APPROVE
        },
        {
          name: ACTIONS.EDIT,
          text: "✏️  Edit Alert…",
          type: "button",
          value: ACTIONS.EDIT
        },
        {
          name: ACTIONS.PEOPLE,
          text: "👥  Edit People…",
          type: "button",
          value: ACTIONS.PEOPLE
        },
        {
          name: ACTIONS.SENT,
          text: "🏁  Mark as Sent",
          type: "button",
          value: ACTIONS.SENT,
          confirm: {
            title: "Mark this as sent?",
            text: "Are you sure you want to mark this alert as sent?",
            ok_text: "Yes",
            dismiss_text: "No"
          }
        }
      ]
    }
  ]
};
