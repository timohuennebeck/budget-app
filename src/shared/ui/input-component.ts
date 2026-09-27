import { type ComponentType, createContext, type Ref, useContext } from 'react';
import { TextInput, type TextInputProps } from 'react-native';

export type InputComponent = ComponentType<TextInputProps & { ref?: Ref<TextInput> }>;

// Inputs inside a bottom sheet must be gorhom's BottomSheetTextInput so the
// sheet moves up with the keyboard; Sheet provides it through this context.
export const InputComponentContext = createContext<InputComponent>(TextInput);

export const useInputComponent = () => useContext(InputComponentContext);
