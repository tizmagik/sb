import http from "http";
import express from "express";
import bodyParser from "body-parser";
import { print } from "q-i";
import { createMessageAdapter } from "@slack/interactive-messages";
import { WebClient } from "@slack/client";
import axios from "axios";
import pitchDialog, { PA_NEW_ID, PA_EDIT_ID } from "./dialog/pitch";
import peopleDialog, { PP_ID } from "./dialog/people";
import { initialMessage } from "./message/initial";
import extract from "./message/extract";
import { updateField } from "./message/update";
import { displayAudience } from "./formatters";

// Global Helpers for debugging, remove later!
// TODO: Remove before productionalizing
const println = s => console.log(` ${s} `.repeat(10));
const printw = (e, o) => {
  console.log("\nSTART");
  println(e);
  print(o);
  println(e);
  console.log("END\n");
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
  const slug = extract("slug", payload.original_message);
  const language = extract("language", payload.original_message);
  const desk = extract("desk", payload.original_message);
  const audience = extract("audience", payload.original_message);
  const audience2 = extract("audience2", payload.original_message);

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
      return axios.post(payload.response_url, {
        text: `An error occurred while opening the dialog: ${error.message}`
      });
    })
    .catch(console.error);
};

const showPeopleDialog = payload => {
  printw("🤔", payload);

  const owner = extract("owner", payload.original_message);
  const sender = extract("sender", payload.original_message);
  const reader = extract("reader", payload.original_message);
  const reader2 = extract("reader2", payload.original_message);

  console.log(" PEOPLE ", owner, sender, reader, reader2);

  web.dialog
    .open({
      trigger_id: payload.trigger_id,
      dialog: peopleDialog({
        owner,
        sender,
        reader,
        reader2,
        message_ts: payload.message_ts
      })
    })
    .catch(error => {
      console.error(error);
      return axios.post(payload.response_url, {
        text: `An error occurred while opening the dialog: ${error.message}`
      });
    })
    .catch(console.error);
};

slackInteractions.action("action_selection", (payload, respond) => {
  console.log(
    `\n\n☢️ The user ${payload.user.name} in team ${payload.team.domain} chose an action`
  );

  printw("☢️", payload);

  if (payload.type === "interactive_message") {
    const selectedOption = payload.actions[0].value;

    if (selectedOption === "edit") {
      // show the edit slug/language dialog
      showPitchDialog(payload);
    } else if (selectedOption === "people") {
      showPeopleDialog(payload);
    } else {
      web.chat.postEphemeral({
        channel: payload.channel.id,
        user: payload.user.id,
        text: "Sorry, that action is not yet implemented."
      });
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
        printw("🔴", data);
        const msg = data.messages[0];

        const oldSlug = updateField("slug", payload.submission.slug, msg);
        const oldDesk = updateField("desk", payload.submission.desk, msg);
        const oldAudience = updateField(
          "audience",
          displayAudience(payload.submission.audience, payload.submission.audience2),
          msg
        );
        const oldLang = updateField("language", payload.submission.language, msg);

        printw("🀄️", msg);

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

            if (!oldSlug && !oldLang && !oldDesk && !oldAudience && !oldAudience2) {
              // nothing changed, don't post an update
              return;
            }

            let updatedText = `<@${payload.user.name}> just updated:\n`;

            updatedText += oldSlug
              ? `*Slug* from ~${oldSlug}~ to \`${payload.submission.slug}\`\n`
              : "";
            updatedText += oldLang
              ? `*Language* from ~${oldLang}~ to \n>${payload.submission.language}\n`
              : "";
            updatedText += oldDesk
              ? `*Desk partner* from <@${oldDesk}> to <@${payload.submission.desk}>\n`
              : "";

            updatedText += oldAudience
              ? `*Audience* from ~${oldAudience}~ to ${displayAudience(
                  payload.submission.audience,
                  payload.submission.audience2
                )}`
              : "";

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
    // people dialog
    console.log("People dialog was pressed");
    printw("😅", payload);

    return {};
  }

  // const partialMessage = `<@${
  //   payload.user.id
  // }> just pitched a new alert for \`${
  //   payload.submission.slug
  // }\` with the language:\n> ${payload.submission.language}\n\nDesk: <@${
  //   payload.submission.desk
  // }>\nAudience: ${payload.submission.audience}\nFin..`;

  printw("1️⃣", payload);
  // console.log("about to open dialog");
  // web.dialog
  //   .open({
  //     trigger_id: payload.trigger_id,
  //     dialog: {
  //       text: "hi"
  //     }
  //   })
  //   .then(data => {
  //     console.log("chained dialog", data);
  //   })
  //   .catch(error => {
  //     console.log("error chaining dialog", error);
  //   });

  const msg = initialMessage(payload.submission);
  updateField("owner", payload.user.id, msg);
  console.log("Channel ID : ", payload.channel.id);
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
  console.log("slackSlashCommand", req.body.command);

  if (req.body.token != SLACK_VERIFICATION_TOKEN) {
    return next();
  }

  if (req.body.command != "/interactive-example") {
    return next();
  }

  const type = req.body.text.split(" ")[0];
  if (type === "news") {
    res.send();
    const trigger_id = req.body.trigger_id;
    web.dialog
      .open({
        trigger_id,
        dialog: pitchDialog()
      })
      // .then(data => {
      //   console.log("dialog returned");
      //   print(data);
      //   return;
      //   web.dialog
      //     .open({ trigger_id, dialog: { text: "hi" } })
      //     .then(data => {
      //       console.log("then data from chained");
      //     })
      //     .catch(error => {
      //       console.log("error chaining", error);
      //     });
      // })
      .catch(error => {
        console.error(error);
        return axios.post(req.body.response_url, {
          text: `An error occurred while opening the dialog: ${error.message}`
        });
      })
      .catch(console.error);
  } else {
    res.send("Use this command followed by `news`.");
  }
}
