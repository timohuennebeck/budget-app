import {
  AirplaneTiltIcon,
  ArrowRightIcon,
  BabyIcon,
  BarbellIcon,
  BasketIcon,
  BooksIcon,
  BriefcaseIcon,
  CalendarBlankIcon,
  CameraIcon,
  CameraRotateIcon,
  CarIcon,
  CaretDownIcon,
  CaretLeftIcon,
  CaretRightIcon,
  CaretUpIcon,
  CarSimpleIcon,
  CheckIcon,
  CoffeeIcon,
  DropIcon,
  EyeIcon,
  EyeSlashIcon,
  FirstAidIcon,
  ForkKnifeIcon,
  FrameCornersIcon,
  GameControllerIcon,
  GearSixIcon,
  GiftIcon,
  GraduationCapIcon,
  HandIcon,
  HeartIcon,
  HouseLineIcon,
  type IconProps as PhosphorProps,
  ImageIcon,
  LightningSlashIcon,
  LockIcon,
  MagnifyingGlassIcon,
  MicrophoneIcon,
  MinusIcon,
  MusicNotesIcon,
  PawPrintIcon,
  PencilSimpleIcon,
  PlusIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  SparkleIcon,
  StarIcon,
  StopIcon,
  SunIcon,
  TicketIcon,
  TrainIcon,
  TShirtIcon,
  UserIcon,
  WrenchIcon,
  XIcon,
} from 'phosphor-react-native';

import { colors } from '@/shared/lib/theme';

// Icons are referenced by their Phosphor kebab-case name so category icons can
// be stored as plain text in the database.
const registry = {
  'airplane-tilt': AirplaneTiltIcon,
  'arrow-right': ArrowRightIcon,
  baby: BabyIcon,
  barbell: BarbellIcon,
  basket: BasketIcon,
  books: BooksIcon,
  briefcase: BriefcaseIcon,
  'calendar-blank': CalendarBlankIcon,
  camera: CameraIcon,
  'camera-rotate': CameraRotateIcon,
  car: CarIcon,
  'car-simple': CarSimpleIcon,
  'caret-down': CaretDownIcon,
  'caret-left': CaretLeftIcon,
  'caret-right': CaretRightIcon,
  'caret-up': CaretUpIcon,
  check: CheckIcon,
  coffee: CoffeeIcon,
  drop: DropIcon,
  eye: EyeIcon,
  'eye-slash': EyeSlashIcon,
  'first-aid': FirstAidIcon,
  'fork-knife': ForkKnifeIcon,
  'frame-corners': FrameCornersIcon,
  'game-controller': GameControllerIcon,
  'gear-six': GearSixIcon,
  gift: GiftIcon,
  'graduation-cap': GraduationCapIcon,
  hand: HandIcon,
  heart: HeartIcon,
  'house-line': HouseLineIcon,
  image: ImageIcon,
  'lightning-slash': LightningSlashIcon,
  lock: LockIcon,
  'magnifying-glass': MagnifyingGlassIcon,
  microphone: MicrophoneIcon,
  minus: MinusIcon,
  'music-notes': MusicNotesIcon,
  'paw-print': PawPrintIcon,
  'pencil-simple': PencilSimpleIcon,
  plus: PlusIcon,
  'shopping-bag': ShoppingBagIcon,
  'shopping-cart': ShoppingCartIcon,
  sparkle: SparkleIcon,
  star: StarIcon,
  stop: StopIcon,
  sun: SunIcon,
  ticket: TicketIcon,
  train: TrainIcon,
  't-shirt': TShirtIcon,
  user: UserIcon,
  wrench: WrenchIcon,
  x: XIcon,
} as const;

export type IconName = keyof typeof registry;

function isIconName(value: string): value is IconName {
  return value in registry;
}

export interface IconProps extends Omit<PhosphorProps, 'weight'> {
  name: IconName | string;
  weight?: 'regular' | 'bold' | 'fill';
}

export function Icon({
  name,
  weight = 'bold',
  size = 18,
  color = colors.inkSoft,
  ...props
}: IconProps) {
  const Component = isIconName(name) ? registry[name] : SparkleIcon;
  return <Component weight={weight} size={size} color={color} {...props} />;
}
