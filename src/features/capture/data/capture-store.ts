import { create } from 'zustand';

import type { DraftEntry } from '../lib/types';

export interface VoiceRecording {
  uri: string;
  /** MIME type, e.g. audio/m4a */
  type: string;
}

export type CaptureMode = 'onboarding' | 'app';

interface CaptureState {
  text: string;
  drafts: DraftEntry[];
  /** Local URI of the last receipt photo */
  photoUri: string | null;
  /** The voice recording to transcribe */
  recording: VoiceRecording | null;
  /** "Weitere hinzufügen": new drafts are added to the current ones */
  appending: boolean;
  /** The capture flow is on screen, possibly under /limit or another modal */
  open: boolean;
  start: (text?: string) => void;
  appendMore: () => void;
  addDrafts: (drafts: DraftEntry[]) => void;
  setText: (text: string) => void;
  setPhoto: (uri: string | null) => void;
  setRecording: (recording: VoiceRecording | null) => void;
  updateDraft: (id: string, patch: Partial<DraftEntry>) => void;
  removeDraft: (id: string) => void;
}

// Holds one capture session (text → parsing → review → saved). Not persisted:
// a half-finished capture shouldn't survive an app restart.
export const useCaptureStore = create<CaptureState>((set) => ({
  text: '',
  drafts: [],
  photoUri: null,
  recording: null,
  appending: false,
  open: false,
  start: (text = '') =>
    set({ text, drafts: [], photoUri: null, recording: null, appending: false }),
  appendMore: () => set({ text: '', photoUri: null, recording: null, appending: true }),
  addDrafts: (drafts) =>
    set((state) => ({
      drafts: state.appending ? [...state.drafts, ...drafts] : drafts,
      appending: false,
    })),
  setText: (text) => set({ text }),
  setPhoto: (photoUri) => set({ photoUri }),
  setRecording: (recording) => set({ recording }),
  updateDraft: (id, patch) =>
    set((state) => ({
      drafts: state.drafts.map((draft) => (draft.id === id ? { ...draft, ...patch } : draft)),
    })),
  removeDraft: (id) =>
    set((state) => ({ drafts: state.drafts.filter((draft) => draft.id !== id) })),
}));
