import { NOT_SET } from "../message/template";

export const PP_ID = "pp|"; // people

const dialog = ({ owner, desk, sender, reader, reader2, message_ts } = {}) => {
  return {
    callback_id: `${PP_ID}${message_ts}`,
    title: "Update People",
    submit_label: "Update",
    elements: [
      {
        label: "Owner",
        type: "select",
        name: "owner",
        value: owner === NOT_SET ? undefined : owner,
        data_source: "users",
        placeholder: "Owner",
        // hint: "Who owns this alert?",
        optional: false
      },
      // TODO: Dedupe this from the one in pitch.js
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
        label: "Primary Reader",
        type: "select",
        name: "reader",
        value: reader === NOT_SET ? undefined : reader,
        data_source: "users",
        placeholder: "Primary reader",
        // hint: "Who's the primary reader?",
        optional: true
      },
      {
        label: "Secondary Reader",
        type: "select",
        name: "reader2",
        value: reader2 === NOT_SET ? undefined : reader2,
        data_source: "users",
        placeholder: "Secondary reader",
        // hint: "Who's the secondary reader?",
        optional: true
      },
      {
        label: "Sender",
        type: "select",
        name: "sender",
        value: sender === NOT_SET ? undefined : sender,
        data_source: "users",
        placeholder: "Sender",
        // hint: "Who will be sending this alert?",
        optional: true
      }
    ]
  };
};

export default dialog;
