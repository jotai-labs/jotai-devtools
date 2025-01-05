import React, { useMemo } from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { DevTools, type DevToolsProps } from 'jotai-devtools';
import { customRender } from '../custom-render';

const BasicAtomsWithDevTools = (props: DevToolsProps) => {
  // Create atoms inside the component so that they are recreated for each test
  const countAtom = useMemo(() => atom(0), []);
  countAtom.debugLabel = 'countAtom';
  const doubleAtom = useMemo(
    () => atom((get) => get(countAtom) * 2),
    [countAtom],
  );

  doubleAtom.debugLabel = 'doubleCountAtom';

  const count = useAtomValue(countAtom);
  const setCount = useSetAtom(countAtom);
  useAtomValue(doubleAtom);
  return (
    <div>
      <span data-testid="count-atom-value">{count}</span>
      <button onClick={() => setCount((c) => c + 1)}>Increment</button>
      <DevTools isInitialOpen={true} {...props} />
    </div>
  );
};
describe('DevTools - TimeTravel', () => {
  const localStorageSetItemSpy = jest.spyOn(
    window.localStorage.__proto__,
    'setItem',
  );

  const localStorageGetItemSpy = jest.spyOn(
    window.localStorage.__proto__,
    'getItem',
  );

  beforeAll(() => {
    localStorageSetItemSpy.mockImplementation(jest.fn());
    localStorageGetItemSpy.mockImplementation(jest.fn());
  });

  afterAll(() => {
    localStorageSetItemSpy.mockRestore();
    localStorageGetItemSpy.mockRestore();
  });
  describe('Snapshot list', () => {
    it('should render time travel without any errors', () => {
      customRender(<DevTools isInitialOpen={true} />);
      expect(screen.getByText('👻 Jōtai DevTools')).toBeInTheDocument();
      expect(screen.getByText('Time travel')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Time travel'));
      expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Select a snapshot from the left panel to view the details',
        ),
      ).toBeInTheDocument();
      expect(screen.getByTestId('jotai-devtools-shell')).toMatchSnapshot();
    });

    it('should clear the list when user presses the trash icon and show the last snapshot on the right side', () => {
      customRender(<BasicAtomsWithDevTools />);

      fireEvent.click(screen.getByText('Time travel'));
      fireEvent.click(screen.getByLabelText('Record snapshot history'));
      fireEvent.click(screen.getByText('Increment'));
      expect(
        screen.getByTestId('jotai-devtools-snapshot-1'),
      ).toBeInTheDocument();
      fireEvent.click(screen.getByTitle('Clear snapshot history'));
      expect(
        screen.getByTestId('jotai-devtools-snapshot-history-list'),
      ).toBeEmptyDOMElement();
      expect(screen.getByText('Snapshot')).toBeInTheDocument();
      expect(
        screen.queryByText(
          'Select a snapshot from the left panel to view the details',
        ),
      ).not.toBeInTheDocument();
    });

    it('should limit the number of snapshot history based on props', () => {
      customRender(
        <BasicAtomsWithDevTools
          options={{
            snapshotHistoryLimit: 2,
          }}
        />,
      );

      fireEvent.click(screen.getByText('Time travel'));
      fireEvent.click(screen.getByLabelText('Record snapshot history'));
      fireEvent.click(screen.getByText('Increment'));
      fireEvent.click(screen.getByText('Increment'));
      fireEvent.click(screen.getByText('Increment'));
      expect(
        screen.getByTestId('jotai-devtools-snapshot-2'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('jotai-devtools-snapshot-3'),
      ).toBeInTheDocument();
      expect(
        screen.getAllByTestId(/jotai-devtools-snapshot-[0-9]/),
      ).toHaveLength(2);
    });

    describe('snapshot list navigation', () => {
      it('should display next snapshot when user clicks on the next button', async () => {
        customRender(<BasicAtomsWithDevTools />);

        await userEvent.click(screen.getByText('Time travel'));
        await userEvent.click(screen.getByLabelText('Record snapshot history'));
        await userEvent.click(screen.getByText('Increment'));
        await userEvent.click(screen.getByText('Increment'));

        await userEvent.click(screen.getByTestId('jotai-devtools-snapshot-1'));

        await userEvent.click(screen.getByTitle('Select next snapshot'));

        expect(screen.getByText('Snapshot 2')).toBeInTheDocument();
      });

      it('should disable next snapshot button if user has selected the last snapshot', () => {
        customRender(<BasicAtomsWithDevTools />);

        fireEvent.click(screen.getByText('Time travel'));
        fireEvent.click(screen.getByLabelText('Record snapshot history'));
        fireEvent.click(screen.getByText('Increment'));
        fireEvent.click(screen.getByText('Increment'));
        fireEvent.click(screen.getByTestId('jotai-devtools-snapshot-2'));

        expect(screen.getByTitle('Select next snapshot')).toBeDisabled();
      });

      it('should display previous snapshot when user clicks on the previous button', () => {
        customRender(<BasicAtomsWithDevTools />);

        fireEvent.click(screen.getByText('Time travel'));
        fireEvent.click(screen.getByLabelText('Record snapshot history'));
        fireEvent.click(screen.getByText('Increment'));
        fireEvent.click(screen.getByText('Increment'));

        fireEvent.click(screen.getByTestId('jotai-devtools-snapshot-2'));

        fireEvent.click(screen.getByTitle('Select previous snapshot'));

        expect(screen.getByText('Snapshot 1')).toBeInTheDocument();
      });

      it('should disable previous snapshot button if user has selected the first snapshot', () => {
        customRender(<BasicAtomsWithDevTools />);

        fireEvent.click(screen.getByText('Time travel'));
        fireEvent.click(screen.getByLabelText('Record snapshot history'));
        fireEvent.click(screen.getByText('Increment'));
        fireEvent.click(screen.getByText('Increment'));
        fireEvent.click(screen.getByTestId('jotai-devtools-snapshot-1'));

        expect(screen.getByTitle('Select previous snapshot')).toBeDisabled();
      });
    });

    describe('Search', () => {
      it('should search for atoms correctly', async () => {
        customRender(<BasicAtomsWithDevTools />);

        fireEvent.click(screen.getByText('Time travel'));
        fireEvent.click(screen.getByLabelText('Record snapshot history'));
        fireEvent.click(screen.getByText('Increment'));
        fireEvent.click(screen.getByText('Increment'));

        await act(async () => {
          await userEvent.type(screen.getByPlaceholderText('Search'), '2');
        });

        expect(
          screen.getByTestId('jotai-devtools-snapshot-2'),
        ).toBeInTheDocument();

        expect(
          screen.queryByTestId('jotai-devtools-snapshot-1'),
        ).not.toBeInTheDocument();

        expect(
          screen.queryByTestId('jotai-devtools-no-snapshot-found-message'),
        ).not.toBeInTheDocument();

        expect(
          screen.getByTestId('jotai-devtools-time-travel-panel-left-content'),
        ).toMatchSnapshot();
      });

      it('should display an error if no snapshots are found', async () => {
        customRender(<BasicAtomsWithDevTools />);

        fireEvent.click(screen.getByText('Time travel'));
        fireEvent.click(screen.getByLabelText('Record snapshot history'));
        fireEvent.click(screen.getByText('Increment'));

        await act(async () => {
          await userEvent.type(screen.getByPlaceholderText('Search'), 'a');
        });
        expect(
          screen.getByTestId('jotai-devtools-no-snapshot-found-message'),
        ).toHaveTextContent('No snapshots found!');
        expect(
          screen.queryByTestId('jotai-devtools-snapshot-1'),
        ).not.toBeInTheDocument();
        expect(
          screen.getByTestId('jotai-devtools-time-travel-panel-left-content'),
        ).toMatchSnapshot();
      });
    });
    describe('Snapshot history with actions', () => {
      const og = global.performance;
      beforeEach(() => {
        jest.useFakeTimers({ advanceTimers: true });
        jest.setSystemTime(new Date('2023-01-01T10:00:00.000Z'));

        const mockPerformance = {
          timeOrigin: Date.now(),
          now: jest.fn(() => 0),
        };
        global.performance = mockPerformance as unknown as Performance;
      });
      afterEach(() => {
        global.performance = og;
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
      });
      it('should render empty snapshot list when there is action', () => {
        customRender(<BasicAtomsWithDevTools />);
        fireEvent.click(screen.getByText('Time travel'));
        expect(
          screen.getByTestId('jotai-devtools-snapshot-history-list'),
        ).toBeEmptyDOMElement();
      });

      it('should render a snapshot list when there is action but recording is turned off', () => {
        customRender(<BasicAtomsWithDevTools />);
        fireEvent.click(screen.getByText('Time travel'));
        fireEvent.click(screen.getByText('Increment'));
        expect(
          screen.queryByTestId('jotai-devtools-snapshot-1'),
        ).not.toBeInTheDocument();
      });

      it('should render a snapshot list with initial snapshot details on action with recording on', () => {
        customRender(<BasicAtomsWithDevTools />);

        fireEvent.click(screen.getByText('Time travel'));
        fireEvent.click(screen.getByLabelText('Record snapshot history'));
        jest.clearAllTimers();
        fireEvent.click(screen.getByText('Increment'));
        expect(
          screen.getByTestId('jotai-devtools-snapshot-1'),
        ).toBeInTheDocument();
        expect(screen.getByText('Snapshot')).toBeInTheDocument();
        expect(screen.getByText('Meta')).toBeInTheDocument();
        expect(
          screen.getByTestId('meta-info-label-Timestamp'),
        ).toBeInTheDocument();

        expect(screen.getByText('10:00:00.000 AM')).toBeInTheDocument();
        expect(screen.getByText('Value')).toBeInTheDocument();
        expect(screen.getByText('State')).toBeInTheDocument();
        expect(screen.getByText('Diff')).toBeInTheDocument();
        expect(screen.getByText('Actions')).toBeInTheDocument();
        expect(screen.getByText('Restore')).toBeInTheDocument();
        expect(
          screen.getByTestId('jotai-devtools-time-travel-recording-indicator'),
        ).toBeInTheDocument();

        expect(screen.getByTestId('jotai-devtools-shell')).toMatchSnapshot();
      });
    });
  });

  describe('Snapshot details', () => {
    it('should make the restore button disabled if if the states are equal', async () => {
      customRender(<BasicAtomsWithDevTools />);

      fireEvent.click(screen.getByText('Time travel'));
      fireEvent.click(screen.getByLabelText('Record snapshot history'));
      fireEvent.click(screen.getByText('Increment'));
      fireEvent.click(screen.getByTestId('jotai-devtools-snapshot-1'));

      await waitFor(() =>
        expect(screen.getByTitle('Restore this state')).toBeDisabled(),
      );
    });
    it('should display the full state in json tree format when state is selected', () => {
      customRender(<BasicAtomsWithDevTools />);

      fireEvent.click(screen.getByText('Time travel'));
      fireEvent.click(screen.getByLabelText('Record snapshot history'));
      fireEvent.click(screen.getByText('Increment'));
      fireEvent.click(screen.getByTestId('jotai-devtools-snapshot-1'));
      fireEvent.click(screen.getByText('State'));
      expect(screen.getByTestId('json-tree-view-container')).toMatchSnapshot();
    });

    describe('diff', () => {
      const AddMoveRemoveDiffTest = () => {
        const countAtom = useMemo(() => atom(0), []);
        countAtom.debugLabel = 'countAtom';
        // Create atoms inside the component so that they are recreated for each test
        const objectAtom = useMemo(
          () =>
            atom({
              add: {
                arr: [1],
              },
              move: {
                arr: [1, 2],
              },
              remove: {
                arr: [1, 2, 3],
              },
            }),
          [],
        );
        objectAtom.debugLabel = 'objectAtom';

        useAtomValue(objectAtom);
        const setObject = useSetAtom(objectAtom);
        const add = () => {
          setObject((prev) => ({
            ...prev,
            add: {
              arr: [...prev.add.arr, 2],
            },
          }));
        };

        const move = () => {
          setObject((prev) => ({
            ...prev,
            move: {
              arr: [2, 1],
            },
          }));
        };
        const remove = () => {
          setObject((prev) => ({
            ...prev,
            remove: {
              arr: [1, 3],
            },
          }));
        };

        const count = useAtomValue(countAtom);
        const setCount = useSetAtom(countAtom);
        return (
          <div>
            <DevTools
              isInitialOpen={true}
              options={{
                shouldExpandJsonTreeViewInitially: true,
              }}
            />
            <span data-testid="count-atom-value">{count}</span>
            <button onClick={() => setCount((c) => c + 1)}>Increment</button>
            <button onClick={add}>Add</button>
            <button onClick={move}>Move</button>
            <button onClick={remove}>Remove</button>
          </div>
        );
      };

      it('should show "states are equal" msg when there is no diff', () => {
        customRender(<BasicAtomsWithDevTools />);

        fireEvent.click(screen.getByText('Time travel'));
        fireEvent.click(screen.getByLabelText('Record snapshot history'));
        fireEvent.click(screen.getByText('Increment'));
        fireEvent.click(screen.getByTestId('jotai-devtools-snapshot-1'));
        fireEvent.click(screen.getByText('Diff'));
        expect(screen.getByText('(states are equal)')).toBeInTheDocument();
      });

      it('should display highlighted diff', () => {
        customRender(<BasicAtomsWithDevTools />);

        fireEvent.click(screen.getByText('Time travel'));
        fireEvent.click(screen.getByLabelText('Record snapshot history'));
        fireEvent.click(screen.getByText('Increment'));
        fireEvent.click(screen.getByText('Increment'));
        fireEvent.click(screen.getByTestId('jotai-devtools-snapshot-2'));
        fireEvent.click(screen.getByText('Diff'));
        expect(
          screen.getByTestId('jotai-devtools-diff-panel'),
        ).toMatchSnapshot();
      });

      it.each`
        operation
        ${'Add'}
        ${'Move'}
        ${'Remove'}
      `(
        'should display highlighted diff when performing "$operation" on arrays and objects',
        ({ operation }) => {
          customRender(<AddMoveRemoveDiffTest />);

          fireEvent.click(screen.getByText('Time travel'));
          fireEvent.click(screen.getByLabelText('Record snapshot history'));
          fireEvent.click(screen.getByText('Increment'));

          fireEvent.click(screen.getByText(operation));
          fireEvent.click(screen.getByTestId('jotai-devtools-snapshot-2'));
          fireEvent.click(screen.getByText('Diff'));
          expect(
            screen.getByTestId('jotai-devtools-diff-panel'),
          ).toMatchSnapshot();
        },
      );
    });

    it('should restore the snapshot when user clicks on "restore" button', () => {
      customRender(<BasicAtomsWithDevTools />);

      fireEvent.click(screen.getByText('Time travel'));
      fireEvent.click(screen.getByLabelText('Record snapshot history'));
      fireEvent.click(screen.getByText('Increment'));
      fireEvent.click(screen.getByText('Increment'));
      fireEvent.click(screen.getByText('Increment'));
      fireEvent.click(screen.getByTestId('jotai-devtools-snapshot-2'));

      expect(screen.getByTestId('count-atom-value')).toHaveTextContent('3');
      fireEvent.click(screen.getByTitle('Restore this state'));
      expect(screen.getByTestId('count-atom-value')).toHaveTextContent('2');
    });

    it('should not add another snapshot history entry when restoring', () => {
      customRender(<BasicAtomsWithDevTools />);

      fireEvent.click(screen.getByText('Time travel'));
      fireEvent.click(screen.getByLabelText('Record snapshot history'));
      fireEvent.click(screen.getByText('Increment'));
      fireEvent.click(screen.getByText('Increment'));
      fireEvent.click(screen.getByText('Increment'));
      fireEvent.click(screen.getByTestId('jotai-devtools-snapshot-2'));

      expect(
        screen.getAllByTestId(/jotai-devtools-snapshot-[0-9]/),
      ).toHaveLength(3);
      fireEvent.click(screen.getByTitle('Restore this state'));
      expect(
        screen.getAllByTestId(/jotai-devtools-snapshot-[0-9]/),
      ).toHaveLength(3);
    });

    it('should not add another snapshot history entry when restoring an async atom', async () => {
      const countAtom = atom(0);
      countAtom.debugLabel = 'countAtom';
      const asyncAtom = atom<Promise<number> | null>(null);
      asyncAtom.debugLabel = 'asyncAtom';

      let resolvePromise: (value: number) => void = () => {};
      const pendingPromise = new Promise<number>((resolve) => {
        resolvePromise = resolve;
      });

      const AsyncAtomsWithDevTools = () => {
        const [request, setRequest] = useAtom(asyncAtom);
        const setCount = useSetAtom(countAtom);

        const handleFetchClick = async () => {
          setRequest(pendingPromise);
        };

        return (
          <div>
            <DevTools isInitialOpen={true} />
            <span data-testid="request-value">
              {request ? 'Resolved' : 'Pending'}
            </span>
            <button onClick={() => setCount((c) => c + 1)} type="button">
              Increment
            </button>
            <button onClick={handleFetchClick} type="button">
              Fetch
            </button>
          </div>
        );
      };

      customRender(
        <React.Suspense fallback={<div>Loading...</div>}>
          <AsyncAtomsWithDevTools />
        </React.Suspense>,
      );

      fireEvent.click(screen.getByText('Time travel'));
      fireEvent.click(screen.getByLabelText('Record snapshot history'));
      fireEvent.click(screen.getByText('Increment'));

      expect(
        screen.getAllByTestId(/jotai-devtools-snapshot-[0-9]/),
      ).toHaveLength(1);

      await userEvent.click(screen.getByText('Fetch'));

      resolvePromise(1);

      await waitFor(() =>
        expect(
          screen.getAllByTestId(/jotai-devtools-snapshot-[0-9]/),
        ).toHaveLength(3),
      );

      expect(
        screen.getAllByTestId('json-tree-view-container'),
      ).toMatchSnapshot();

      await userEvent.click(screen.getByTestId('jotai-devtools-snapshot-2'));
      expect(
        screen.getAllByTestId('json-tree-view-container'),
      ).toMatchSnapshot();
    });
  });

  describe('Time travel', () => {
    const defaultTravelTime = 750;
    it('should automatically play through the snapshots history when user clicks on "play" button', () => {
      customRender(<BasicAtomsWithDevTools />);

      fireEvent.click(screen.getByText('Time travel'));
      fireEvent.click(screen.getByLabelText('Record snapshot history'));
      fireEvent.click(screen.getByText('Increment'));
      fireEvent.click(screen.getByText('Increment'));
      fireEvent.click(screen.getByText('Increment'));
      expect(screen.getByTestId('count-atom-value')).toHaveTextContent('3');
      jest.useFakeTimers();
      fireEvent.click(screen.getByTitle('Start time travel'));

      act(() => {
        jest.advanceTimersByTime(defaultTravelTime);
      });
      expect(screen.getByTestId('count-atom-value')).toHaveTextContent('1');

      act(() => {
        jest.advanceTimersByTime(defaultTravelTime);
      });
      expect(screen.getByTestId('count-atom-value')).toHaveTextContent('2');

      act(() => {
        jest.advanceTimersByTime(defaultTravelTime);
      });
      expect(screen.getByTestId('count-atom-value')).toHaveTextContent('3');
      jest.useRealTimers();
    });

    it('should pause time travel when user clicks on "pause" button', () => {
      customRender(<BasicAtomsWithDevTools />);

      fireEvent.click(screen.getByText('Time travel'));
      fireEvent.click(screen.getByLabelText('Record snapshot history'));
      fireEvent.click(screen.getByText('Increment'));
      fireEvent.click(screen.getByText('Increment'));
      jest.useFakeTimers();
      fireEvent.click(screen.getByTitle('Start time travel'));

      act(() => {
        jest.advanceTimersByTime(defaultTravelTime);
      });
      expect(screen.getByTestId('count-atom-value')).toHaveTextContent('1');

      fireEvent.click(screen.getByTitle('Pause time travel'));
      act(() => {
        jest.advanceTimersByTime(defaultTravelTime);
      });
      expect(screen.getByTestId('count-atom-value')).toHaveTextContent('1');
      jest.useRealTimers();
    });

    it('should change the "play" button to "pause" button when time travelling', () => {
      customRender(<BasicAtomsWithDevTools />);

      fireEvent.click(screen.getByText('Time travel'));

      fireEvent.click(screen.getByLabelText('Record snapshot history'));
      fireEvent.click(screen.getByText('Increment'));
      jest.useFakeTimers();
      fireEvent.click(screen.getByTitle('Start time travel'));
      expect(screen.getByTitle('Pause time travel')).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(defaultTravelTime);
      });

      expect(screen.getByTitle('Start time travel')).toBeInTheDocument();
      jest.useRealTimers();
    });

    it('should allow user to change the speed of time travel via props', async () => {
      const timeTravelPlaybackInterval = 500;
      customRender(
        <BasicAtomsWithDevTools
          options={{
            timeTravelPlaybackInterval,
          }}
        />,
      );

      await userEvent.click(screen.getByText('Time travel'));
      await userEvent.click(screen.getByLabelText('Record snapshot history'));
      await userEvent.click(screen.getByText('Increment'));
      await userEvent.click(screen.getByText('Increment'));
      jest.useFakeTimers();
      const user = userEvent.setup({ delay: null });
      await user.click(screen.getByTitle('Start time travel'));

      act(() => {
        jest.advanceTimersByTime(timeTravelPlaybackInterval);
      });
      expect(screen.getByTestId('count-atom-value')).toHaveTextContent('1');

      act(() => {
        jest.advanceTimersByTime(timeTravelPlaybackInterval);
      });
      expect(screen.getByTestId('count-atom-value')).toHaveTextContent('2');
      jest.useRealTimers();
    });
    // Interval is calculated using time + time * speed formula
    it.each`
      speed      | interval
      ${'0.5x'}  | ${1500}
      ${'1x'}    | ${750}
      ${'1.5x'}  | ${500}
      ${'1.75x'} | ${428.5}
      ${'2x'}    | ${375}
    `(
      'should change the speed to "$interval" when user selects "$speed" from the dropdown',
      async ({ speed, interval }) => {
        customRender(<BasicAtomsWithDevTools />);

        await userEvent.click(screen.getByText('Time travel'));
        await userEvent.click(screen.getByLabelText('Record snapshot history'));
        await userEvent.click(screen.getByText('Increment'));
        await userEvent.click(screen.getByText('Increment'));

        jest.useFakeTimers();

        const user = userEvent.setup({ delay: null });
        await user.click(
          screen.getByTestId('jotai-devtools-playback-speed-dropdown'),
        );
        await user.click(screen.getByText(speed));
        await user.click(
          screen.getByTestId('jotai-devtools-playback-speed-dropdown'),
        );
        await user.click(screen.getByTitle('Start time travel'));

        act(() => {
          jest.advanceTimersByTime(interval);
        });
        expect(screen.getByTestId('count-atom-value')).toHaveTextContent('1');

        jest.useRealTimers();
      },
    );

    describe('manual time travel', () => {
      it('should restore next snapshot when user clicks on the next button', () => {
        customRender(<BasicAtomsWithDevTools />);

        fireEvent.click(screen.getByText('Time travel'));
        fireEvent.click(screen.getByLabelText('Record snapshot history'));
        fireEvent.click(screen.getByText('Increment'));
        fireEvent.click(screen.getByText('Increment'));

        fireEvent.click(screen.getByTitle('Restore next snapshot'));
        expect(screen.getByTestId('count-atom-value')).toHaveTextContent('1');
      });

      it('should disable next snapshot restore button if user has selected the last snapshot', () => {
        customRender(<BasicAtomsWithDevTools />);

        fireEvent.click(screen.getByText('Time travel'));
        fireEvent.click(screen.getByLabelText('Record snapshot history'));
        fireEvent.click(screen.getByText('Increment'));
        fireEvent.click(screen.getByTitle('Restore next snapshot'));

        expect(screen.getByTitle('Restore next snapshot')).toBeDisabled();
      });

      it('should display previous snapshot when user clicks on the previous snapshot restore button', () => {
        customRender(<BasicAtomsWithDevTools />);

        fireEvent.click(screen.getByText('Time travel'));
        fireEvent.click(screen.getByLabelText('Record snapshot history'));
        fireEvent.click(screen.getByText('Increment'));
        fireEvent.click(screen.getByText('Increment'));

        fireEvent.click(screen.getByTitle('Restore next snapshot'));
        fireEvent.click(screen.getByTitle('Restore next snapshot'));
        expect(screen.getByTestId('count-atom-value')).toHaveTextContent('2');

        fireEvent.click(screen.getByTitle('Restore previous snapshot'));
        expect(screen.getByTestId('count-atom-value')).toHaveTextContent('1');
      });

      it('should disable previous snapshot restore button if user has selected the first snapshot', () => {
        customRender(<BasicAtomsWithDevTools />);

        fireEvent.click(screen.getByText('Time travel'));
        fireEvent.click(screen.getByLabelText('Record snapshot history'));
        fireEvent.click(screen.getByText('Increment'));

        expect(screen.getByTitle('Restore previous snapshot')).toBeDisabled();
      });
    });
  });
});
