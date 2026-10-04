import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import { MUNICIPALITIES } from "./data";
import { buildPlan } from "./plan";

const initial = {
  from: "", to: "", date: "",
  newHome: "affitto", oldHome: "affitto",
  utilitiesActive: "si", internet: "si",
  car: "no", children: "no", pets: "no", residence: "si"
};

function App() {
  const [q, setQ] = useState(initial);
  const [done, setDone] = useState(false);
  const municipality = MUNICIPALITIES.find(x => x.id === q.to);
  const plan = useMemo(() => done ? buildPlan(q, municipality) : [], [done, q, municipality]);

  const counts = {
    do: plan.filter(x => x.kind === "do").length,
    dont: plan.filter(x => x.kind === "dont").length,
    verify: plan.filter(x => x.kind === "verify").length
  };

  const canContinue = q.from && q.to && q.from !== q.to && q.date;

  function update(name, value) {
    setQ(prev => ({ ...prev, [name]: value }));
  }

  function submit() {
    if (!canContinue) return;
    setDone(true);
    window.dispatchEvent(new CustomEvent("tzp:plan_created", { detail: { municipality: q.to } }));
  }

  return (
    <main>
      <header>
        <div className="brand">Trasloco <span>Zero Pensieri</span></div>
        <div className="badge">MVP Italia</div>
      </header>

      {!done ? (
        <>
          <section className="hero">
            <p className="eyebrow">CAMBIO CASA, MENO PENSIERI</p>
            <h1>Il tuo piano personale per il trasloco.</h1>
            <p className="lead">Dimmi come ti trasferisci. Ti diciamo cosa fare, cosa non devi fare e cosa verificare.</p>
          </section>

          <section className="card form">
            <div className="progress"><span>Situazione personale</span><div><i /></div></div>
            <h2>Partiamo dalla tua situazione</h2>

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

              <Field label="La nuova casa è...">
                <Choice value={q.newHome} set={v => update("newHome", v)} opts={{ affitto: "In affitto", acquisto: "Di proprietà" }} />
              </Field>

              <Field label="La vecchia casa è...">
                <Choice value={q.oldHome} set={v => update("oldHome", v)} opts={{ affitto: "In affitto", acquisto: "Di proprietà" }} />
              </Field>

              <Field label="Nella nuova casa le utenze sono già attive?">
                <Choice value={q.utilitiesActive} set={v => update("utilitiesActive", v)} opts={{ si: "Sì", no: "No / non so" }} />
              </Field>

              <Field label="Hai già un contratto internet da trasferire?">
                <Choice value={q.internet} set={v => update("internet", v)} opts={{ si: "Sì", no: "No" }} />
              </Field>

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

            {q.from && q.to && q.from === q.to && <p className="formError">Per ora il test è pensato per un trasferimento tra Comuni diversi.</p>}

            <button disabled={!canContinue} onClick={submit}>Crea il mio piano <b>→</b></button>
            <small>Le informazioni amministrative vanno sempre verificate sulle fonti ufficiali indicate nel piano.</small>
          </section>
        </>
      ) : (
        <>
          <section className="resultHead">
            <p className="eyebrow">IL TUO PIANO</p>
            <h1>Trasferimento a {municipality.name}</h1>
            <p className="lead">Abbiamo selezionato le attività più rilevanti per la tua situazione e le abbiamo ordinate intorno alla data del trasloco.</p>
            <div className="stats">
              <Stat n={counts.do} t="Da fare" />
              <Stat n={counts.dont} t="Non devi fare" />
              <Stat n={counts.verify} t="Da verificare" />
            </div>
          </section>

          <section className="plan">
            {["do", "dont", "verify"].map(kind => {
              const allItems = plan.filter(x => x.kind === kind);
              const items = allItems.filter((x, index) => {
                if (kind === "dont") return index < 2;
                return index < 2;
              });
              if (!items.length) return null;
              return (
                <div className="group" key={kind}>
                  <h2>{kind === "do" ? "🔴 Queste sono le cose che devi fare" : kind === "dont" ? "🟢 Queste sono le cose che non devi fare" : "🟠 Queste sono le cose da verificare"}</h2>
                  {items.map(x => (
                    <article key={x.id}>
                      <div>
                        <span className="tag">{x.cat}</span>
                        <h3>{x.title}</h3>
                        <p>{x.text}</p>
                        <small>{x.why}</small>
                      </div>
                      <div className="when">
                        <strong>{x.when}</strong>
                        {x.timing && <span>{x.timing}</span>}
                        {x.link && <a href={x.link} target="_blank" rel="noreferrer">{x.sourceLabel || "Fonte ufficiale"} ↗</a>}
                      </div>
                    </article>
                  ))}
                </div>
              );
            })}

            {plan.length > 6 && (
              <div className="lockedNotice">
                Nel tuo piano completo ci sono altre <strong>{plan.length - 6}</strong> attività selezionate per la tua situazione.
              </div>
            )}

            <div className="paywall">
              <p className="eyebrow">IL TUO PIANO COMPLETO È PRONTO</p>
              <h2>{plan.length} attività, ordinate intorno al tuo trasloco.</h2>
              <p>Il piano completo aggiunge tutte le attività, le procedure locali, le scadenze dettagliate, i documenti necessari e una versione scaricabile.</p>
              <strong>6,90 €</strong>
              <button onClick={() => {
                window.dispatchEvent(new CustomEvent("tzp:checkout_interest", { detail: { municipality: q.to, tasks: plan.length } }));
                alert("Interesse registrato. Il checkout reale sarà attivato nella fase di validazione.");
              }}>Ottieni il piano completo</button>
            </div>

            <button className="back" onClick={() => setDone(false)}>← Modifica le risposte</button>
          </section>
        </>
      )}
    </main>
  );
}

function Field({ label, children }) { return <label><span>{label}</span>{children}</label>; }

function Choice({ value, set, opts }) {
  return <div className="choices">{Object.entries(opts).map(([k, v]) =>
    <button key={k} type="button" className={value === k ? "selected" : ""} onClick={() => set(k)}>{v}</button>
  )}</div>;
}

function Stat({ n, t }) { return <div><b>{n}</b><span>{t}</span></div>; }

createRoot(document.getElementById("root")).render(<App />);