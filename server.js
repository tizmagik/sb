import http from "http";
import express from "express";
import bodyParser from "body-parser";
import { print } from "q-i";
import { createMessageAdapter } from "@slack/interactive-messages";
import { WebClient } from "@slack/client";
import pitchDialog, { PA_EDIT_ID } from "./dialog/pitch";
import peopleDialog, { PP_ID } from "./dialog/people";
import { initialMessage } from "./message/initial";
import extract from "./message/extract";
import { updateField, updateStatus, updateSent } from "./message/update";
import { displayAudience, displayReaders, whatChanged } from "./formatters";
import { FIELDS } from "./dialog/constants";

// Global Helpers for debugging, remove later!
// TODO: Remove before productionalizing
const ln = s => ` ${s} `.repeat(10);
const printw = (e, o) => {
  console.log("\n", e, " START", ln(e));
  print(o);
  console.log("\n", e, " END", ln(e));
};

global.print = print;
global.printw = printw;

process.on("uncaughtException", e => {
  console.error("[uncaught exception]", e);
});

process.on("unhandledRejection", e => {
  console.error("[unhandledRejection]", e);
});

console.log("Server booting up");

// Read the verification token from the environment variables
const { SLACK_VERIFICATION_TOKEN, SLACK_ACCESS_TOKEN, SLACK_BOT_ACCESS_TOKEN } = process.env;

if (!SLACK_VERIFICATION_TOKEN || !SLACK_ACCESS_TOKEN || !SLACK_BOT_ACCESS_TOKEN) {
  throw new Error("Slack verification token and access token are required to run this app.");
}

// TODO: Maybe make use of this slack sdk instead, https://github.com/MissionsAI/slapp
// TODO: Handle the error case where the bot is not invited to the channel

// Create the adapter using the app's verification token
const slackInteractions = createMessageAdapter(SLACK_VERIFICATION_TOKEN);

// Create a Slack Web API client
const web = new WebClient(SLACK_ACCESS_TOKEN);

// Initialize an Express application
const app = express();
app.use(express.json()); // JG added
app.use(bodyParser.urlencoded({ extended: false }));

app.use((req, res, next) => {
  console.log("req", req.path, new Date());
  next();
});

// Attach the adapter to the Express application as a middleware
app.use("/slack/actions", slackInteractions.expressMiddleware());

// Attach the slash command handler
app.post("/slack/commands", slackSlashCommand);

app.post("/slack/events", (req, res, next) => {
  console.log("/slack/events", new Date());
  printw("🔄", req.body);
  if (req.body.challenge) {
    return res.end(req.body.challenge);
  }
  return next();
});

// Start the express application server
const port = process.env.PORT || 0;
http.createServer(app).listen(port, () => {
  console.log(`server listening on port ${port}`);
});

const showPitchDialog = payload => {
  printw("⏬", payload);
  const slug = extract(FIELDS.SLUG, payload.original_message);
  const language = extract(FIELDS.LANGUAGE, payload.original_message);
  const desk = extract(FIELDS.DESK, payload.original_message);
  const audience = extract(FIELDS.AUDIENCE, payload.original_message);
  const audience2 = extract(FIELDS.AUDIENCE2, payload.original_message);

  console.log(" AUDIENCE ", audience, audience2);

  web.dialog
    .open({
      trigger_id: payload.trigger_id,
      dialog: pitchDialog({
        slug,
        language,
        desk,
        audience,
        audience2,
        message_ts: payload.message_ts
      })
    })
    .catch(error => {
      console.error(error);
      web.chat
        .postEphemeral({
          channel: payload.channel.id,
          user: payload.user.id,
          text: `Sorry, an error occurred while opening the dialog: ${error.message}`
        })
        .catch(console.error);
    })
    .catch(console.error);
};

const showPeopleDialog = payload => {
  printw("🤔", payload);

  const owner = extract(FIELDS.OWNER, payload.original_message);
  const desk = extract(FIELDS.DESK, payload.original_message);
  const reader = extract(FIELDS.READER, payload.original_message);
  const reader2 = extract(FIELDS.READER2, payload.original_message);
  const sender = extract(FIELDS.SENDER, payload.original_message);

  web.dialog
    .open({
      trigger_id: payload.trigger_id,
      dialog: peopleDialog({
        owner,
        desk,
        reader,
        reader2,
        sender,
        message_ts: payload.message_ts
      })
    })
    .catch(error => {
      console.error(error);
      web.chat
        .postEphemeral({
          channel: payload.channel.id,
          user: payload.user.id,
          text: `Sorry, an error occurred while opening the dialog: ${error.message}`
        })
        .catch(console.error);
    })
    .catch(console.error);
};

const addApproval = payload => {
  printw("✅", payload);

  const msg = payload.original_message;
  const channel = payload.channel.id;
  const user = payload.user.id;
  const ts = payload.message_ts;

  // Update original_message with approval from this user

  // Post in thread about added approval
  const added = updateField("approvals", user, msg);
  updateStatus(msg);

  if (added) {
    web.chat
      .update({
        ...msg,
        channel,
        ts,
        token: SLACK_BOT_ACCESS_TOKEN,
        as_user: true // https://api.slack.com/methods/chat.update
      })
      .then(data => {
        web.chat
          .postMessage({
            channel,
            thread_ts: ts,
            token: SLACK_BOT_ACCESS_TOKEN,
            as_user: true, // this would make it show up as the user himself that did the update
            text: `✅ <@${payload.user.name}> just added their approval!`
          })
          .then(data => {
            console.log("done posting reply");
            console.log(data);
          })
          .catch(error => {
            console.log("Error posting reply");
            console.error(error);
          });
      })
      .catch(error => {
        console.log("Error updating...");
        console.error(error);
      });
  } else {
    // user already added, post an ephemeral message letting them know
    web.chat.postEphemeral({
      channel,
      user,
      text: "Your excitement is encouraging, but you've already added your approval! 😁"
    });
  }
};

const markSent = payload => {
  const msg = payload.original_message;
  const channel = payload.channel.id;
  const user = payload.user.id;
  const ts = payload.message_ts;

  console.log("HERE");

  updateSent(user, msg);

  print("🏁", msg);

  web.chat.update({
    ...msg,
    channel,
    ts,
    token: SLACK_BOT_ACCESS_TOKEN,
    as_user: true // https://api.slack.com/methods/chat.update
  });

  // if (msg.attachments[IDX.ACTIONS].text !== READY_TO_SEND) {
  //   web.chat.postEphemeral({
  //     channel,
  //     user,
  //     text: "Still waiting on approvals. If you want to override this, click confirm."
  //   });
  // }
};

slackInteractions.action("action_selection", (payload, respond) => {
  console.log(
    `\n\n☢️ The user ${payload.user.name} in team ${payload.team.domain} chose an action`
  );

  // printw("☢️", payload);

  if (payload.type === "interactive_message") {
    const selectedOption = payload.actions[0].value;

    if (selectedOption === "edit") {
      // show the edit slug/language dialog
      showPitchDialog(payload);
    } else if (selectedOption === "people") {
      showPeopleDialog(payload);
    } else if (selectedOption === "approve") {
      addApproval(payload);
    } else if (selectedOption === "sent") {
      markSent(payload);
    } else {
      web.chat
        .postEphemeral({
          channel: payload.channel.id,
          user: payload.user.id,
          text: "Sorry, that action is not yet implemented."
        })
        .catch(console.error);
    }
  }

  return payload.original_message;
});

slackInteractions.action({ type: "dialog_submission" }, (payload, respond) => {
  // `payload` is an object that describes the interaction
  console.log(
    `\n\n☢️ The user ${payload.user.name} in team ${payload.team.domain} submitted a dialog (${
      payload.callback_id
    })`
  );

  const channel = payload.channel.id;
  const [, ts] = payload.callback_id.split("|");

  printw("💰", payload);

  if (payload.callback_id.startsWith(PA_EDIT_ID)) {
    // get the original message content
    web.conversations
      .replies({ channel, ts })
      .then(data => {
        const msg = data.messages[0];

        const oldSlug = updateField(FIELDS.SLUG, payload.submission.slug, msg);
        const oldDesk = updateField(FIELDS.DESK, payload.submission.desk, msg);
        const oldAudience = updateField(
          FIELDS.AUDIENCE,
          displayAudience(payload.submission.audience, payload.submission.audience2),
          msg
        );
        const oldLang = updateField(FIELDS.LANGUAGE, payload.submission.language, msg);

        updateStatus(msg);

        // update that message with the payload of this dialog submission
        web.chat
          .update({
            ...msg,
            channel,
            ts,
            token: SLACK_BOT_ACCESS_TOKEN,
            as_user: true // https://api.slack.com/methods/chat.update
          })
          .then(data => {
            // also post as a reply to the original message to update folks,
            // TODO: Make this better :)

            if (!oldSlug && !oldLang && !oldDesk && !oldAudience) {
              // nothing changed, don't post an update
              return;
            }

            let updatedText = `<@${payload.user.name}> just updated:\n`;

            updatedText += whatChanged(FIELDS.SLUG, oldSlug, payload.submission.slug);
            updatedText += whatChanged(FIELDS.LANGUAGE, oldLang, payload.submission.language);
            updatedText += whatChanged(FIELDS.DESK, oldDesk, payload.submission.desk);
            updatedText += whatChanged(
              FIELDS.AUDIENCE,
              oldAudience,
              payload.submission.audience,
              payload.submission.audience2
            );

            web.chat
              .postMessage({
                channel,
                thread_ts: ts,
                token: SLACK_BOT_ACCESS_TOKEN,
                as_user: true, // this would make it show up as the user himself that did the update
                text: updatedText
              })
              .then(data => {
                console.log("done posting reply");
                console.log(data);
              })
              .catch(error => {
                console.log("Error posting reply");
                console.error(error);
              });
          })
          .catch(error => {
            console.log("Error updating...");
            console.error(error);
          });
      })
      .catch(error => {
        console.log("Error reading replies");
        console.error(error);
      });

    return {};
    // end PA_EDIT_ID
  } else if (payload.callback_id.startsWith(PP_ID)) {
    // start PP_ID
    printw("😅", payload);

    // TODO: DRY this up! 🙈

    // get the original message content
    web.conversations
      .replies({ channel, ts })
      .then(data => {
        printw("🔴", data);
        const msg = data.messages[0];

        const oldOwner = updateField(FIELDS.OWNER, payload.submission.owner, msg);
        const oldDesk = updateField(FIELDS.DESK, payload.submission.desk, msg);
        const oldReaders = updateField(
          "readers",
          displayReaders(payload.submission.reader, payload.submission.reader2),
          msg
        );
        const oldSender = updateField(FIELDS.SENDER, payload.submission.sender, msg);

        updateStatus(msg);

        // update that message with the payload of this dialog submission
        web.chat
          .update({
            ...msg,
            channel,
            ts,
            token: SLACK_BOT_ACCESS_TOKEN,
            as_user: true // https://api.slack.com/methods/chat.update
          })
          .then(data => {
            // also post as a reply to the original message to update folks,
            // TODO: Make this better :)

            if (!oldOwner && !oldSender && !oldReaders) {
              // nothing changed, don't post an update
              return;
            }

            let updatedText = `<@${payload.user.name}> just updated:\n`;

            updatedText += whatChanged(FIELDS.OWNER, oldOwner, payload.submission.owner);
            updatedText += whatChanged(FIELDS.DESK, oldDesk, payload.submission.desk);
            updatedText += whatChanged(
              FIELDS.READER,
              oldReaders,
              payload.submission.reader,
              payload.submission.reader2
            );
            updatedText += whatChanged(FIELDS.SENDER, oldSender, payload.submission.sender);

            web.chat
              .postMessage({
                channel,
                thread_ts: ts,
                token: SLACK_BOT_ACCESS_TOKEN,
                as_user: true, // this would make it show up as the user himself that did the update
                text: updatedText
              })
              .then(data => {
                console.log("done posting reply");
                console.log(data);
              })
              .catch(error => {
                console.log("Error posting reply");
                console.error(error);
              });
          })
          .catch(error => {
            console.log("Error updating...");
            console.error(error);
          });
      })
      .catch(error => {
        console.log("Error reading replies");
        console.error(error);
      });

    return {};
    // end PP_ID
  }

  const msg = initialMessage(payload.submission);
  updateField(FIELDS.OWNER, payload.user.id, msg);
  web.chat
    .postMessage({
      channel,
      token: SLACK_BOT_ACCESS_TOKEN,
      as_user: true,
      ...msg
    })
    .then(data => {
      // print(data);
    })
    .catch(error => {
      console.log("error posting message");
      console.error(error);
    });

  return {}; // respond(payload);
});

// Slack slash command handler
function slackSlashCommand(req, res, next) {
  printw("😨", req.body);
  console.log("slackSlashCommand", req.body.command);

  if (req.body.token != SLACK_VERIFICATION_TOKEN) {
    return next();
  }

  if (req.body.command != "/interactive-example") {
    return next();
  }

  const [type] = req.body.text.split(" ");

  if (type === "news") {
    res.send();
    const trigger_id = req.body.trigger_id;

    web.dialog
      .open({
        trigger_id,
        dialog: pitchDialog()
      })
      .catch(error => {
        console.error(error);
        web.chat
          .postEphemeral({
            channel: req.body.channel_id,
            user: req.body.user_id,
            text: `Sorry, an error occurred while opening the dialog: ${
              error.message
            }\n\nPlease try again later.`
          })
          .catch(console.error);
      })
      .catch(console.error);
  } else {
    res.send("Use this command followed by `news`.");
  }
}
