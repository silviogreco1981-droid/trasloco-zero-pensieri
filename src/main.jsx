import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import { MUNICIPALITIES } from "./data.js";
import { buildPlan } from "./plan.js";

const initial = {
  from: "", to: "", date: "",
  newHome: "affitto", oldHome: "affitto", oldHomeOutcome: "lascio",
  utilitiesActive: "si", internet: "si",
  car: "no", children: "no", pets: "no", residence: "si"
};

function App() {
  const [q, setQ] = useState(initial);
  const [paid, setPaid] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [done, setDone] = useState(false);
  const municipality = MUNICIPALITIES.find(x => x.id === q.to);
  const originMunicipality = MUNICIPALITIES.find(x => x.id === q.from);
  const plan = useMemo(() => done ? buildPlan(q, municipality, originMunicipality) : [], [done, q, municipality, originMunicipality]);

  const counts = {
    do: plan.filter(x => x.kind === "do").length,
    dont: plan.filter(x => x.kind === "dont").length,
    verify: plan.filter(x => x.kind === "verify").length
  };

  const canContinue = q.from && q.to && q.from !== q.to && q.date;

  useEffect(() => {
    try {
      const saved = localStorage.getItem("tzp:questionnaire");
      if (saved) setQ(JSON.parse(saved));
    } catch (_) {}

    const sessionId = new URLSearchParams(window.location.search).get("session_id");
    if (!sessionId) return;

    fetch(`/api/verify-checkout-session?session_id=${encodeURIComponent(sessionId)}`)
      .then(r => r.ok ? r.json() : Promise.reject(new Error("Pagamento non verificato")))
      .then(result => {
        if (result.paid) {
          setPaid(true);
          setDone(true);
          window.history.replaceState({}, "", window.location.pathname);
        }
      })
      .catch(() => setCheckoutError("Non è stato possibile verificare subito il pagamento. Ricarica la pagina tra qualche secondo."));
  }, []);

  function update(name, value) {
    setQ(prev => ({ ...prev, [name]: value }));
  }

  function submit() {
    if (!canContinue) return;
    localStorage.setItem("tzp:questionnaire", JSON.stringify(q));
    setDone(true);
    window.dispatchEvent(new CustomEvent("tzp:plan_created", { detail: { municipality: q.to } }));
  }

  return (
    <main>
      <header>
        <div className="brand">Trasloco <span>Zero Pensieri</span></div>
      </header>

      {!done ? (
        <>
          <section className="hero">
            <p className="eyebrow">CAMBIO CASA, MENO PENSIERI</p>
            <h1>Ti trasferisci? Alle cose importanti pensiamo noi.</h1>
            <p className="lead">Raccontaci come stai cambiando casa. Ti restituiamo un piano personale con quello che devi fare, quello che puoi evitare e quello che conviene verificare.</p>
          </section>

          <section className="card form">
            <div className="progress"><span>Il tuo trasferimento</span><div><i /></div></div>
            <h2>Partiamo dalla tua situazione</h2>

            <div className="formSection">
              <h3>Il trasferimento</h3>
              <p>Ci servono Comune di partenza, destinazione e data prevista.</p>
              <div className="grid">
                <Field label="Da quale Comune ti trasferisci?">
                  <select value={q.from} onChange={e => update("from", e.target.value)}>
                    <option value="">Seleziona</option>
                    {MUNICIPALITIES.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
                  </select>
                </Field>

                <Field label="In quale Comune ti trasferisci?">
                  <select value={q.to} onChange={e => update("to", e.target.value)}>
                    <option value="">Seleziona</option>
                    {MUNICIPALITIES.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
                  </select>
                </Field>

                <Field label="Quando prevedi di trasferirti?">
                  <input type="date" value={q.date} onChange={e => update("date", e.target.value)} />
                </Field>
              </div>
            </div>

            <div className="formSection">
              <h3>Le due case</h3>
              <p>Queste informazioni cambiano gli adempimenti che ti riguardano.</p>
              <div className="grid">
                <Field label="La nuova casa è...">
                  <Choice value={q.newHome} set={v => update("newHome", v)} opts={{ affitto: "In affitto", acquisto: "Di proprietà" }} />
                </Field>

                <Field label="La vecchia casa è...">
                  <Choice value={q.oldHome} set={v => update("oldHome", v)} opts={{ affitto: "In affitto", acquisto: "Di proprietà" }} />
                </Field>

                <Field label="Cosa succede alla vecchia casa?">
                  <Choice value={q.oldHomeOutcome} set={v => update("oldHomeOutcome", v)} opts={{ lascia: "La lascio", vendo: "La vendo", mantengo: "La mantengo", non_so: "Non lo so ancora" }} />
                </Field>

                <Field label="Nella nuova casa le utenze sono già attive?">
                  <Choice value={q.utilitiesActive} set={v => update("utilitiesActive", v)} opts={{ si: "Sì", no: "No / non so" }} />
                </Field>

                <Field label="Hai già un contratto internet da trasferire?">
                  <Choice value={q.internet} set={v => update("internet", v)} opts={{ si: "Sì", no: "No" }} />
                </Field>
              </div>
            </div>

            <div className="formSection">
              <h3>Cosa ti riguarda</h3>
              <p>Così possiamo togliere dal piano le cose che non ti servono.</p>
              <div className="grid">
                <Field label="Hai un'auto o un altro veicolo?">
                  <Choice value={q.car} set={v => update("car", v)} opts={{ si: "Sì", no: "No" }} />
                </Field>

                <Field label="Hai figli che utilizzano servizi locali?">
                  <Choice value={q.children} set={v => update("children", v)} opts={{ si: "Sì", no: "No" }} />
                </Field>

                <Field label="Hai animali domestici?">
                  <Choice value={q.pets} set={v => update("pets", v)} opts={{ si: "Sì", no: "No" }} />
                </Field>

                <Field label="Vuoi trasferire la residenza?">
                  <Choice value={q.residence} set={v => update("residence", v)} opts={{ si: "Sì", no: "No / non ora" }} />
                </Field>
              </div>
            </div>

            {q.from && q.to && q.from === q.to && <p className="formError">Per ora il servizio è pensato per un trasferimento tra Comuni diversi.</p>}

            <button disabled={!canContinue} onClick={submit}>Crea il mio piano <b>→</b></button>
            <small>Il piano rimanda sempre alle fonti ufficiali del Comune o dell'ente competente.</small>
          </section>

          <footer>
            Le informazioni hanno finalità organizzativa e non sostituiscono le indicazioni del Comune o dell'ente competente. Prima di procedere, verifica sempre la procedura ufficiale indicata nel piano.
          </footer>
        </>
      ) : (
        <>
          <section className="resultHead">
            <p className="eyebrow">IL TUO PIANO</p>
            <h1>Trasferimento a {municipality.name}</h1>
            <p className="lead">Abbiamo selezionato gli adempimenti in base alla situazione che ci hai descritto.</p>
            <div className="stats">
              <Stat n={counts.do} t="Da fare" />
              <Stat n={counts.dont} t="Puoi evitare" />
              <Stat n={counts.verify} t="Da verificare" />
            </div>
          </section>

          <section className="plan">
            <div className="personalSummary">
              <div>
                <span className="summaryLabel">DESTINAZIONE</span>
                <strong>{municipality.name}</strong>
              </div>
              <div>
                <span className="summaryLabel">DATA PREVISTA</span>
                <strong>{q.date ? new Date(q.date + "T12:00:00").toLocaleDateString("it-IT", {day:"numeric", month:"long", year:"numeric"}) : "Da definire"}</strong>
              </div>
              <div>
                <span className="summaryLabel">VECCHIA CASA</span>
                <strong>{q.oldHomeOutcome === "mantengo" ? "La mantieni" : q.oldHomeOutcome === "vendo" ? "La vendi" : q.oldHomeOutcome === "non_so" ? "Da decidere" : "La lasci"}</strong>
              </div>
            </div>

            {["do", "dont", "verify"].map(kind => {
              const allItems = plan.filter(x => x.kind === kind);
              const items = paid ? allItems : allItems.slice(0, 3);
              if (!items.length) return null;
              return (
                <div className={"group group-" + kind} key={kind}>
                  <div className="groupTitle">
                    <div>
                      <span className="groupKicker">{kind === "do" ? "AZIONI" : kind === "dont" ? "PUOI EVITARLO" : "DA CONTROLLARE"}</span>
                      <h2>{kind === "do" ? "Queste sono le cose che devi fare" : kind === "dont" ? "Queste sono le cose che non devi fare" : "Queste sono le cose da verificare"}</h2>
                    </div>
                    <span className="groupCount">{allItems.length}</span>
                  </div>
                  {items.map(x => (
                    <article key={x.id}>
                      <div className="taskMain">
                        <span className="tag">{x.cat}</span>
                        <h3>{x.title}</h3>
                        <p>{x.text}</p>
                        <small><b>Perché:</b> {x.why}</small>
                      </div>
                      <div className="when">
                        <span className="whenLabel">QUANDO</span>
                        <strong>{x.when}</strong>
                        {x.timing && <span>{x.timing}</span>}
                        {x.link && <a href={x.link} target="_blank" rel="noreferrer">{x.sourceLabel || "Fonte ufficiale"} ↗</a>}
                      </div>
                    </article>
                  ))}
                  {!paid && allItems.length > items.length && <div className="moreTasks">+ altre {allItems.length - items.length} attività nel piano completo</div>}
                </div>
              );
            })}

            {!paid ? (
              <div className="paywall">
                <p className="eyebrow">PIANO COMPLETO</p>
                <h2>Hai già visto le cose più importanti. Il resto è qui.</h2>
                <p>Con il piano completo sblocchi tutte le attività selezionate per il tuo trasferimento, con scadenze, indicazioni locali e fonti ufficiali.</p>
                <div className="price"><strong>6,90 €</strong><span>una tantum · nessun abbonamento</span></div>
                <button disabled={checkoutLoading} onClick={async () => {
                  setCheckoutLoading(true);
                  setCheckoutError("");
                  try {
                    const response = await fetch("/api/create-checkout-session", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ municipality: q.to })
                    });
                    const data = await response.json();
                    if (!response.ok || !data.url) throw new Error(data.error || "Checkout non disponibile");
                    window.location.href = data.url;
                  } catch (error) {
                    console.error(error);
                    setCheckoutError("Il pagamento non è disponibile in questo momento. Riprova tra poco.");
                    setCheckoutLoading(false);
                  }
                }}>{checkoutLoading ? "Apertura pagamento…" : "Ottieni il piano completo →"}</button>
                <small>Pagamento unico di 6,90 €. Nessun abbonamento.</small>
                {checkoutError && <p className="formError">{checkoutError}</p>}
              </div>
            ) : (
              <div className="paywall success">
                <p className="eyebrow">PIANO COMPLETO SBLOCCATO</p>
                <h2>Ora hai tutto il tuo piano.</h2>
                <p>Qui sopra trovi tutte le attività personalizzate per il tuo trasferimento, con scadenze e fonti ufficiali.</p>
              </div>
            )}

            <button className="back" onClick={() => setDone(false)}>← Modifica le risposte</button>
          </section>
        </>
      )}
    </main>
  );
}

function Field({ label, children }) {
  return <label><span>{label}</span>{children}</label>;
}

function Choice({ value, set, opts }) {
  return <div className="choices">{Object.entries(opts).map(([k, v]) =>
    <button key={k} type="button" className={value === k ? "selected" : ""} onClick={() => set(k)}>{v}</button>
  )}</div>;
}

function Stat({ n, t }) {
  return <div><b>{n}</b><span>{t}</span></div>;
}

createRoot(document.getElementById("root")).render(<App />);