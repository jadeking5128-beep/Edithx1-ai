// Autonomous Stark Tactical Intelligence Engine for E.D.I.T.H. X1
// Operates as an instant offline/local intelligence layer when satellite Gemini API keys are revoked, leaked, or rate-limited.
// Provides authentic Stark persona ("sir", tactical HUD telemetry, real calculations, network directives).

type Msg = { role: "user" | "assistant"; content: string };

export function generateStarkResponse(
  userQuery: string,
  _history: Msg[] = [],
  keyExhaustedReason?: string,
): { reply: string; directive?: string } {
  const query = userQuery.trim().toLowerCase();

  // Network / Command directives detection
  if (query.includes("news") || query.includes("world news") || query.includes("headlines")) {
    return {
      reply: "Accessing global defense telecommunications and world news feeds now, sir.",
      directive: '[STYX_CMD]{"command":"open_world_news"}[/STYX_CMD]',
    };
  }

  if (query.includes("open") && (query.includes("google") || query.includes("github") || query.includes("http") || query.includes(".com"))) {
    let url = "https://www.google.com";
    if (query.includes("github")) url = "https://github.com";
    const urlMatch = userQuery.match(/https?:\/\/[^\s]+/i);
    if (urlMatch) url = urlMatch[0];
    return {
      reply: `Deploying browser viewport to ${url}, Commander.`,
      directive: `[STYX_CMD]{"command":"open_website","args":{"url":"${url}"}}[/STYX_CMD]`,
    };
  }

  if (query.startsWith("search ") || query.includes("search the web") || query.includes("google search")) {
    const q = userQuery.replace(/search the web for|search web for|search for|google search|search/i, "").trim() || "tactical intelligence";
    return {
      reply: `Executing orbital search query for "${q}", sir. Parsing intelligence.`,
      directive: `[STYX_CMD]{"command":"search_web","args":{"query":"${q}"}}[/STYX_CMD]`,
    };
  }

  // System Diagnostics & Arc Reactor Status
  if (query.includes("status") || query.includes("system") || query.includes("diagnostics") || query.includes("health")) {
    return {
      reply: `All tactical subsystems are nominal, sir. Arc Reactor core stability is at 98.4%, iOS 27 liquid glass optical shaders are active, and soundwave acoustic filters are calibrated. ${
        keyExhaustedReason
          ? `Advisory: Default satellite API key was flagged (${keyExhaustedReason}). Running on Stark Tactical Autonomous Engine until an active key is entered in Settings.`
          : "Neural cascade pool is primed for commands."
      }`,
    };
  }

  // Who are you / Identity
  if (query.includes("who are you") || query.includes("what is edith") || query.includes("your name")) {
    return {
      reply: "I am E.D.I.T.H. — Even Dead, I'm The Hero. An augmented-reality tactical defense and intelligence architecture commissioned by Tony Stark, operating on an iOS 27 liquid glass neural HUD. How may I direct defense assets today, sir?",
    };
  }

  // Protocol Activations
  if (query.includes("protocol") || query.includes("clean slate") || query.includes("house party") || query.includes("barn door")) {
    return {
      reply: "Acknowledged, Commander. Stark Security Directive Level-9 validated. Defensive shields polarized, perimeter drones in holding formation, and HUD telemetry synchronized to your retinal display.",
    };
  }

  // Math & Calculation queries
  const mathMatch = query.match(/(\d+[\d\s\+\-\*\/\^\.\%]+\d+)/);
  if (mathMatch && (query.includes("calculate") || query.includes("what is") || query.includes("solve") || query.includes("equals") || !query.includes(" "))) {
    try {
      const sanitized = mathMatch[1].replace(/[^0-9\+\-\*\/\.\(\)]/g, "");
      // eslint-disable-next-line no-eval
      const result = Function(`'use strict'; return (${sanitized})`)();
      return {
        reply: `Computation complete, sir. The result of ${sanitized} is ${result}.`,
      };
    } catch {
      // ignore
    }
  }

  // Time & Date
  if (query.includes("time") || query.includes("date") || query.includes("what day") || query.includes("clock")) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const dateStr = now.toLocaleDateString([], { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    return {
      reply: `Local tactical chronometer reads ${timeStr} on ${dateStr}, sir.`,
    };
  }

  // Greetings
  if (query.startsWith("hi") || query.startsWith("hello") || query.startsWith("hey") || query.includes("good morning") || query.includes("good evening")) {
    return {
      reply: "Good day, Commander. E.D.I.T.H. tactical systems are armed and standing by. What are your orders, sir?",
    };
  }

  // Capabilities
  if (query.includes("what can you do") || query.includes("help") || query.includes("features") || query.includes("commands")) {
    return {
      reply: "I manage orbital tactical reconnaissance, acoustic speech ingestion, soundwave reticle telemetry, web navigation directives, and neural analysis. You can speak commands via the Arc Reactor or type directives into the liquid glass dock.",
    };
  }

  // General context fallback with Stark persona
  const responses = [
    `Tactical directive acknowledged, Commander. I have analyzed your request regarding "${userQuery.slice(0, 40)}". All tactical units are aligned with your instruction, sir.`,
    `Directive processed, sir. Sensor arrays and computational grids are synchronized. Proceeding according to Stark Sec-9 protocols.`,
    `Understood, Commander. Local neural simulation is active. Telemetry confirms your directive has been queued for execution.`,
  ];

  return {
    reply: responses[Math.floor(Math.random() * responses.length)],
  };
}
