export type TranscriptTurn = {
  speaker: string;
  message: string;
};

export function parseTranscript(transcript: string): TranscriptTurn[] {
  const speakerPattern = /(?:^|\s)([A-Z][A-Za-z0-9 '-]{0,30}):\s*/g;
  const matches = [...transcript.matchAll(speakerPattern)];

  if (matches.length === 0) {
    return transcript.trim() ? [{ speaker: "Transcript", message: transcript.trim() }] : [];
  }

  return matches
    .map((match, index) => {
      const messageStart = (match.index ?? 0) + match[0].length;
      const messageEnd = matches[index + 1]?.index ?? transcript.length;
      return {
        speaker: match[1].trim(),
        message: transcript.slice(messageStart, messageEnd).trim(),
      };
    })
    .filter((turn) => turn.message.length > 0);
}
