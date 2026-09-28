"use client";

import { useEffect, useState } from "react";

/**
 * Registra el service worker y muestra el botón de instalación de la PWA
 * cuando el navegador lo ofrece (Chrome/Edge en escritorio y Android).
 * En iOS no existe `beforeinstallprompt`, por eso el aviso manual.
 */
export function PwaManager() {
  const [deferred, setDeferred] = useState<{ prompt: () => void } | null>(null);
  const [installed, setInstalled] = useState(false);
  const isIos = typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);
  const [showIosHint, setShowIosHint] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return isIos && !window.matchMedia("(display-mode: standalone)").matches;
  });

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const register = () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {
        /* si el registro falla la web sigue funcionando, solo sin offline */
      });
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as unknown as { prompt: () => void });
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  if (deferred) {
    return (
      <button
        type="button"
        onClick={() => {
          deferred.prompt();
          setDeferred(null);
        }}
        className="fixed bottom-4 right-4 z-80 hidden items-center gap-2 rounded-xl border border-ink-200 bg-paper px-4 py-3 text-xs font-bold uppercase tracking-widest shadow-soft transition-transform hover:-translate-y-0.5 md:flex"
      >
        Instalar la app
      </button>
    );
  }

  if (isIos && showIosHint) {
    return (
      <div className="fixed inset-x-3 bottom-3 z-80 flex items-start gap-3 rounded-2xl border border-ink-200 bg-paper px-4 py-3 shadow-soft md:hidden">
        <div className="flex-1 text-xs leading-relaxed">
          <strong className="block font-bold uppercase tracking-widest">Instala JayLu</strong>
          Toca <span className="font-semibold">Compartir</span> y luego{" "}
          <span className="font-semibold">Añadir a pantalla de inicio</span>.
        </div>
        <button
          type="button"
          onClick={() => setShowIosHint(false)}
          className="text-xs font-bold uppercase text-ink-500"
        >
          Cerrar
        </button>
      </div>
    );
  }

  return null;
}

/** Aviso de conexión: la app sigue funcionando con lo ya descargado. */
export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;
  return (
    <div
      role="status"
      className="sticky top-0 z-95 flex items-center justify-center gap-2 border-b border-ink bg-ink px-3 py-2 text-center text-[0.65rem] font-bold uppercase tracking-widest text-paper"
    >
      <span className="size-2 animate-pulse-dot rounded-full bg-paper" />
      Sin conexión · te mostramos lo que ya tenemos guardado
    </div>
  );
}
