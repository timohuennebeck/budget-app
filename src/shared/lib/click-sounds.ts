import { createContext, useContext } from 'react';

/**
 * Whether taps inside this part of the app play the click sound. Onboarding
 * turns it on so its steps feel more tactile; the app stays quiet.
 */
export const ClickSoundsContext = createContext(false);

export const useClickSounds = () => useContext(ClickSoundsContext);
