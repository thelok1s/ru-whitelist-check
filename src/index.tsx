import { hydrate, prerender as ssr } from "preact-iso";
import { useEffect, useState } from "preact/hooks";
import "./globals.css";
import { checkIpInWhitelist, CheckResult } from "./lib/check_ip";
import { fetchWhois, WhoisData } from "./lib/whois";

import en from "./locales/en.json";
import ru from "./locales/ru.json";

const locales = { en, ru };
type Lang = keyof typeof locales;

function getNested(obj: any, path: string, context?: string) {
  const keys = path.split(".");
  let current = obj;
  for (const key of keys) {
    if (current[key] === undefined) return path;
    current = current[key];
  }
  if (typeof current === "string" && context) {
    return current.replace("{{context}}", context);
  }
  return current;
}

export function App() {
  // Default to 'ru' to ensure SSR match. Can be enhanced with cookies or effect for client pref.
  const [lang, setLang] = useState<Lang>("ru");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("lang") as Lang;
      if (saved && locales[saved]) {
        setLang(saved);
      } else if (navigator.language.startsWith("en")) {
        setLang("en");
      }
    }
  }, []);

  const t = (path: string, context?: string) =>
    getNested(locales[lang], path, context);

  const toggleLang = () => {
    const newLang = lang === "ru" ? "en" : "ru";
    setLang(newLang);
    if (typeof window !== "undefined") {
      localStorage.setItem("lang", newLang);
    }
  };

  const [ipinput, setIpinput] = useState("");
  const [result, setResult] = useState<CheckResult | null>(null);
  const [whois, setWhois] = useState<WhoisData | null>(null);
  const [loading, setLoading] = useState(false);

  const handleIpInput = (e: any) => {
    setIpinput(e.target.value);
    // Clear result if user modifies input to avoid confusion
    if (result) setResult(null);
    if (whois) setWhois(null);
  };

  const performCheck = async (ip: string) => {
    if (!ip) return;
    setLoading(true);
    setResult(null);
    setWhois(null);

    try {
      // Run checks in parallel
      const [wlRes, whoisRes] = await Promise.all([
        checkIpInWhitelist(ip),
        fetchWhois(ip),
      ]);

      setResult(wlRes);
      setWhois(whoisRes);
    } catch (e) {
      console.error("Check failed", e);
    } finally {
      setLoading(false);
    }
  };

  // Debounce the check logic
  useEffect(() => {
    if (!ipinput) {
      setResult(null);
      setWhois(null);
      return;
    }

    const timer = setTimeout(() => {
      performCheck(ipinput);
    }, 1000); // 1s delay to avoid spamming while typing

    return () => clearTimeout(timer);
  }, [ipinput]);

  // Eagerly load whitelists on mount so checking is faster
  useEffect(() => {
    // 0.0.0.0 is a valid IP format, so this will trigger the whitelist fetch and cache
    checkIpInWhitelist("0.0.0.0").catch(() => {});
  }, []);

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    performCheck(ipinput);
  };

  return (
    <div className="w-screen h-screen flex flex-col gap-8 items-center justify-center bg-base-200 p-4 relative">
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleLang}
          className="btn btn-ghost btn-sm uppercase font-bold"
        >
          {lang}
        </button>
      </div>

      <h1 className="text-3xl font-bold text-center">{t("app.title")}</h1>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 w-full max-w-md"
      >
        <div className="join w-full">
          <input
            pattern="^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$"
            required
            type="text"
            placeholder={t("app.elements.input_placeholder")}
            className="input input-bordered w-full join-item"
            value={ipinput}
            onInput={handleIpInput}
          />
          <button
            type="submit"
            className="btn btn-primary join-item"
            disabled={loading || !ipinput}
          >
            {loading ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              t("app.elements.button")
            )}
          </button>
        </div>
      </form>

      <div className="min-h-[8rem] w-full max-w-md flex flex-col items-center gap-4">
        {loading && (
          <div className="flex flex-col items-center gap-2 opacity-60 mt-4">
            <span className="loading loading-dots loading-lg"></span>
            <span className="text-sm">{t("app.elements.load")}</span>
          </div>
        )}

        {!loading && result && (
          <div
            role="alert"
            className={`w-full alert ${result.whitelisted ? "alert-success" : "alert-error"} shadow-lg transition-all duration-300`}
          >
            <div className="flex flex-col text-left">
              <span className="font-bold">
                {result.whitelisted
                  ? t("app.result.whitelisted")
                  : t("app.result.not_whitelisted")}
              </span>
              <span className="text-xs opacity-90">
                {t(`app.result.reasons.${result.reason}`, result.context)}
              </span>
            </div>
          </div>
        )}

        {!loading && whois && (
          <div className="card w-full bg-base-100 border border-base-300 ">
            <div className="card-body p-4 text-sm">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div className="flex flex-col">
                  <span className="opacity-60 text-xs uppercase font-semibold">
                    {t("app.whois.city_region")}
                  </span>
                  <span>{whois.cityName}</span>
                </div>
                <div className="flex flex-col">
                  <span className="opacity-60 text-xs uppercase font-semibold">
                    {t("app.whois.asn")}
                  </span>
                  <span>{whois.asnOrganization}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

if (typeof window !== "undefined") {
  const appContainer = document.getElementById("app");
  hydrate(<App />, appContainer || document.body);
}

export async function prerender(data: Record<string, unknown>) {
  return await ssr(<App {...data} />);
}
