export const displayAudience = (audience, audience2) =>
  audience && audience2 ? [audience, audience2].join(", ") : audience || audience2;
