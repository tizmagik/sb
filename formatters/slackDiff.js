import * as diff from "diff";

const slackDiff = (oldStr, newStr) =>
  diff
    .diffWords(oldStr, newStr)
    .map(r => {
      if (r.added) return `_${r.value}_`;
      if (r.removed) return `~${r.value}~`;
      return r.value;
    })
    .join(" ")
    .replace(/\s\.$/, "."); // fix "end ." to "end."

export default slackDiff;
