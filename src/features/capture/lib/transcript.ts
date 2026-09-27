// Live transcript from OpenAI Realtime data-channel events. Each spoken turn
// is an item: deltas stream in while the user talks, `completed` replaces
// them with the final text. Committed items are tracked so stop() can wait
// until every turn has its final text.

export interface Transcript {
  /** Item ids in the order they started */
  order: string[];
  text: Record<string, string>;
  done: Record<string, boolean>;
}

export const emptyTranscript: Transcript = { order: [], text: {}, done: {} };

export interface RealtimeEvent {
  type?: string;
  item_id?: string;
  delta?: string;
  transcript?: string;
}

export function applyTranscriptEvent(state: Transcript, event: RealtimeEvent): Transcript {
  const id = event.item_id;
  if (!id) return state;
  const order = state.order.includes(id) ? state.order : [...state.order, id];
  switch (event.type) {
    case 'input_audio_buffer.committed':
      return { ...state, order };
    case 'conversation.item.input_audio_transcription.delta':
      return {
        ...state,
        order,
        text: { ...state.text, [id]: (state.text[id] ?? '') + (event.delta ?? '') },
      };
    case 'conversation.item.input_audio_transcription.completed':
      return {
        order,
        text: { ...state.text, [id]: event.transcript ?? '' },
        done: { ...state.done, [id]: true },
      };
    default:
      return state;
  }
}

/** Every turn so far has its final text. */
export function isSettled(state: Transcript) {
  return state.order.every((id) => state.done[id]);
}

export function transcriptText(state: Transcript) {
  return state.order
    .map((id) => (state.text[id] ?? '').trim())
    .filter(Boolean)
    .join(' ');
}
