import * as React from 'react';
import { useState } from 'react';
import { Title } from '@mantine/core';
import { atom, useAtom } from 'jotai';
import {
  atomWithDefault,
  atomWithObservable,
  loadable,
  splitAtom,
  unwrap,
} from 'jotai/vanilla/utils';
import { atomsWithQuery } from 'jotai-tanstack-query';
import { ErrorBoundary } from 'react-error-boundary';
import { interval } from 'rxjs';
import { map } from 'rxjs/operators';
import { Async } from './Async';
import { Counter } from './Counter';

const baseCountAtom = atom(1);
baseCountAtom.debugLabel = 'baseCountAtom';

const countAtomWithDefaultAtom = atomWithDefault(
  (get) => get(baseCountAtom) * 2,
);
countAtomWithDefaultAtom.debugLabel = 'countAtomWithDefaultAtom';

const counterSubject = interval(1000).pipe(map((i) => `#${i}`));
const counterAtom = atomWithObservable(() => counterSubject);
counterAtom.debugLabel = 'counterAtom';

const asyncAtom = atom(async (get) => {
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      clearTimeout(timer);
      resolve('Resolved data');
    }, 1000);
  });
});

asyncAtom.debugLabel = 'asyncAtom';

const loadableAtom = loadable(asyncAtom);
loadableAtom.debugLabel = 'loadableAtom';

const someRandomArray = [
  {
    id: 1,
    name: 'John',
  },
  {
    id: 2,
    name: 'Jane',
  },
];

const arrayAtom = atom(someRandomArray);
arrayAtom.debugLabel = 'arrayAtom';

const splitAtomAtom = splitAtom(arrayAtom);
splitAtomAtom.debugLabel = 'splitAtomAtom';

const asyncArrayAtom = atom(async () => someRandomArray);
asyncArrayAtom.debugLabel = 'asyncArrayAtom';

const splitAsyncAtom = splitAtom(unwrap(asyncArrayAtom, () => []));
splitAsyncAtom.debugLabel = 'splitAsyncAtom';

const idAtom = atom(1);
idAtom.debugLabel = 'idAtom';

const [userAtom] = atomsWithQuery((get) => ({
  queryKey: ['users', get(idAtom)],
  queryFn: async ({ queryKey: [, id] }) => {
    const res = await fetch(`https://jsonplaceholder.typicode.com/users/${id}`);
    return res.json();
  },
}));
userAtom.debugLabel = 'userAtom';

const UserData = () => {
  const [data] = useAtom(userAtom);
  return <div>{JSON.stringify(data)}</div>;
};

class CircularClass {
  circular: any;
  constructor() {
    this.circular = this;
  }
}

const circularObject: InstanceType<typeof CircularClass> = new CircularClass();

const circularAtom = atom(circularObject);
circularAtom.debugLabel = 'circularAtom';
circularAtom.debugPrivate = true;

const anAtomWithObject = atom((get) => ({
  count: get(baseCountAtom),
  0: 'some string',
  a: 1,
  b: {
    c: {
      d: ['h', 'e', 'l', 'l', { o: 'world' }, { o: 'world' }],
      e: [new Date(), 2, 3, () => {}, () => true, true, null, undefined],
    },
    d: {
      e: Symbol('e'),
      f: Number.MAX_SAFE_INTEGER,
    },
    2: () => {
      const name = 'John';
      return `Hello ${name}!`;
    },
    3: true,
    4: null,
    5: undefined,
  },
}));

anAtomWithObject.debugLabel = 'anAtomWithObject';

const aVeryBigSetOfAtoms = Array.from({ length: 5000 }, (_, i) => {
  const anAtom = atom(i);
  anAtom.debugLabel = `anAtom${i}`;
  return anAtom;
});
const anBigAtomHolder = atom((get) => {
  return aVeryBigSetOfAtoms.map((a) => get(a));
});
anBigAtomHolder.debugLabel = 'anBigAtomHolder';

const uselessCount = atom(0);
uselessCount.debugLabel = 'frozenCountAtom';
// uselessCount.debugLabel
const FrozenCounter = () => {
  const [count, setUselessCount] = useAtom(uselessCount);
  return (
    <div>
      <pre>useless count:{count}</pre>
      <button
        onClick={() => {
          setUselessCount((p) => p);
        }}
      >
        click
      </button>
    </div>
  );
};
const countAtomA = atom(1);
countAtomA.debugLabel = 'countAtomA';

export const Playground = () => {
  // useAtomValue(countAtomWithDefaultAtom);
  // useAtomValue(countAtomA);
  // useAtomValue(countAtomADupe);
  const [resetKey, setResetKey] = useState(0);

  return (
    <>
      <Title>Playground</Title>
      <Counter />
      <FrozenCounter />
      <ErrorBoundary
        key={resetKey}
        fallback={
          <div>
            Error{' '}
            <button onClick={() => setResetKey((p) => p + 1)}>Reset</button>
          </div>
        }
      >
        <React.Suspense fallback={<div>Loading...</div>}>
          <Async />
        </React.Suspense>
      </ErrorBoundary>
      {/* <UserData /> */}
      {/* <SomeComponentWithToggle /> */}
    </>
  );
};
