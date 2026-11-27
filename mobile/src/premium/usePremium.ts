import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import type { CustomerInfo } from 'react-native-purchases';
import { accessUntil } from './core';
import { billingMode, initialize } from './service';

export function usePremium(consent: boolean, prefsReady: boolean) {
  const [info, setInfo] = useState<CustomerInfo | null>(null);
  const [checked, setChecked] = useState(false);
  const [clock, setClock] = useState(Date.now);
  const version = useRef(0);
  const updateCustomer = useCallback((next: CustomerInfo) => {
    version.current++;
    setClock(Date.now());
    setInfo(next);
    setChecked(true);
  }, []);

  useEffect(() => {
    if (!consent) {
      let current = true;
      Promise.resolve().then(() => { if (current) { setInfo(null); setChecked(false); } });
      return () => { current = false; };
    }
    let alive = true;
    let stopListening: (() => void) | undefined;
    const refresh = async () => {
      const sequence = ++version.current;
      try {
        const sdk = await initialize();
        if (!alive) return;
        if (!stopListening) {
          const listener = (next: CustomerInfo) => { if (alive) updateCustomer(next); };
          sdk.addCustomerInfoUpdateListener(listener);
          stopListening = () => sdk.removeCustomerInfoUpdateListener(listener);
        }
        const next = await sdk.getCustomerInfo();
        if (alive && sequence === version.current) updateCustomer(next);
      } catch {
        // Previously verified local access still expires on its original deadline.
        if (alive) setChecked(true);
      }
    };
    void refresh();
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        setClock(Date.now());
        void refresh();
      }
    });
    const interval = setInterval(() => {
      if (AppState.currentState === 'active') void refresh();
    }, 5 * 60 * 1000);
    return () => { alive = false; clearInterval(interval); stopListening?.(); sub.remove(); };
  }, [consent, updateCustomer]);

  const deadline = consent && info ? accessUntil(info, billingMode() === 'play') : 0;
  useEffect(() => {
    const delay = deadline - Date.now();
    if (delay <= 0) return;
    const timer = setTimeout(() => setClock(Date.now()), delay + 1);
    return () => clearTimeout(timer);
  }, [deadline]);
  return { proReady: prefsReady && (!consent || checked), proActive: deadline > clock, updateCustomer };
}
