# Jotai DevTools

[![Build Status](https://img.shields.io/github/actions/workflow/status/jotaijs/jotai-devtools/ci.yml?style=flat&colorA=000000&colorB=259e02)](https://github.com/jotaijs/jotai-devtools/actions/workflows/ci.yml)
[![Version](https://img.shields.io/npm/v/jotai-devtools?style=flat&colorA=000000&colorB=259e02)](https://www.npmjs.com/package/jotai-devtools)
[![Version](https://img.shields.io/npm/dw/jotai-devtools?style=flat&colorA=000000&colorB=259e02)](https://www.npmjs.com/package/jotai-devtools)

## 🚀 Features

- Debug 🐞 atom values with ease
- ⏳ Time-travel through your atoms and find bugs faster than before
- Out-of-the-box 🔌 support for async/suspendible atoms
- Built-in Dark mode 🌗
- ✅ Supports custom `store`
- ✅ Works with provider-less mode
- ✅ Works with Next.js
- ✅ Supports custom `nonce` for CSP
- ✅ Hides private atoms with ability to configure
- ✅ Tree-shakable and built for non-production environments
- ✅ Parses all the JavaScript values with JSON Tree view
- ✅ Diff checking with additions and deletion highlights

## 📺 Preview

<p>
    <a href="https://www.npmjs.com/package/jotai-devtools">
      <img alt="Jotai DevTools Screenshot" src="./docs/internal/demo-screenshot.png" width="750"/>
  </a>
</p>

## ☝️ Prerequisites

- Jotai version `>=2.9.0`
- React version `>=17.0.0`

## 📦 Setup

_(See complete setup guide for UI-based devtools below)_

```sh
# yarn
yarn add jotai-devtools

# npm
npm install jotai-devtools --save
```

## ✨ UI DevTools

Enhance your development experience with the UI based Jotai DevTool

[![Demo](https://img.shields.io/badge/demo-%F0%9F%9A%80-green?style=flat&colorA=000000&colorB=259e02)](https://codesandbox.io/s/jotai-devtools-demo-k5p12d)

### Babel plugin setup - (Optional but highly recommended)

Use Jotai babel plugins for optimal debugging experience. Find the complete
guide on [jotai.org](https://jotai.org/docs/tools/babel)

Eg.

```ts
{
  "plugins": [
    // Enables hot reload for atoms
    "jotai/babel/plugin-react-refresh",
    // Automatically adds debug labels to the atoms
    "jotai/babel/plugin-debug-label"
  ]
}
```

### Next JS setup

_You may skip this section if you're not using [Next.js](https://nextjs.org)._

Enable `transpilePackages` for the UI CSS and components to be transpiled
correctly.

```ts
// next.config.ts

const nextConfig = {
  // Learn more here - https://nextjs.org/docs/advanced-features/compiler#module-transpilation
  // Required for font css to be imported correctly 👇
  transpilePackages: ['jotai-devtools'],
};

module.exports = nextConfig;
```

### Available props

```ts
type DevToolsProps = {
  // Defaults to false
  isInitialOpen?: boolean;
  // pass a custom store
  store?: Store;
  // Defaults to light
  theme?: 'dark' | 'light';
  // Defaults to 'bottom-left'
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  // Custom nonce to allowlist jotai-devtools specific inline styles via CSP
  nonce?: string;
  // We recommend keeping these options static. i.e. set it only once. Avoid connecting it to re-renderable state
  options?: {
    // Private atoms are used internally in atoms like `atomWithStorage` or `atomWithLocation`, etc. to manage state.
    // Defaults to `false`
    shouldShowPrivateAtoms?: boolean;
    // Expands the JSON tree view on initial render on Atom Viewer tab, Timeline tab, etc.
    // Defaults to `false`
    shouldExpandJsonTreeViewInitially?: boolean;
    // The interval (in milliseconds) between each step of the time travel playback.
    // Defaults to `750ms`
    timeTravelPlaybackInterval?: number;
    // The maximum number of snapshots to keep in the history.
    // The higher the number the more memory it will consume.
    // Defaults to `Infinity`. Recommended: `~30`
    snapshotHistoryLimit?: number;
  };
};
```

### Provider-less

```tsx
import { DevTools } from 'jotai-devtools';
// Note that this may get included in your production builds. Please import it conditionally if you want to avoid that
import 'jotai-devtools/styles.css';

const App = () => {
  return (
    <>
      <DevTools />
      {/* your app */}
    </>
  );
};
```

### With Provider

```tsx
import { createStore } from 'jotai';
import { DevTools } from 'jotai-devtools';
// Note that this may get included in your production builds. Please import it conditionally if you want to avoid that
import 'jotai-devtools/styles.css';

const customStore = createStore();

const App = () => {
  return (
    <Provider store={customStore}>
      <DevTools store={customStore} />
      {/* your app */}
    </Provider>
  );
};
```

## Hooks

Detailed documentation is available on
[https://jotai.org/docs/api/devtools](https://jotai.org/docs/api/devtools)

```tsx
import {
  useAtomsSnapshot,
  useGotoAtomsSnapshot,
  useAtomsDebugValue,
  // Redux devtool hooks
  useAtomDevtools,
  useAtomsDevtools,
} from 'jotai-devtools';
```

## Migration guides

### Migrate ƒrom @emotion/react to native CSS

With the latest release, Jotai DevTools no longer depends on `@emotion/react`
and is replaced it with native CSS.

1. Remove `@emotion/react` from your dependencies

   ```sh
   # yarn
   yarn remove @emotion/react

   # npm
   npm uninstall @emotion/react
   ```

2. Replace `@emotion/react` with `jotai-devtools/styles.css` in your code

Note that this css file may get included in your production builds please import
it conditionally if you want to avoid that, e.g.:

```diff
import { DevTools } from 'jotai-devtools';
+ 
+ if (process.env.NODE_ENV === 'development') {
+     require('jotai-devtools/styles.css')
+ }
```

### Migrate Jotai to V2

Find the official migration guide on
[jotai.org](https://jotai.org/docs/guides/migrating-to-v2-api)

### Migrate `jotai/react/devtools` to `jotai-devtools`

1. Install this package

   ```sh
   # npm
   npm install jotai-devtools --save

   # yarn
   yarn add jotai-devtools
   ```

2. Update imports from `jotai/react/devtools` to `jotai-devtools`
   ```diff
   import {
    useAtomsSnapshot,
    useGotoAtomsSnapshot,
    useAtomsDebugValue,
    // Redux devtool integration hooks
    useAtomDevtools,
    useAtomsDevtools,
   - } from 'jotai/react/devtools';
   + } from 'jotai-devtools';
   ```

### Inspirations

[Redux DevTools](https://github.com/reduxjs/redux-devtools)
[React Query DevTools](https://tanstack.com/query/v4/docs/react/devtools)

### Other announcements

✨ [First announcement](https://twitter.com/dai_shi/status/1611717249471246338)
