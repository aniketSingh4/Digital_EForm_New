import { useEffect, useRef } from "react";
import authService from "../services/authService";
import { redirectToLogin } from "../utils/authSession";

export const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
export const IDLE_LOGOUT_FLAG = "eform_idle_logout";

const LAST_ACTIVITY_KEY = "eform_last_activity";
const ACTIVITY_THROTTLE_MS = 1000;
const AUTH_CHANGED_EVENT = "eform-auth-changed";
const ACTIVITY_EVENTS = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"];

const isLoggedIn = () => authService.isAuthenticated() && authService.validateToken();

const getLastActivity = () => {
  const value = Number(localStorage.getItem(LAST_ACTIVITY_KEY));
  return Number.isFinite(value) && value > 0 ? value : 0;
};

const useIdleTimeout = () => {
  const timerRef = useRef(null);
  const lastWriteRef = useRef(0);
  const signingOutRef = useRef(false);

  useEffect(() => {
    const clearTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const signOutIdle = () => {
      if (signingOutRef.current || !isLoggedIn()) {
        return;
      }
      signingOutRef.current = true;
      clearTimer();
      sessionStorage.setItem(IDLE_LOGOUT_FLAG, "1");
      authService.logout();
      localStorage.removeItem(LAST_ACTIVITY_KEY);
      redirectToLogin();
    };

    const schedule = () => {
      clearTimer();
      if (!isLoggedIn()) {
        return;
      }
      const last = getLastActivity();
      const remaining = last ? IDLE_TIMEOUT_MS - (Date.now() - last) : 0;
      if (remaining <= 0) {
        signOutIdle();
        return;
      }
      timerRef.current = setTimeout(signOutIdle, remaining);
    };

    const bump = (force = false) => {
      if (!isLoggedIn()) {
        return;
      }
      const now = Date.now();
      if (!force && now - lastWriteRef.current < ACTIVITY_THROTTLE_MS) {
        return;
      }
      lastWriteRef.current = now;
      localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
      schedule();
    };

    const onActivity = () => bump(false);

    const stop = () => {
      clearTimer();
      localStorage.removeItem(LAST_ACTIVITY_KEY);
      signingOutRef.current = false;
    };

    const onAuthChanged = () => {
      if (isLoggedIn()) {
        signingOutRef.current = false;
        bump(true);
      } else {
        stop();
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        schedule();
      }
    };

    const onStorage = (event) => {
      if (event.key === LAST_ACTIVITY_KEY) {
        if (event.newValue) {
          lastWriteRef.current = Date.now();
          schedule();
        } else {
          clearTimer();
        }
        return;
      }
      if (event.key === "token" && !event.newValue) {
        stop();
        redirectToLogin();
      }
    };

    if (isLoggedIn()) {
      if (!getLastActivity()) {
        bump(true);
      } else {
        schedule();
      }
    }

    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, onActivity, { passive: true });
    });
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("storage", onStorage);
    window.addEventListener(AUTH_CHANGED_EVENT, onAuthChanged);

    return () => {
      clearTimer();
      ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, onActivity);
      });
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
    };
  }, []);
};

export default useIdleTimeout;
