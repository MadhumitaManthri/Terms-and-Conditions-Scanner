//goose gaurd actual code (logic and real contetn of scanning websites)
//console.log("goosegaurd running ...")

//const box = document.createElement('div');
//box.textContent = 'goose goose gaurd';
//document.body.appendChild(box);
//practice:
//box.style.position = 'fixed';
//box.style.right = '12px';
//box.style.bottom = '12px';
//box.style.padding = '8px 10px';
//box.style.background = '#173857ff';
//box.style.color = '#77df1cff';
//box.style.borderRadius = '8px';
//box.style.zIndex = '2147483647'; // very top
// Goose Guard v2 — HTML + PDF; rule-based + tiny ML assist (logistic-style)

// Goose Guard — simple web-page scanner
// idea: walk visible text on the page, look for specific legal patterns,
// highlight them, then show a small panel with a risk score.

// styles for highlights and the panel
// Goose Guard — simple web-page scanner + tiny ML assist
// idea: walk visible text, use rules first, then a tiny logistic model to catch paraphrases.

// styles
// Goose Guard v2 — HTML + PDF; rules + tiny ML assist (logistic-style)

// ===== Galaxy styles =====
// Goose Guard — simple web-page scanner + tiny ML + "Examples (p≈…)" panel

// styles
const GG_STYLE = `
.gg-mark { padding:0 .08em; border-radius:.18em; box-decoration-break:clone; -webkit-box-decoration-break:clone; }
.gg-mark[data-ctype="autoRenewal"] { background:#e9d5ff; }
.gg-mark[data-ctype="arbitration"] { background:#f5d0fe; }
.gg-mark[data-ctype="dataSharing"] { background:#c7d2fe; }
.gg-mark[data-ctype="unilateral"] { background:#ddd6fe; }
.gg-mark[data-ctype="feesRefunds"] { background:#dbeafe; }

#gg-panel {
  position:fixed; right:16px; bottom:16px; z-index:2147483647;
  width:360px; max-height:68vh; overflow:auto;
  color:#f5f3ff;
  background:radial-gradient(120% 120% at 30% 10%, #a78bfa 0%, #7c3aed 35%, #4c1d95 70%, #1f1147 100%);
  border:1px solid rgba(255,255,255,.12); border-radius:14px; box-shadow:0 10px 28px rgba(0,0,0,.25);
  font:14px/1.35 ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
}
#gg-panel header{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,.14)}
#gg-panel header .brand{display:flex;align-items:center;gap:8px}
#gg-panel header img{width:24px;height:24px;border-radius:999px;border:1px solid rgba(255,255,255,.2);object-fit:cover}
#gg-panel h4{margin:0;font-size:14px}
#gg-close{border:0;background:transparent;color:#f5f3ff;font-size:18px;cursor:pointer}
#gg-panel .body{padding:10px 12px}
#gg-panel .chip{display:inline-block;margin:2px 6px 8px 0;padding:4px 8px;border-radius:999px;font-size:12px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12)}
#gg-panel ul{margin:6px 0 0 18px;padding:0}
#gg-panel li{margin:4px 0}
.gg-muted{color:#d1c4ff;font-size:12px;opacity:.9}
`;

// rules (fast and explainable)
const RULES = {
  autoRenewal: {
    label: "Auto-renewal",
    weight: 4,
    triggers: [/\bauto[- ]?renew(al)?\b/i, /\brenews?\s+(monthly|annually|yearly)\b/i, /\brenewal term\b/i],
    boosts: [/\b(cancel|cancellation|notice|prior)\b/i, /\b\d+\s*(day|month|year)s?\b/i],
    exceptions: [/does not auto[- ]?renew/i]
  },
  arbitration: {
    label: "Arbitration / Class-action",
    weight: 5,
    triggers: [/\barbitration\b/i, /\bclass[- ]?action\b/i, /\bjury trial\b/i],
    boosts: [/binding/i, /\bwaive(?:r|s|d)?\b/i],
    exceptions: []
  },
  dataSharing: {
    label: "Data sharing / sale",
    weight: 4,
    triggers: [/(\bshare|\bsell|\bdisclose)\b/i, /\b(personal|data|information|PII)\b/i, /\bthird[- ]?part(y|ies)|affiliates?\b/i],
    boosts: [/advertis(ing|ers)/i, /\bsell(s|ing)?\b/i],
    exceptions: [/do not sell\b/i]
  },
  unilateral: {
    label: "Unilateral changes",
    weight: 4,
    triggers: [/\bwe may (modify|change|amend) (the|these)? terms\b/i, /\bat our sole discretion\b/i],
    boosts: [/\bwithout (prior )?notice\b/i],
    exceptions: []
  },
  feesRefunds: {
    label: "Fees / Refunds",
    weight: 3,
    triggers: [/\bfee(s)?\b/i, /\bcharge(d|s)?\b/i, /\brefund(s|able)?\b/i, /\bnon[- ]?refundable\b/i],
    boosts: [/\$?\d+(\.\d{2})?\b/i, /\bwithin\s+\d+\s*(day|month|year)s?\b/i],
    exceptions: [/\bno (additional )?fees?\b/i]
  }
};

// tiny ML assist (logistic)
const ML = {
  arbitration: { b: -2.2, w: { arbitration: 3.2, "class-action": 2.2, class: 1.0, waiver: 1.4, waive: 1.2, binding: 0.9, dispute: 0.8, jury: 1.2, trial: 0.7, jams: 0.9, aaa: 0.9 } },
  autoRenewal: { b: -2.0, w: { "auto-renew": 2.6, renews: 1.6, renewal: 1.2, subscription: 1.1, recurring: 1.1, billing: 1.0, monthly: 0.8, annually: 0.8, yearly: 0.8, notice: 0.6 } },
  dataSharing: { b: -2.1, w: { share: 1.5, sharing: 1.3, disclose: 1.5, disclosure: 1.1, sell: 1.9, selling: 1.4, "third-party": 1.3, affiliates: 1.0, personal: 0.9, information: 0.7, pii: 1.1, advertising: 0.8 } },
  unilateral: { b: -2.0, w: { modify: 1.1, change: 0.8, amend: 1.0, terms: 0.6, discretion: 1.3, "sole discretion": 1.7, notice: 0.7 } },
  feesRefunds: { b: -1.9, w: { fee: 1.3, fees: 1.5, charge: 1.2, charged: 1.2, refund: 1.2, refunds: 1.2, "non-refundable": 1.7, "$": 1.0, within: 0.6 } }
};
const sigmoid = x => 1 / (1 + Math.exp(-x));
function mlProb(sentence, type) {
  const m = ML[type]; if (!m) return 0;
  const s = sentence.toLowerCase();
  let x = m.b;
  for (const [tok, w] of Object.entries(m.w)) {
    if (tok === '$') { if (/\$?\d+(\.\d{2})?/.test(s)) x += w; continue; }
    if (s.includes(tok)) x += w;
  }
  return sigmoid(x);
}

// style injection
function ensureStyles() {
  if (!document.getElementById('gg-style')) {
    const st = document.createElement('style');
    st.id = 'gg-style';
    st.textContent = GG_STYLE;
    document.head.appendChild(st);
  }
}

// visible text nodes
function getVisibleTextNodes(root = (document.querySelector('main, article, [role="main"]') || document.body)) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      const t = (n.nodeValue || "").replace(/\s+/g, " ").trim();
      if (!t) return NodeFilter.FILTER_REJECT;
      const p = n.parentElement; if (!p) return NodeFilter.FILTER_REJECT;
      const tag = p.tagName;
      if (['SCRIPT','STYLE','NOSCRIPT','IFRAME','SVG','CANVAS','VIDEO','AUDIO'].includes(tag)) return NodeFilter.FILTER_REJECT;
      const cs = getComputedStyle(p);
      if (cs.display === 'none' || cs.visibility === 'hidden') return NodeFilter.FILTER_REJECT;
      if (!p.offsetParent && cs.position !== 'fixed') return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  const nodes = []; let node; while ((node = walker.nextNode())) nodes.push(node);
  return nodes;
}

// keep verbs near data words for data-sharing
function proximityHit(text, win = 8) {
  const tokens = text.toLowerCase().split(/\s+/);
  const verbs = [], nouns = [];
  tokens.forEach((tok, i) => {
    if (/^(share|shares|sell|sells|selling|disclose|discloses|disclosing)$/.test(tok)) verbs.push(i);
    if (/^(data|information|personal|pii|third-?party|third-?parties|affiliates?)$/.test(tok)) nouns.push(i);
  });
  for (const a of verbs) for (const b of nouns) if (Math.abs(a - b) <= win) return true;
  return false;
}

// clean previous run (auto-clear before scan)
function clearUI() {
  document.querySelectorAll('mark.gg-mark').forEach(m => {
    try {
      const t = document.createTextNode(m.dataset.ggOriginal || m.textContent);
      m.parentNode.replaceChild(t, m);
    } catch {}
  });
  document.getElementById('gg-panel')?.remove();
}

// main
function analyze() {
  ensureStyles();
  clearUI();

  const nodes = getVisibleTextNodes();
  const hits = []; // {type,label,text,weight,prob}

  nodes.forEach(node => {
    const t = node.nodeValue || "";

    for (const [key, rule] of Object.entries(RULES)) {
      let trigger = false, except = false;

      if (key === 'dataSharing') {
        const trigAll = rule.triggers.every(rx => rx.test(t));
        trigger = trigAll && proximityHit(t);
      } else {
        trigger = rule.triggers.some(rx => rx.test(t));
      }
      except = rule.exceptions?.some(rx => rx.test(t)) || false;

      // tiny ML assist
      const prob = mlProb(t, key);
      const mlHit = prob >= 0.78;

      if ((trigger && !except) || (mlHit && (key !== 'dataSharing' || proximityHit(t)))) {
        // short rewrite for tooltip
        let rewrite = "";
        if (key === "autoRenewal") {
          const period = (t.match(/\b(monthly|annually|yearly)\b/i)?.[0]) || "periodically";
          const notice = (t.match(/\b\d+\s*(day|month|year)s?\b/i)?.[0]) || "";
          rewrite = `Renews ${period}. ${notice ? `Cancel ≥ ${notice} before renewal.` : `Cancel before renewal date.`}`;
        } else if (key === "arbitration") {
          const cls = /\bclass[- ]?action\b/i.test(t) ? " Class-action waived." : "";
          rewrite = `Disputes go to binding arbitration.${cls}`;
        } else if (key === "dataSharing") {
          const sells = /\bsell(s|ing)?\b/i.test(t);
          rewrite = `${sells ? "May sell" : "May share/disclose"} your personal data with third parties.`;
        } else if (key === "unilateral") {
          const noNotice = /\bwithout (prior )?notice\b/i.test(t) ? " without notice" : "";
          rewrite = `They can change the terms${noNotice}.`;
        } else if (key === "feesRefunds") {
          const amt = (t.match(/\$?\d+(\.\d{2})?\b/i)?.[0]) || "";
          const nonref = /\bnon[- ]?refundable\b/i.test(t);
          rewrite = nonref ? `Fees may be non-refundable.` : `Fees/charges may apply${amt ? ` (e.g., ${amt})` : ""}.`;
        }

        // highlight node on page
        try {
          const mark = document.createElement('mark');
          mark.className = 'gg-mark';
          mark.dataset.ctype = key;
          mark.title = `${RULES[key].label} • ${rewrite}`;
          const span = document.createElement('span');
          span.textContent = t;
          mark.appendChild(span);
          node.parentNode.replaceChild(mark, node);
          mark.dataset.ggOriginal = t;
        } catch {}

        hits.push({ type: key, label: RULES[key].label, text: t.trim(), weight: RULES[key].weight, prob: +prob.toFixed(2) });
        break; // don't double-tag same node
      }
    }
  });

  renderPanel(hits);
}

// panel with risk + examples (sorted by probability)
function renderPanel(results) {
  const typeSet = new Set(results.map(r => r.type));
  let raw = 0;
  const reasons = [];

  typeSet.forEach(t => raw += RULES[t].weight);

  const anyOf = (type, pred) => results.some(r => r.type === type && pred(r.text));
  if (typeSet.has('autoRenewal') && anyOf('autoRenewal', s => {
    const m = s.match(/\b(\d+)\s*day(s)?\b/i); return m && parseInt(m[1],10) < 14;
  })) { raw += 2; reasons.push('Auto-renewal short notice (<14 days)'); }
  if (typeSet.has('dataSharing') && anyOf('dataSharing', s => /\bsell(s|ing)?\b/i.test(s))) { raw += 2; reasons.push('Data may be sold'); }
  if (typeSet.has('arbitration') && anyOf('arbitration', s => /\bclass[- ]?action\b/i.test(s))) { raw += 1; reasons.push('Class-action waived'); }
  if (typeSet.has('unilateral') && anyOf('unilateral', s => /\bwithout (prior )?notice\b/i.test(s))) { raw += 1; reasons.push('Terms may change without notice'); }

  const RAW_MAX = 26;
  const score = Math.round((raw / RAW_MAX) * 10);

  const panel = document.createElement('div');
  panel.id = 'gg-panel';
  const logo = chrome.runtime.getURL('ggss.png');

  const chips = Object.entries(RULES).map(([k,v]) => {
    const c = results.filter(r => r.type === k).length;
    return `<span class="chip">${v.label}: ${c}</span>`;
  }).join('');

  // sort by prob desc, show top 6
  const sample = results
    .slice()
    .sort((a,b) => (b.prob||0) - (a.prob||0))
    .slice(0,6)
    .map(r => `<li><em>${r.label}</em> <span class="gg-muted">p≈${r.prob?.toFixed ? r.prob.toFixed(2) : r.prob}</span><br>${escapeHtml(shorten(r.text, 220))}</li>`)
    .join('');

  panel.innerHTML = `
    <header>
      <div class="brand">
        <img src="${logo}" onerror="this.style.display='none'"/>
        <h4>Goose Guard</h4>
      </div>
      <button id="gg-close" title="Close">×</button>
    </header>
    <div class="body">
      <div><strong>Risk score:</strong> ${score} / 10</div>
      <div style="margin:8px 0;">${chips}</div>
      ${reasons.length ? `<div><strong>Reasons:</strong><ul>${reasons.map(r=>`<li>${r}</li>`).join('')}</ul></div>` : ""}
      ${results.length ? `<div style="margin-top:8px;"><strong>Examples:</strong><ul>${sample}</ul></div>` : ""}
      <div class="gg-muted" style="margin-top:8px;">Hover highlights for quick explanations.</div>
    </div>
  `;
  document.body.appendChild(panel);
  document.getElementById('gg-close').onclick = () => panel.remove();
}

// tiny helpers
function escapeHtml(s){return s.replace(/[&<>'"]/g,c=>({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[c]));}
function shorten(s,n){return s.length>n ? s.slice(0,n-1)+'…' : s;}

// handle popup click
chrome.runtime.onMessage.addListener((msg) => {
  if (!msg || msg.type !== 'GG_ANALYZE') return;
  analyze();
});
