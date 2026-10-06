import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import { MUNICIPALITIES } from "./data.js";
import { buildPlan } from "./plan.js";

const initial = {
  from: "", to: "", date: "",
  newHome: "affitto", oldHome: "affitto", oldHomeOutcome: "lascio",
  utilitiesActive: "si", oldUtilities: "si", internet: "si",
  car: "no", children: "no", pets: "no", residence: "si"
};

function todayIso() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10);
}

function formatLongDate(value) {
  return value
    ? new Date(value + "T12:00:00").toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })
    : "Da definire";
}

function App() {
  const [q, setQ] = useState(initial);
  const [step, setStep] = useState(1);
  const [paid, setPaid] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [done, setDone] = useState(false);

  const municipality = MUNICIPALITIES.find(x => x.id === q.to);
  const originMunicipality = MUNICIPALITIES.find(x => x.id === q.from);

  const plan = useMemo(
    () => done ? buildPlan(q, municipality, originMunicipality) : [],
    [done, q, municipality, originMunicipality]
  );

  const counts = {
    do: plan.filter(x => x.kind === "do").length,
    dont: plan.filter(x => x.kind === "dont").length,
    verify: plan.filter(x => x.kind === "verify").length
  };

  const dateMin = todayIso();
  const stepOneValid = Boolean(q.from && q.to && q.date);
  const canContinue = step === 1 ? stepOneValid : true;

  useEffect(() => {
    try {
      const saved = localStorage.getItem("tzp:questionnaire");
      if (saved) setQ({ ...initial, ...JSON.parse(saved) });
    } catch (_) {}

    const sessionId = new URLSearchParams(window.location.search).get("session_id");
    if (!sessionId) return;

    fetch("/api/verify-checkout-session?session_id=" + encodeURIComponent(sessionId))
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

  function start() {
    document.getElementById("piano")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function nextStep() {
    if (!canContinue) return;
    if (step < 3) {
      setStep(step + 1);
      setTimeout(() => document.getElementById("questionnaire-top")?.scrollIntoView({ behavior: "smooth", block: "start" }), 10);
    }
  }

  function prevStep() {
    if (step > 1) {
      setStep(step - 1);
      setTimeout(() => document.getElementById("questionnaire-top")?.scrollIntoView({ behavior: "smooth", block: "start" }), 10);
    }
  }

  function submit() {
    if (!stepOneValid) {
      setStep(1);
      return;
    }

    localStorage.setItem("tzp:questionnaire", JSON.stringify(q));
    setDone(true);
    window.dispatchEvent(new CustomEvent("tzp:plan_created", { detail: { municipality: q.to } }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function editAnswers() {
    setDone(false);
    setStep(1);
    setTimeout(() => document.getElementById("piano")?.scrollIntoView({ behavior: "smooth", block: "start" }), 10);
  }

  if (done) {
    return (
      <main>
        <SiteHeader onStart={editAnswers} compact />
        <ResultPage
          q={q}
          municipality={municipality}
          plan={plan}
          counts={counts}
          paid={paid}
          checkoutLoading={checkoutLoading}
          checkoutError={checkoutError}
          setCheckoutLoading={setCheckoutLoading}
          setCheckoutError={setCheckoutError}
          editAnswers={editAnswers}
        />
      </main>
    );
  }

  return (
    <main>
      <SiteHeader onStart={start} />

      <section className="hero">
        <div className="heroCopy">
          <p className="eyebrow">CAMBIO CASA, MENO PENSIERI</p>
          <h1>Il trasloco non finisce quando chiudi la porta.</h1>
          <p className="lead">
            Tra residenza, TARI, utenze, auto e comunicazioni cambiano molte cose.
            Noi le mettiamo in ordine sulla base della tua situazione, del Comune e della data del trasferimento.
          </p>
          <div className="heroActions">
            <button className="primary heroCta" onClick={start}>Crea il mio piano <b>→</b></button>
            <a className="textLink" href="#come-funziona">Come funziona</a>
          </div>
          <div className="trustLine">
            <span>Procedure locali</span>
            <i />
            <span>Fonti ufficiali</span>
            <i />
            <span>Piano su misura</span>
          </div>
        </div>

        <div className="heroPreview" aria-label="Esempio di piano personalizzato">
          <div className="previewTop">
            <span>ANTEPRIMA DEL PIANO</span>
            <strong>Trasferimento</strong>
          </div>
          <div className="previewCase">
            <div><span>DA</span><b>Milano</b></div>
            <div className="arrow">→</div>
            <div><span>A</span><b>Roma</b></div>
          </div>
          <div className="previewItem">
            <div className="check">1</div>
            <div><span className="miniTag">DA FARE</span><strong>Cambio di residenza</strong><small>Entro 20 giorni dal trasferimento</small></div>
          </div>
          <div className="previewItem">
            <div className="check light">2</div>
            <div><span className="miniTag">DA CONTROLLARE</span><strong>TARI della nuova casa</strong><small>Procedura del Comune di arrivo</small></div>
          </div>
          <div className="previewItem">
            <div className="check pale">3</div>
            <div><span className="miniTag">PUOI EVITARE</span><strong>Pratica separata per l'auto</strong><small>Non necessaria con il cambio di residenza</small></div>
          </div>
          <div className="previewFoot">Un piano diverso per ogni situazione.</div>
        </div>
      </section>

      <section className="section" id="come-funziona">
        <div className="sectionIntro">
          <p className="eyebrow">COME FUNZIONA</p>
          <h2>Non una checklist uguale per tutti.</h2>
          <p>
            Il valore del servizio è capire quali adempimenti dipendono davvero da te,
            quali non sono necessari e quali meritano una verifica prima di muoverti.
          </p>
        </div>
        <div className="stepsGrid">
          <StepCard n="01" title="Ci racconti la situazione" text="Comune di partenza, destinazione, data, case, utenze e ciò che ti riguarda." />
          <StepCard n="02" title="Incrociamo le regole" text="Mettiamo insieme le procedure del Comune con gli elementi personali che cambiano il quadro." />
          <StepCard n="03" title="Ricevi il tuo piano" text="Ordiniamo le attività per momento, priorità e fonte ufficiale, senza riempirti di cose inutili." />
        </div>
      </section>

      <section className="section splitSection">
        <div className="splitVisual">
          <div className="quoteCard">
            <span className="quoteMark">“</span>
            <p>Il punto non è sapere tutto sul trasloco. È sapere cosa riguarda proprio me.</p>
          </div>
        </div>
        <div className="splitCopy">
          <p className="eyebrow">IL PRINCIPIO</p>
          <h2>Ti diciamo anche cosa non devi fare.</h2>
          <p>
            Un buon piano non aggiunge burocrazia. La toglie.
            Per questo distinguiamo sempre tra attività necessarie, attività non necessarie e situazioni da verificare.
          </p>
          <div className="threeLines">
            <div><b>DA FARE</b><span>La pratica o comunicazione che devi mettere in agenda.</span></div>
            <div><b>PUOI EVITARE</b><span>Una cosa che il cambio di residenza o una procedura già prevista rende inutile.</span></div>
            <div><b>DA CONTROLLARE</b><span>Un caso locale o particolare in cui conviene seguire la fonte ufficiale.</span></div>
          </div>
        </div>
      </section>

      <section className="section paperSection">
        <div className="sectionIntro compact">
          <p className="eyebrow">COSA CONTROLLIAMO</p>
          <h2>Le aree che possono cambiare quando cambi casa.</h2>
        </div>
        <div className="topicGrid">
          <Topic title="Residenza" text="Cambio anagrafico, tempi e collegamenti con altri adempimenti." />
          <Topic title="TARI" text="Nuova occupazione, cessazione e situazioni particolari." />
          <Topic title="Utenze" text="Voltura, subentro o nuova attivazione in base allo stato delle forniture." />
          <Topic title="Auto" text="Cosa viene aggiornato con la residenza e cosa non richiede una pratica separata." />
          <Topic title="Famiglia" text="Scuola, servizi locali e gli aggiornamenti che dipendono dal nuovo Comune." />
          <Topic title="Casa e comunicazioni" text="Internet, contatori, amministratore e indirizzi presso soggetti privati." />
        </div>
      </section>

      <section className="section coverage">
        <div>
          <p className="eyebrow">COPERTURA ATTUALE</p>
          <h2>Partiamo da cinque Comuni, con procedure locali.</h2>
          <p>
            Preferiamo una copertura precisa a promettere un servizio identico in tutta Italia senza verificare le differenze locali.
            La base attuale comprende:
          </p>
        </div>
        <div className="cityList">
          {MUNICIPALITIES.map(city => <span key={city.id}>{city.name}</span>)}
        </div>
      </section>

      <section className="section sourceSection">
        <div className="sourceIntro">
          <p className="eyebrow">FONTI</p>
          <h2>Partiamo dalle procedure ufficiali.</h2>
          <p>
            Dove esiste una procedura locale, il piano rimanda alla pagina del Comune o dell'ente competente.
            Il servizio organizza le informazioni: la fonte ufficiale resta il riferimento finale.
          </p>
        </div>
        <div className="sourceBoxes">
          <div><b>Comuni</b><span>Residenza e tributi locali</span></div>
          <div><b>ANPR</b><span>Servizi anagrafici nazionali</span></div>
          <div><b>ACI</b><span>Pratiche e informazioni sui veicoli</span></div>
          <div><b>ARERA</b><span>Informazioni sulle forniture</span></div>
        </div>
      </section>

      <section className="formSection" id="piano">
        <div className="formIntro">
          <p className="eyebrow">IL TUO PIANO</p>
          <h2>Raccontaci come stai cambiando casa.</h2>
          <p>
            Ti faremo solo le domande che servono per distinguere la tua situazione da quella di un altro trasferimento.
          </p>
        </div>

        <section className="questionnaire" id="questionnaire-top">
          <div className="questionnaireTop">
            <div>
              <span className="overline">PASSO {step} DI 3</span>
              <h3>{step === 1 ? "Il trasferimento" : step === 2 ? "Le due case" : "Quello che ti riguarda"}</h3>
            </div>
            <div className="stepDots" aria-label={"Passo " + step + " di 3"}>
              {[1,2,3].map(n => <span key={n} className={n <= step ? "active" : ""} />)}
            </div>
          </div>

          {step === 1 && (
            <div className="questionPane">
              <p className="paneIntro">Partiamo da dove sei oggi e da dove stai andando.</p>
              <div className="fieldGrid">
                <Field label="Da quale Comune ti trasferisci?">
                  <select value={q.from} onChange={e => update("from", e.target.value)}>
                    <option value="">Seleziona il Comune</option>
                    {MUNICIPALITIES.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
                  </select>
                </Field>
                <Field label="In quale Comune ti trasferisci?">
                  <select value={q.to} onChange={e => update("to", e.target.value)}>
                    <option value="">Seleziona il Comune</option>
                    {MUNICIPALITIES.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
                  </select>
                </Field>
                <Field label="Quando prevedi di trasferirti?">
                  <input type="date" min={dateMin} value={q.date} onChange={e => update("date", e.target.value)} />
                </Field>
              </div>
              {q.from && q.to && q.from === q.to && (
                <div className="inlineNote">Il trasferimento resta nello stesso Comune: il piano terrà conto del fatto che la destinazione e la partenza coincidono.</div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="questionPane">
              <p className="paneIntro">Ci serve capire cosa succede alla vecchia casa e alle forniture.</p>
              <div className="fieldGrid">
                <Field label="La nuova casa è...">
                  <Choice value={q.newHome} set={v => update("newHome", v)} opts={{ affitto: "In affitto", acquisto: "Di proprietà" }} />
                </Field>
                <Field label="La vecchia casa è...">
                  <Choice value={q.oldHome} set={v => update("oldHome", v)} opts={{ affitto: "In affitto", acquisto: "Di proprietà" }} />
                </Field>
                <Field label="Cosa succede alla vecchia casa?">
                  <Choice value={q.oldHomeOutcome} set={v => update("oldHomeOutcome", v)} opts={{ lascio: "La lascio", vendo: "La vendo", mantengo: "La mantengo", non_so: "Non lo so ancora" }} />
                </Field>
                <Field label="Nella nuova casa le utenze sono già attive?">
                  <Choice value={q.utilitiesActive} set={v => update("utilitiesActive", v)} opts={{ si: "Sì", no: "No / non so" }} />
                </Field>
                <Field label="Le utenze della vecchia casa sono intestate a te?">
                  <Choice value={q.oldUtilities} set={v => update("oldUtilities", v)} opts={{ si: "Sì", no: "No" }} />
                </Field>
                <Field label="Hai già un contratto internet da trasferire?">
                  <Choice value={q.internet} set={v => update("internet", v)} opts={{ si: "Sì", no: "No" }} />
                </Field>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="questionPane">
              <p className="paneIntro">Ultimo passaggio: togliamo dal piano ciò che non ti riguarda e approfondiamo i casi sensibili.</p>
              <div className="fieldGrid">
                <Field label="Vuoi trasferire la residenza?">
                  <Choice value={q.residence} set={v => update("residence", v)} opts={{ si: "Sì", no: "No / non ora" }} />
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
              </div>
              <div className="finalNote">
                <span className="finalNoteIcon">✓</span>
                <div>
                  <b>Quasi fatto.</b>
                  <p>Il piano viene costruito sulle tue risposte e sulle procedure locali disponibili per il Comune scelto.</p>
                </div>
              </div>
            </div>
          )}

          <div className="questionnaireActions">
            {step > 1 ? <button className="secondary" onClick={prevStep}>← Indietro</button> : <span />}
            {step < 3
              ? <button className="primary" disabled={!canContinue} onClick={nextStep}>Continua <b>→</b></button>
              : <button className="primary" disabled={!stepOneValid} onClick={submit}>Crea il mio piano <b>→</b></button>
            }
          </div>
          <p className="formFoot">Le risposte vengono conservate nel browser per non farti perdere il lavoro. Il piano rimanda sempre alle fonti ufficiali disponibili.</p>
        </section>
      </section>

      <section className="section faqSection" id="faq">
        <div className="sectionIntro compact">
          <p className="eyebrow">DOMANDE FREQUENTI</p>
          <h2>Prima di iniziare.</h2>
        </div>
        <div className="faqList">
          <details>
            <summary>Il piano sostituisce il Comune o un professionista?</summary>
            <p>No. Il servizio organizza gli adempimenti che emergono dalla tua situazione e ti porta alla procedura ufficiale. Per casi particolari o dubbi interpretativi, la fonte competente resta il riferimento finale.</p>
          </details>
          <details>
            <summary>Perché mi chiedete il Comune di partenza?</summary>
            <p>Perché un trasferimento può modificare anche la posizione legata alla vecchia abitazione. Il Comune di partenza può avere una procedura diversa da quello di destinazione.</p>
          </details>
          <details>
            <summary>Perché il piano può indicare “da verificare”?</summary>
            <p>Perché non vogliamo trasformare una regola locale o un caso particolare in una falsa certezza. In quei casi ti portiamo direttamente verso la fonte ufficiale da controllare.</p>
          </details>
          <details>
            <summary>Il servizio funziona per tutti i Comuni italiani?</summary>
            <p>La copertura iniziale è limitata ai Comuni indicati sul sito. L'obiettivo è ampliare la copertura mantenendo la qualità delle procedure locali.</p>
          </details>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

function SiteHeader({ onStart, compact = false }) {
  return (
    <header className={compact ? "siteHeader compactHeader" : "siteHeader"}>
      <a className="brand" href="/" aria-label="Trasloco Zero Pensieri">
        <span className="brandMark" aria-hidden="true"><span /></span>
        <span className="brandWords">Trasloco <em>Zero Pensieri</em></span>
      </a>
      {!compact && (
        <nav className="topNav">
          <a href={prefix + "#come-funziona"}>Come funziona</a>
          <a href="#piano">Il tuo piano</a>
          <a href="#faq">FAQ</a>
          <button onClick={onStart}>Inizia</button>
        </nav>
      )}
    </header>
  );
}

function StepCard({ n, title, text }) {
  return (
    <article className="stepCard">
      <span>{n}</span>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

function Topic({ title, text }) {
  return (
    <div className="topic">
      <span className="topicLine" />
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function Field({ label, children }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

function Choice({ value, set, opts }) {
  return (
    <div className="choices">
      {Object.entries(opts).map(([key, text]) => (
        <button
          key={key}
          type="button"
          className={value === key ? "selected" : ""}
          onClick={() => set(key)}
          aria-pressed={value === key}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

function Stat({ n, t }) {
  return <div className="stat"><b>{n}</b><span>{t}</span></div>;
}

function ResultPage({
  q,
  municipality,
  plan,
  counts,
  paid,
  checkoutLoading,
  checkoutError,
  setCheckoutLoading,
  setCheckoutError,
  editAnswers
}) {
  return (
    <>
      <section className="resultHero">
        <p className="eyebrow">IL TUO PIANO PERSONALIZZATO</p>
        <h1>Trasferimento a {municipality?.name || "destinazione"}</h1>
        <p className="lead">Abbiamo organizzato gli adempimenti in base alla situazione che ci hai descritto.</p>
        <div className="stats">
          <Stat n={counts.do} t="Da fare" />
          <Stat n={counts.dont} t="Puoi evitare" />
          <Stat n={counts.verify} t="Da verificare" />
        </div>
      </section>

      <section className="planWrap">
        <div className="situationCard">
          <div className="situationHeading">
            <div>
              <span className="overline">LA TUA SITUAZIONE</span>
              <h2>Il trasferimento in sintesi</h2>
            </div>
            <button onClick={editAnswers}>Modifica risposte</button>
          </div>
          <div className="situationGrid">
            <div><span>DA</span><strong>{MUNICIPALITIES.find(x => x.id === q.from)?.name || "—"}</strong></div>
            <div><span>A</span><strong>{municipality?.name || "—"}</strong></div>
            <div><span>DATA PREVISTA</span><strong>{formatLongDate(q.date)}</strong></div>
            <div><span>NUOVA CASA</span><strong>{q.newHome === "affitto" ? "In affitto" : "Di proprietà"}</strong></div>
            <div><span>VECCHIA CASA</span><strong>{q.oldHomeOutcome === "mantengo" ? "La mantieni" : q.oldHomeOutcome === "vendo" ? "La vendi" : q.oldHomeOutcome === "non_so" ? "Da decidere" : "La lasci"}</strong></div>
            <div><span>RESIDENZA</span><strong>{q.residence === "si" ? "Da trasferire" : "Non ora"}</strong></div>
          </div>
        </div>

        <div className="planNotice">
          <span className="planNoticeIcon">i</span>
          <p><b>Il piano è organizzativo, non generico.</b> Le attività sono state selezionate per la combinazione di Comune, case, residenza e servizi che hai indicato.</p>
        </div>

        {["do", "dont", "verify"].map(kind => {
          const allItems = plan.filter(x => x.kind === kind);
          const visibleItems = paid ? allItems : allItems.slice(0, 3);
          if (!allItems.length) return null;
          return (
            <section className={"planGroup planGroup-" + kind} key={kind}>
              <div className="groupHeader">
                <div>
                  <span className="groupKicker">{kind === "do" ? "AZIONI" : kind === "dont" ? "PUOI EVITARLO" : "DA CONTROLLARE"}</span>
                  <h2>{kind === "do" ? "Queste sono le cose da fare" : kind === "dont" ? "Queste sono le cose che non devi fare" : "Queste sono le cose che conviene verificare"}</h2>
                </div>
                <span className="groupCount">{allItems.length}</span>
              </div>

              {visibleItems.map(item => (
                <article className="taskCard" key={item.id}>
                  <div className="taskMain">
                    <div className="taskTitleLine">
                      <span className="tag">{item.cat}</span>
                      {item.id === "residenza" && <span className="priority">PRIORITÀ ALTA</span>}
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                    <small><b>Perché:</b> {item.why}</small>
                  </div>
                  <div className="when">
                    <span className="whenLabel">QUANDO</span>
                    <strong>{item.when}</strong>
                    {item.timing && <span>{item.timing}</span>}
                    {item.link && <a href={item.link} target="_blank" rel="noreferrer">{item.sourceLabel || "Fonte ufficiale"} ↗</a>}
                  </div>
                </article>
              ))}

              {!paid && allItems.length > visibleItems.length && (
                <div className="lockedRows">
                  <span>+ altre {allItems.length - visibleItems.length} attività</span>
                  <b>Incluse nel piano completo</b>
                </div>
              )}
            </section>
          );
        })}

        {!paid ? (
          <section className="paywall">
            <div>
              <p className="eyebrow">PIANO COMPLETO</p>
              <h2>Tutto il resto, già ordinato per te.</h2>
              <p className="paywallLead">
                Sblocchi tutte le attività selezionate per il tuo trasferimento, con momento consigliato,
                spiegazione e collegamento alla fonte ufficiale quando disponibile.
              </p>
            </div>
            <div className="paywallFeatures">
              <span>✓ Piano completo</span>
              <span>✓ Scadenze e momenti</span>
              <span>✓ Fonti ufficiali</span>
              <span>✓ Nessun abbonamento</span>
            </div>
            <div className="priceRow">
              <div><strong>6,90 €</strong><span>pagamento unico</span></div>
              <button
                className="primary"
                disabled={checkoutLoading}
                onClick={async () => {
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
                }}
              >
                {checkoutLoading ? "Apertura pagamento…" : "Sblocca il piano completo →"}
              </button>
            </div>
            {checkoutError && <p className="formError">{checkoutError}</p>}
            <small>Pagamento gestito da Stripe. Nessun abbonamento ricorrente.</small>
          </section>
        ) : (
          <section className="paywall success">
            <p className="eyebrow">PIANO COMPLETO SBLOCCATO</p>
            <h2>Ora hai tutto il tuo piano.</h2>
            <p>Trovi qui sopra tutte le attività personalizzate, con scadenze e fonti ufficiali disponibili.</p>
          </section>
        )}
      </section>

      <SiteFooter result />
    </>
  );
}

function SiteFooter({ result = false }) {
  const prefix = result ? "/" : "";
  return (
    <footer>
      <div className="footerMain">
        <div>
          <a className="footerBrand" href="/">Trasloco <em>Zero Pensieri</em></a>
          <p>Un piano personale per orientarti negli adempimenti che accompagnano un cambio casa.</p>
        </div>
        <div className="footerColumn">
          <span>IL SERVIZIO</span>
          <a href="#come-funziona">Come funziona</a>
          <a href={prefix + "#piano"}>Crea il tuo piano</a>
          <a href={prefix + "#faq"}>Domande frequenti</a>
        </div>
        <div className="footerColumn">
          <span>RIFERIMENTI</span>
          <a href="https://www.anagrafenazionale.interno.it/" target="_blank" rel="noreferrer">ANPR</a>
          <a href="https://www.aci.it/" target="_blank" rel="noreferrer">ACI</a>
          <a href="https://www.arera.it/" target="_blank" rel="noreferrer">ARERA</a>
        </div>
      </div>
      <div className="footerBottom">
        <span>Le informazioni hanno finalità organizzativa e non sostituiscono le indicazioni del Comune o dell'ente competente.</span>
        <span>© {new Date().getFullYear()} Trasloco Zero Pensieri</span>
      </div>
    </footer>
  );
}

createRoot(document.getElementById("root")).render(<App />);
