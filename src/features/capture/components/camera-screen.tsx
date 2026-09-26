import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { haptics } from '@/shared/lib/haptics';
import { Button } from '@/shared/ui/button';
import { IconButton } from '@/shared/ui/icon-button';
import { Pip } from '@/shared/ui/pip';
import { Pressable } from '@/shared/ui/pressable';
import { Text } from '@/shared/ui/text';

import { type CaptureMode, useCaptureStore } from '../data/capture-store';
import { captureHref } from '../lib/capture-routes';

// Receipt camera (2s): framed preview, torch and flip, gallery import and the
// shutter. The photo goes to the processing step through the capture store.
export function CameraScreen({ mode }: { mode: CaptureMode }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const camera = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const setPhoto = useCaptureStore((state) => state.setPhoto);

  const process = (uri: string) => {
    setPhoto(uri);
    router.replace(captureHref(mode, 'processing', { source: 'camera' }));
  };

  const shoot = async () => {
    haptics.press();
    const photo = await camera.current?.takePictureAsync({ quality: 0.7 });
    if (photo?.uri) process(photo.uri);
  };

  const pickFromLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) process(result.assets[0].uri);
  };

  return (
    <View
      className="flex-1 bg-camera px-3.5"
      style={{ paddingTop: insets.top + 6, paddingBottom: Math.max(insets.bottom, 16) + 8 }}>
      <Text size={15} weight="medium" className="mb-3.5 text-center text-white/70">
        {t('capture.cameraHint')}
      </Text>
      <View className="flex-1 overflow-hidden rounded-[32px] bg-[#252A33]">
        {permission?.granted ? (
          <>
            <CameraView ref={camera} style={{ flex: 1 }} facing={facing} enableTorch={torch} />
            <View
              className="absolute top-[70px] right-11 bottom-[110px] left-11 rounded-[18px] border-2 border-white/55"
              pointerEvents="none"
            />
            <View className="absolute right-4 bottom-4 left-4 flex-row justify-between">
              <IconButton
                icon={torch ? 'sun' : 'lightning-slash'}
                variant="glass"
                size={40}
                accessibilityLabel={t('capture.torch')}
                onPress={() => setTorch((on) => !on)}
              />
              <IconButton
                icon="camera-rotate"
                variant="glass"
                size={40}
                accessibilityLabel={t('capture.flip')}
                onPress={() => setFacing((side) => (side === 'back' ? 'front' : 'back'))}
              />
            </View>
          </>
        ) : (
          <View className="flex-1 items-center justify-center gap-4 px-8">
            <Pip pose="magnifier" size={120} />
            <Text size={16} className="text-center text-white/80">
              {t('capture.cameraPermission')}
            </Text>
            <Button size="md" label={t('capture.allowCamera')} onPress={requestPermission} />
          </View>
        )}
      </View>
      <View className="mt-[22px] flex-row items-center justify-between px-2">
        <IconButton
          icon="image"
          variant="glass"
          size={52}
          iconSize={22}
          accessibilityLabel={t('capture.library')}
          onPress={pickFromLibrary}
        />
        <Pressable
          haptic="none"
          disabled={!permission?.granted}
          onPress={shoot}
          accessibilityLabel={t('capture.shutter')}
          className="size-[86px] items-center justify-center rounded-full border-[3px] border-white/90">
          <View className="size-[72px] rounded-full bg-white" />
        </Pressable>
        <IconButton
          icon="x"
          variant="glass"
          size={52}
          iconSize={22}
          accessibilityLabel={t('common.close')}
          onPress={() => router.back()}
        />
      </View>
    </View>
  );
}
