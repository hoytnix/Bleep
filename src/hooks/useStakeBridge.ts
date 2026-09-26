import { useState, useEffect, useCallback, useRef } from 'react';
import { StakeRgsPayload } from '../game/math';

export interface StakeSession {
  token: string | null;
  currency: string;
  currencySymbol: string;
  lang: string;
  mode: 'real' | 'demo';
  initialBalance: number;
  isStakeIframe: boolean;
  rgsUrl: string | null;
}

export interface UseStakeBridgeReturn {
  session: StakeSession;
  currencySymbol: string;
  formatCurrency: (amount: number) => string;
  postGameReady: () => void;
  postRoundCompleted: (payload: StakeRgsPayload, finalBalance: number, wager: number) => void;
  postBetChange: (bet: number) => void;
  setSessionBalance: (balance: number) => void;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  USDT: '$',
  USDC: '$',
  EUR: '€',
  GBP: '£',
  CAD: 'C$',
  AUD: 'A$',
  BRL: 'R$',
  JPY: '¥',
  KRW: '₩',
  INR: '₹',
  BTC: '₿',
  ETH: 'Ξ',
  LTC: 'Ł',
  DOGE: 'Ð',
  TRX: 'TRX ',
  SOL: 'SOL ',
};

export function parseStakeUrlParams(): StakeSession {
  if (typeof window === 'undefined') {
    return {
      token: null,
      currency: 'USD',
      currencySymbol: '$',
      lang: 'en',
      mode: 'demo',
      initialBalance: 5000,
      isStakeIframe: false,
      rgsUrl: null,
    };
  }

  const searchParams = new URLSearchParams(window.location.search);
  const token = searchParams.get('token') || searchParams.get('session_id') || null;
  const rawCurrency = (searchParams.get('currency') || 'USD').toUpperCase();
  const lang = searchParams.get('lang') || 'en';
  const rawMode = searchParams.get('mode')?.toLowerCase();
  const mode: 'real' | 'demo' = rawMode === 'real' || (token !== null && rawMode !== 'demo') ? 'real' : 'demo';
  
  const rawBalance = searchParams.get('balance');
  const parsedBalance = rawBalance ? parseFloat(rawBalance) : 5000;
  const initialBalance = isNaN(parsedBalance) || parsedBalance <= 0 ? 5000 : parsedBalance;

  const rgsUrl = searchParams.get('rgs_url') || searchParams.get('rgsUrl') || null;
  const isStakeIframe = window.parent !== window;
  const currencySymbol = CURRENCY_SYMBOLS[rawCurrency] || `${rawCurrency} `;

  return {
    token,
    currency: rawCurrency,
    currencySymbol,
    lang,
    mode,
    initialBalance,
    isStakeIframe,
    rgsUrl,
  };
}

export function useStakeBridge(onExternalBalanceUpdate?: (balance: number) => void): UseStakeBridgeReturn {
  const [session, setSession] = useState<StakeSession>(parseStakeUrlParams);
  const gameReadySentRef = useRef<boolean>(false);

  // Format currency with symbol
  const formatCurrency = useCallback(
    (amount: number) => {
      const sym = session.currencySymbol;
      const formattedNum = amount.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });

      // Crypto formatting (BTC/ETH suffix or prefix)
      if (session.currency === 'BTC' || session.currency === 'ETH') {
        return `${sym}${formattedNum}`;
      }
      return `${sym}${formattedNum}`;
    },
    [session.currency, session.currencySymbol]
  );

  // Post GAME_READY to parent iframe
  const postGameReady = useCallback(() => {
    if (typeof window === 'undefined') return;

    const message = {
      type: 'GAME_READY',
      gameId: 'wysiwyg_cash_machine',
      version: '1.0.0',
      currency: session.currency,
      mode: session.mode,
      token: session.token,
      timestamp: Date.now(),
    };

    try {
      window.parent.postMessage(message, '*');
      gameReadySentRef.current = true;
    } catch (e) {
      console.warn('Stake bridge: Failed to postMessage GAME_READY:', e);
    }
  }, [session.currency, session.mode, session.token]);

  // Post ROUND_COMPLETED to parent iframe
  const postRoundCompleted = useCallback(
    (payload: StakeRgsPayload, finalBalance: number, wager: number) => {
      if (typeof window === 'undefined') return;

      const message = {
        type: 'ROUND_COMPLETED',
        gameId: 'wysiwyg_cash_machine',
        roundId: payload.roundId,
        wager,
        creditsWon: payload.creditsWon,
        payout: payload.payout,
        finalBalance,
        serverSeedHash: payload.serverSeedHash,
        clientSeed: payload.clientSeed,
        nonce: payload.nonce,
        stops: payload.stops,
        multiplier: payload.multiplier,
        isWheel: payload.isWheel,
        isRespin: payload.isRespin,
        redSpinTriggered: payload.red_spin_triggered || payload.redSpinTriggered,
        timestamp: Date.now(),
      };

      try {
        window.parent.postMessage(message, '*');
      } catch (e) {
        console.warn('Stake bridge: Failed to postMessage ROUND_COMPLETED:', e);
      }
    },
    []
  );

  // Post BET_CHANGED to parent iframe
  const postBetChange = useCallback(
    (bet: number) => {
      if (typeof window === 'undefined') return;

      const message = {
        type: 'BET_CHANGED',
        gameId: 'wysiwyg_cash_machine',
        bet,
        currency: session.currency,
        timestamp: Date.now(),
      };

      try {
        window.parent.postMessage(message, '*');
      } catch (e) {
        console.warn('Stake bridge: Failed to postMessage BET_CHANGED:', e);
      }
    },
    [session.currency]
  );

  const setSessionBalance = useCallback((balance: number) => {
    setSession((prev) => ({ ...prev, initialBalance: balance }));
  }, []);

  // Listen for inbound messages from parent iframe
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleMessage = (event: MessageEvent) => {
      // Validate message structure
      if (!event.data || typeof event.data !== 'object') return;

      const { type, balance, currency, token, lang } = event.data;

      if (type === 'SET_BALANCE' && typeof balance === 'number') {
        setSession((prev) => ({ ...prev, initialBalance: balance }));
        if (onExternalBalanceUpdate) {
          onExternalBalanceUpdate(balance);
        }
      } else if (type === 'SET_CURRENCY' && typeof currency === 'string') {
        const upper = currency.toUpperCase();
        setSession((prev) => ({
          ...prev,
          currency: upper,
          currencySymbol: CURRENCY_SYMBOLS[upper] || `${upper} `,
        }));
      } else if (type === 'SET_TOKEN' && typeof token === 'string') {
        setSession((prev) => ({
          ...prev,
          token,
          mode: 'real',
        }));
      } else if (type === 'SET_LANG' && typeof lang === 'string') {
        setSession((prev) => ({ ...prev, lang }));
      } else if (type === 'PING') {
        window.parent.postMessage({ type: 'PONG', timestamp: Date.now() }, '*');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onExternalBalanceUpdate]);

  return {
    session,
    currencySymbol: session.currencySymbol,
    formatCurrency,
    postGameReady,
    postRoundCompleted,
    postBetChange,
    setSessionBalance,
  };
}
