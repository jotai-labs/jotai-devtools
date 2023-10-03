import { useEffect, useRef } from 'react';
import { AnyAtom, AnyAtomValue, AtomsSnapshot, Options } from '../types';
import { useReduxConnection } from './redux-extension/useReduxConnection';
import { useAtomsSnapshot } from './useAtomsSnapshot';
import { useDidMount } from './useDidMount';
import { useGotoAtomsSnapshot } from './useGotoAtomsSnapshot';

const atomToPrintable = (atom: AnyAtom) =>
  atom.debugLabel ? `${atom}:${atom.debugLabel}` : `${atom}`;

const getDevtoolsState = (atomsSnapshot: AtomsSnapshot) => {
  const values: Record<string, AnyAtomValue> = {};
  atomsSnapshot.values.forEach((v, atom) => {
    values[atomToPrintable(atom)] = v;
  });
  const dependents: Record<string, string[]> = {};
  atomsSnapshot.dependents.forEach((d, atom) => {
    dependents[atomToPrintable(atom)] = Array.from(d).map(atomToPrintable);
  });
  return {
    values,
    dependents,
  };
};

type DevtoolsOptions = Options & {
  enabled?: boolean;
};

export function useAtomsDevtools(
  name: string,
  options?: DevtoolsOptions,
): void {
  const { enabled } = options || {};
  const didMount = useDidMount();

  // This an exception, we don't usually use utils in themselves!
  const atomsSnapshot = useAtomsSnapshot(options);
  const goToSnapshot = useGotoAtomsSnapshot(options);

  const isTimeTraveling = useRef(false);
  const isRecording = useRef(true);
  const snapshots = useRef<AtomsSnapshot[]>([]);

  const connection = useReduxConnection({
    name,
    enabled,
    initialValue: undefined,
    disconnectAllOnCleanup: true,
  });

  useEffect(() => {
    if (!connection.current) return;

    const getSnapshotAt = (index = snapshots.current.length - 1) => {
      // index 0 is @@INIT, so we need to return the next action (0)
      const snapshot = snapshots.current[index >= 0 ? index : 0];
      if (!snapshot) {
        throw new Error('snapshot index out of bounds');
      }
      return snapshot;
    };

    const unsubscribe = connection.current.subscribe((message) => {
      switch (message.type) {
        case 'DISPATCH':
          switch (message.payload?.type) {
            case 'RESET':
              // TODO
              break;

            case 'COMMIT':
              connection.current?.init(getDevtoolsState(getSnapshotAt()));
              snapshots.current = [];
              break;

            case 'JUMP_TO_ACTION':
            case 'JUMP_TO_STATE':
              isTimeTraveling.current = true;
              goToSnapshot(getSnapshotAt(message.payload.actionId - 1));
              break;

            case 'PAUSE_RECORDING':
              isRecording.current = !isRecording.current;
              break;
          }
      }
    });

    return unsubscribe;
  }, [connection, goToSnapshot]);

  useEffect(() => {
    if (!connection.current || !didMount) return;

    if (isTimeTraveling.current) {
      isTimeTraveling.current = false;
    } else if (isRecording.current) {
      snapshots.current.push(atomsSnapshot);
      connection.current.send(
        {
          type: `${snapshots.current.length}`,
          updatedAt: new Date().toLocaleString(),
        } as any,
        getDevtoolsState(atomsSnapshot),
      );
    }
  }, [atomsSnapshot, connection, didMount]);
}
