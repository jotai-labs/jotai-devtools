import { useAtomValue, useSetAtom } from 'jotai/react';
import { atom } from 'jotai/vanilla';
import { useDevtoolsJotaiStoreOptions } from '../internal-jotai-store';

export type DevToolsOptions = {
  /**
   * Defaults to `false`
   *
   * Private are atoms that are used by Jotai libraries internally to manage state.
   * They're often used internally in atoms like `atomWithStorage` or `atomWithLocation`, etc. to manage state.
   */
  shouldShowPrivateAtoms?: boolean;
  /**
   * Defaults to `false`
   *
   * Expands the JSON tree view fully on Atom Viewer, Timeline, etc.
   */
  shouldExpandJsonTreeViewInitially?: boolean;
};

const defaultDevToolsOptions: DevToolsOptions = {
  shouldShowPrivateAtoms: false,
  shouldExpandJsonTreeViewInitially: false,
};

const internalDevToolsOptions = atom<DevToolsOptions>(defaultDevToolsOptions);

export const devToolsOptionsAtom = atom<
  DevToolsOptions,
  [DevToolsOptions | undefined],
  void
>(
  (get) => {
    return get(internalDevToolsOptions);
  },
  (_, set, options) => {
    const patchWithDefaultsDevToolsOptions = {
      ...defaultDevToolsOptions,
      ...options,
    };

    set(internalDevToolsOptions, patchWithDefaultsDevToolsOptions);
  },
);

export const useSetDevToolsOptions = () =>
  useSetAtom(devToolsOptionsAtom, useDevtoolsJotaiStoreOptions());

export const useDevToolsOptionsValue = () =>
  useAtomValue(devToolsOptionsAtom, useDevtoolsJotaiStoreOptions());
