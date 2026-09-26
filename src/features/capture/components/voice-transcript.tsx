import { Text } from '@/shared/ui/text';

const AMOUNT_TOKEN = /(\d+(?:[.,]\d{1,2})?\s?(?:€|eur|euro|\$|£|chf)?)/i;

interface VoiceTranscriptProps {
  transcript: string;
  /** Trailing text the parser couldn't turn into an entry (shown grey) */
  pending?: string;
}

/** Live transcript with recognised amounts highlighted in blue (2i). */
export function VoiceTranscript({ transcript, pending }: VoiceTranscriptProps) {
  const pendingStart =
    pending && transcript.endsWith(pending)
      ? transcript.length - pending.length
      : transcript.length;
  const recognised = transcript.slice(0, pendingStart);
  const parts = recognised.split(AMOUNT_TOKEN);

  return (
    <Text size={28} weight="medium" tracking={-0.025} leading={1.35}>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <Text key={index} size={28} weight="semibold" className="text-primary">
            {part}
          </Text>
        ) : (
          part
        ),
      )}
      {pendingStart < transcript.length ? (
        <Text size={28} weight="medium" className="text-faint">
          {transcript.slice(pendingStart)}
        </Text>
      ) : null}
    </Text>
  );
}
