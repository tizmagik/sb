/**
 * getInitial will get the initial message that the bot posted,
 * parses out the contents of that message and returns an object
 * with those values.
 *
 */

// const { updateField }

const getInitial = async ({ web, payload }) => {
  const channel = payload.channel.id;
  const [, ts] = payload.callback_id.split("|");
  const data = await web.conversations.replies({ channel, ts });

  const msg = data.messages[0];

  const old = {
    slug: updateField("slug", payload.submission.slug, msg),
    desk: updateField("desk", payload.submission.desk, msg),
    audience: updateField(
      "audience",
      displayAudience(payload.submission.audience, payload.submission.audience2),
      msg
    ),
    language: updateField("language", payload.submission.language, msg),

    // this part is weird because it deps on what was submitted,
    // e.g. the following is only relevant for PP dialog...
    owner: updateField("owner", payload.submission.owner)
  };
};
