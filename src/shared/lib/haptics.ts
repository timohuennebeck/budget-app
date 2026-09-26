import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const enabled = Platform.OS !== 'web';

// Thin wrapper so screens express intent ("select", "success") instead of
// picking impact styles, and web builds silently skip the native call.
export const haptics = {
  tap: () => enabled && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  press: () => enabled && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  select: () => enabled && Haptics.selectionAsync(),
  success: () => enabled && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  warning: () => enabled && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  error: () => enabled && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
};
