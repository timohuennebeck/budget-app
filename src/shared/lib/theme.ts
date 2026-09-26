// Raw values for props that can't take class names (SVG icons, gradients,
// shadows). Keep in sync with the @theme tokens in src/global.css.
export const colors = {
  primary: '#2F7CF6',
  primaryDark: '#1F63D6',
  primarySoft: '#DCE8FC',
  primaryTint: '#EAF2FE',
  ink: '#15181F',
  inkSoft: '#3E4553',
  icon: '#3B3944',
  muted: '#5E6676',
  mutedSoft: '#72798A',
  subtle: '#8A92A3',
  faint: '#A3ABBA',
  chevron: '#B5BCC9',
  canvas: '#F7F9FC',
  white: '#FFFFFF',
  calendarRed: '#DB4241',
} as const;

export const gradients = {
  /** Start, entries and other main screens */
  sky: ['#DDEAFE', '#EAF2FE', '#F7F9FC'] as const,
  skyStops: [0, 0.3, 0.52] as const,
  /** Welcome, results and success screens */
  mist: ['#E6F0FE', '#F1F5FA', '#F7F9FC'] as const,
  mistStops: [0, 0.45, 0.65] as const,
  /** Illustration panels inside cards */
  panel: ['#EAF2FE', '#E1ECFD'] as const,
};

export const shadows = {
  card: {
    shadowColor: '#15181F',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  floating: {
    shadowColor: '#15181F',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  primary: {
    shadowColor: '#2F7CF6',
    shadowOpacity: 0.32,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  sheet: {
    shadowColor: '#15181F',
    shadowOpacity: 0.24,
    shadowRadius: 48,
    shadowOffset: { width: 0, height: 20 },
    elevation: 16,
  },
} as const;
