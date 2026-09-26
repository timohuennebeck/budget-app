This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

## Project conventions

- Feature-based folders: `src/features/<feature>/{components,hooks,lib,data}` and `src/shared/{ui,components,lib,hooks,data,i18n}`. Route files in `src/app` stay thin and render feature screens.
- File names are kebab-case (`entry-row.tsx`, not `EntryRow.tsx`).
- Prefer `interface` over `type` for object shapes.
- Comments are at most 6 lines, including block comments.
- Style with Tailwind classes (Uniwind) and merge them with `cn()` from `@/shared/lib/cn` (built on `extendTailwindMerge`). Theme tokens live in `src/global.css`; raw values for SVG/gradients in `@/shared/lib/theme`.
- Use `useSafeAreaInsets()` for anything that touches the screen edges (see `Screen`).
- Every pressable goes through `@/shared/ui/pressable` (or `Button` / `IconButton` / `Chip`) so main actions trigger haptics.
- Bottom sheets: `useSheet()` + a component built on `Sheet` from `@/shared/components/sheet`; spread `sheet.controls`.
- All user-facing text goes through i18next (`src/shared/i18n/locales/*.json`, English is the source language). Keys are type-checked against `en.json`; add new strings there first, then to every other locale.
- Supabase: add schema changes as new files in `supabase/migrations`, then run `npm run db:types`.
- Server data: TanStack Query with one key factory per feature (`@lukemorales/query-key-factory`) in `data/<feature>-queries.ts`. Use `useQuery(entryQueries.range(range))`; never write query keys by hand.
- Mutations are optimistic: `snapshot()` the affected queries in `onMutate`, write the expected result to the cache, `restore()` in `onError`, invalidate the feature's `_def` in `onSettled`, and set `meta: { optimistic: true }` so a failure shows the shared alert. Create rows with a client id (`randomUUID` from `expo-crypto`), and navigate without waiting for the server.
- Local storage: MMKV through `@/shared/lib/storage` (`storage` for values, `persistStorage` for zustand `persist`). No AsyncStorage or localStorage.
