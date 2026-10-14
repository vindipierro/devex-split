const LOW_RATE = 0.0038;
const HIGH_RATE = 0.0054;
const PANEL_ID = "devex-rate-split-panel";

function parseMoney(value) {
  return Number(value.replace(/[$,\s]/g, ""));
}

function parseRobux(value) {
  return Number(value.replace(/[,\s]/g, ""));
}

function formatRobux(value) {
  return Math.round(value).toLocaleString("en-US");
}

function formatUsd(value) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function findDevExValues() {
  const elements = Array.from(document.querySelectorAll("body *"));
  const labeled = elements.filter((element) => {
    const text = element.textContent?.trim() || "";
    return /estimated\s+eligible|eligible\s+robux/i.test(text);
  });

  const candidates = [];

  for (const element of labeled) {
    let current = element;

    for (let depth = 0; depth < 7 && current; depth += 1, current = current.parentElement) {
      const text = current.innerText?.replace(/\u00a0/g, " ").trim() || "";
      if (!text || text.length > 2500) continue;

      const moneyMatches = [...text.matchAll(/\$\s*([\d,]+(?:\.\d{2})?)/g)];
      const numberMatches = [...text.matchAll(/\b([\d]{1,3}(?:,[\d]{3})+|\d{4,})\b/g)];

      if (!moneyMatches.length || !numberMatches.length) continue;

      const dollars = parseMoney(moneyMatches[0][0]);
      const robuxValues = numberMatches
        .map((match) => parseRobux(match[1]))
        .filter((value) => Number.isFinite(value) && value >= 30000);

      for (const robux of robuxValues) {
        if (!Number.isFinite(dollars)) continue;

        const minValue = robux * LOW_RATE;
        const maxValue = robux * HIGH_RATE;
        const tolerance = 0.02;

        if (dollars >= minValue - tolerance && dollars <= maxValue + tolerance) {
          candidates.push({
            robux,
            dollars,
            anchor: current,
            score: text.length + depth * 50
          });
        }
      }
    }
  }

  candidates.sort((a, b) => a.score - b.score);
  if (candidates.length) return candidates[0];

  const bodyText = document.body.innerText?.replace(/\u00a0/g, " ") || "";
  const labelMatch = bodyText.match(/(?:estimated\s+eligible|eligible\s+robux)[\s\S]{0,800}/i);
  if (!labelMatch) return null;

  const section = labelMatch[0];
  const moneyMatch = section.match(/\$\s*([\d,]+(?:\.\d{2})?)/);
  const numberMatches = [...section.matchAll(/\b([\d]{1,3}(?:,[\d]{3})+|\d{4,})\b/g)];
  if (!moneyMatch) return null;

  const dollars = parseMoney(moneyMatch[0]);

  for (const match of numberMatches) {
    const robux = parseRobux(match[1]);
    const minValue = robux * LOW_RATE;
    const maxValue = robux * HIGH_RATE;

    if (robux >= 30000 && dollars >= minValue - 0.02 && dollars <= maxValue + 0.02) {
      return { robux, dollars, anchor: null };
    }
  }

  return null;
}

function solveSplit(totalRobux, totalUsd) {
  const highRateRobux = (totalUsd - LOW_RATE * totalRobux) / (HIGH_RATE - LOW_RATE);
  const lowRateRobux = totalRobux - highRateRobux;

  if (lowRateRobux < -1 || highRateRobux < -1) return null;

  return {
    lowRateRobux: Math.max(0, lowRateRobux),
    highRateRobux: Math.max(0, highRateRobux),
    lowRateUsd: Math.max(0, lowRateRobux) * LOW_RATE,
    highRateUsd: Math.max(0, highRateRobux) * HIGH_RATE
  };
}

function createPanel() {
  const panel = document.createElement("section");
  panel.id = PANEL_ID;
  panel.innerHTML = `
    <div class="devex-split-header">
      <div>
        <div class="devex-split-kicker">DevEx calculator</div>
        <div class="devex-split-title">Rate split</div>
      </div>
      <div class="devex-split-badge">$0.0038 + $0.0054</div>
    </div>
    <div class="devex-split-grid">
      <div class="devex-split-rate-card">
        <div class="devex-split-rate-label">$0.0038 rate</div>
        <div class="devex-split-robux" data-low-robux>—</div>
        <div class="devex-split-usd" data-low-usd>—</div>
      </div>
      <div class="devex-split-rate-card">
        <div class="devex-split-rate-label">$0.0054 rate</div>
        <div class="devex-split-robux" data-high-robux>—</div>
        <div class="devex-split-usd" data-high-usd>—</div>
      </div>
    </div>
    <div class="devex-split-footer" data-summary></div>
  `;
  return panel;
}

function placePanel(panel, anchor) {
  if (panel.isConnected) return;

  if (anchor && anchor.parentElement) {
    anchor.insertAdjacentElement("afterend", panel);
    return;
  }

  panel.classList.add("devex-split-floating");
  document.body.appendChild(panel);
}

function updatePanel() {
  if (!location.pathname.startsWith("/dashboard/devex")) return;

  const values = findDevExValues();
  if (!values) return;

  const split = solveSplit(values.robux, values.dollars);
  if (!split) return;

  let panel = document.getElementById(PANEL_ID);
  if (!panel) {
    panel = createPanel();
    placePanel(panel, values.anchor);
  }

  panel.querySelector("[data-low-robux]").textContent = `${formatRobux(split.lowRateRobux)} R$`;
  panel.querySelector("[data-low-usd]").textContent = formatUsd(split.lowRateUsd);
  panel.querySelector("[data-high-robux]").textContent = `${formatRobux(split.highRateRobux)} R$`;
  panel.querySelector("[data-high-usd]").textContent = formatUsd(split.highRateUsd);
  panel.querySelector("[data-summary]").textContent = `Solved from ${values.robux.toLocaleString("en-US")} eligible Robux worth ${formatUsd(values.dollars)}. Displayed Robux is rounded to the nearest whole Robux.`;
}

let scheduled = false;

function scheduleUpdate() {
  if (scheduled) return;
  scheduled = true;
  window.setTimeout(() => {
    scheduled = false;
    updatePanel();
  }, 250);
}

const observer = new MutationObserver(scheduleUpdate);
observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
  characterData: true
});

window.addEventListener("popstate", scheduleUpdate);
window.addEventListener("hashchange", scheduleUpdate);

scheduleUpdate();
