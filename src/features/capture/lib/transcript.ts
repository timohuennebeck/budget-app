// Live transcript from OpenAI Realtime data-channel events. Each spoken turn
// is an item: deltas stream in while the user talks, `completed` replaces
// them with the final text for that item.

export interface Transcript {
  /** Item ids in the order they started */
  order: string[];
  text: Record<string, string>;
}

export const emptyTranscript: Transcript = { order: [], text: {} };

interface RealtimeEvent {
  type?: string;
  item_id?: string;
  delta?: string;
  transcript?: string;
}

const DELTA = 'conversation.item.input_audio_transcription.delta';
const COMPLETED = 'conversation.item.input_audio_transcription.completed';

export function applyTranscriptEvent(state: Transcript, event: RealtimeEvent): Transcript {
  if ((event.type !== DELTA && event.type !== COMPLETED) || !event.item_id) return state;
  const id = event.item_id;
  const order = state.order.includes(id) ? state.order : [...state.order, id];
  const text =
    event.type === DELTA ? (state.text[id] ?? '') + (event.delta ?? '') : (event.transcript ?? '');
  return { order, text: { ...state.text, [id]: text } };
}

export function isCompletedEvent(event: RealtimeEvent) {
  return event.type === COMPLETED;
}

export function transcriptText(state: Transcript) {
  return state.order
    .map((id) => state.text[id].trim())
    .filter(Boolean)
    .join(' ');
}
