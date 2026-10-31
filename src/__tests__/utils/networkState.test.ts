/**
 * Connectivity as the data layer sees it. NetInfo is a native module, so it is
 * replaced with a stand-in that lets the test push state changes.
 */

import NetInfo from '@react-native-community/netinfo';
import type { NetInfoState } from '@react-native-community/netinfo';
import { isNetworkAvailable, isStateOnline } from '@/utils/networkState';

type Reachability = Pick<NetInfoState, 'isConnected' | 'isInternetReachable'>;

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    fetch: jest.fn(() => new Promise(() => undefined)),
    addEventListener: jest.fn(() => jest.fn()),
  },
}));

/** Deliver a state change through the listener the module registered on load. */
const push = (state: Reachability): void => {
  const calls = (NetInfo.addEventListener as unknown as jest.Mock).mock.calls as [
    (next: Reachability) => void,
  ][];
  calls.forEach(([listener]) => listener(state));
};

describe('isStateOnline', () => {
  it('is online with a link and confirmed internet', () => {
    expect(isStateOnline({ isConnected: true, isInternetReachable: true })).toBe(true);
  });

  it('is offline with no link', () => {
    expect(isStateOnline({ isConnected: false, isInternetReachable: null })).toBe(false);
  });

  it('is offline on a link with no internet behind it (captive portal, no data)', () => {
    expect(isStateOnline({ isConnected: true, isInternetReachable: false })).toBe(false);
  });

  it('stays optimistic while reachability is still unknown', () => {
    expect(isStateOnline({ isConnected: true, isInternetReachable: null })).toBe(true);
    expect(isStateOnline({ isConnected: null, isInternetReachable: null })).toBe(true);
  });
});

describe('isNetworkAvailable', () => {
  it('follows reachability changes, not just the link', () => {
    push({ isConnected: true, isInternetReachable: true });
    expect(isNetworkAvailable()).toBe(true);

    push({ isConnected: true, isInternetReachable: false });
    expect(isNetworkAvailable()).toBe(false);

    push({ isConnected: true, isInternetReachable: true });
    expect(isNetworkAvailable()).toBe(true);
  });
});
