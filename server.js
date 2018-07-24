import http from "http";
import express from "express";
import bodyParser from "body-parser";
import { print } from "q-i";
import { createMessageAdapter } from "@slack/interactive-messages";
import { WebClient } from "@slack/client";
import axios from "axios";
import pitchDialog from "./dialog/pitch";
import slugLanguageDialog from "./dialog/slug-language";
import { initialMessage } from "./message/initial";
import extract from "./message/extract";
import { updateField } from "./message/update";

global.print = print;

console.log("Server booting up");

// Read the verification token from the environment variables
const slackVerificationToken = process.env.SLACK_VERIFICATION_TOKEN;
const slackAccessToken = process.env.SLACK_ACCESS_TOKEN;
if (!slackVerificationToken || !slackAccessToken) {
  throw new Error(
    "Slack verification token and access token are required to run this app."
  );
}

// Create the adapter using the app's verification token
const slackInteractions = createMessageAdapter(slackVerificationToken);

// Create a Slack Web API client
const web = new WebClient(slackAccessToken);

// Initialize an Express application
const app = express();
app.use(express.json()); // JG added
app.use(bodyParser.urlencoded({ extended: false }));

app.use((req, res, next) => {
  console.log("req", new Date());
  next();
});

// Attach the adapter to the Express application as a middleware
app.use("/slack/actions", slackInteractions.expressMiddleware());

// Attach the slash command handler
app.post("/slack/commands", slackSlashCommand);

app.post("/slack/events", (req, res, next) => {
  console.log("/slack/events", new Date());
  print(req.body);
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

const showSlugLanugageDialog = payload => {
  const language = extract("language", payload.original_message);
  const slug = extract("slug", payload.original_message);

  web.dialog
    .open({
      trigger_id: payload.trigger_id,
      dialog: slugLanguageDialog({ slug, language })
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
    `\n\n☢️ The user ${payload.user.name} in team ${
      payload.team.domain
    } chose an action`
  );

  print(payload);

  if (payload.type === "interactive_message") {
    const selectedOption = payload.actions[0].selected_options[0].value;

    if (selectedOption === "edit") {
      // show the edit slug/language dialog
      showSlugLanugageDialog(payload);
    } else {
      web.chat.postEphemeral({
        channel: payload.channel.id,
        user: payload.user.id,
        text: "Sorry, that action is not yet implemented."
      });
    }
  }

  return payload.original_message;
  // respond();
  // console.log("\n\n---\n\n");

  // web.conversations
  //   .replies({
  //     channel: payload.channel.id,
  //     ts: payload.message_ts
  //   })
  //   .then(data => {
  //     console.log("\n\n🍉 read\n");
  //     // print(data, { depth: 15 });
  //     print(data);
  //     console.log("\n🍉🍉🍉🍉🍉🍉🍉🍉🍉\n");
  //     respond({ ...data.messages[0], text: "🔥 Updated!" });
  //   })
  //   .catch(e => {
  //     console.log("🔥🔥🔥");
  //     // print(e);
  //     print(e);
  //     console.log("🔥🔥🔥");
  //     response({
  //       text: "Something failed..."
  //     });
  //   });

  // respond({ ...data.message[0], text: "🔥 Updated!" });
});

slackInteractions.action({ type: "dialog_submission" }, (payload, respond) => {
  // `payload` is an object that describes the interaction
  console.log(
    `The user ${payload.user.name} in team ${
      payload.team.domain
    } submitted a dialog`
  );

  // const partialMessage = `<@${
  //   payload.user.id
  // }> just pitched a new alert for \`${
  //   payload.submission.slug
  // }\` with the language:\n> ${payload.submission.language}\n\nDesk: <@${
  //   payload.submission.desk
  // }>\nAudience: ${payload.submission.audience}\nFin..`;

  print(payload);

  const msg = initialMessage(payload.submission);
  updateField("owner", payload.user.id, msg);

  respond(msg);
});

// Slack slash command handler
function slackSlashCommand(req, res, next) {
  console.log("slackSlashCommand", req.body.command);

  if (req.body.token != slackVerificationToken) {
    return next();
  }

  if (req.body.command != "/interactive-example") {
    return next();
  }

  print(req.body);

  const type = req.body.text.split(" ")[0];
  if (type === "news") {
    res.send();
    web.dialog
      .open({
        trigger_id: req.body.trigger_id,
        dialog: pitchDialog
      })
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
