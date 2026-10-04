import test from "node:test";
import assert from "node:assert/strict";
import { buildPlan } from "../src/plan.js";

const municipalities = {
  milano: {
    id: "milano",
    name: "Milano",
    residenceUrl: "https://example.com/residenza",
    tariUrl: "https://example.com/tari"
  },
  roma: {
    id: "roma",
    name: "Roma",
    residenceUrl: "https://example.com/residenza",
    tariUrl: "https://example.com/tari"
  },
  torino: {
    id: "torino",
    name: "Torino",
    residenceUrl: "https://example.com/residenza",
    tariUrl: "https://example.com/tari"
  }
};

const base = {
  from: "Milano",
  to: "Roma",
  date: "2026-10-20",
  newHome: "affitto",
  oldHome: "affitto",
  oldHomeOutcome: "lascio",
  utilitiesActive: "si",
  internet: "si",
  car: "no",
  children: "no",
  pets: "no",
  residence: "si"
};

function task(plan, id) {
  const found = plan.find((item) => item.id === id);
  assert.ok(found, `Task ${id} non presente`);
  return found;
}

test("TARI vecchia casa: fuori Torino richiede verifica", () => {
  const plan = buildPlan(base, municipalities.roma, municipalities.milano);
  assert.equal(task(plan, "tari-vecchia").kind, "verify");
});

test("TARI vecchia casa: Torino -> altro Comune con casa lasciata è automatica", () => {
  const q = { ...base, oldHomeOutcome: "lascio" };
  const plan = buildPlan(q, municipalities.roma, municipalities.torino);
  assert.equal(task(plan, "tari-vecchia").kind, "dont");
});

test("TARI vecchia casa: Torino -> altro Comune con casa venduta è automatica", () => {
  const q = { ...base, oldHomeOutcome: "vendo" };
  const plan = buildPlan(q, municipalities.roma, municipalities.torino);
  assert.equal(task(plan, "tari-vecchia").kind, "dont");
});

test("TARI nuova casa: Torino con residenza non richiede pratica separata", () => {
  const plan = buildPlan(base, municipalities.torino, municipalities.milano);
  assert.equal(task(plan, "tari-nuova").kind, "dont");
});

test("TARI vecchia casa mantenuta richiede verifica", () => {
  const q = { ...base, oldHomeOutcome: "mantengo" };
  const plan = buildPlan(q, municipalities.roma, municipalities.milano);
  assert.equal(task(plan, "tari-vecchia").kind, "verify");
});

test("TARI vecchia casa non ancora decisa richiede verifica", () => {
  const q = { ...base, oldHomeOutcome: "non_so" };
  const plan = buildPlan(q, municipalities.roma, municipalities.milano);
  assert.equal(task(plan, "tari-vecchia").kind, "verify");
});

test("Senza cambio residenza non viene creato il task residenza", () => {
  const q = { ...base, residence: "no" };
  const plan = buildPlan(q, municipalities.roma, municipalities.milano);
  assert.equal(plan.some((item) => item.id === "residenza"), false);
  assert.equal(task(plan, "residenza-non-trasferita").kind, "verify");
});

test("Con auto il piano evita una pratica separata per la residenza del veicolo", () => {
  const q = { ...base, car: "si" };
  const plan = buildPlan(q, municipalities.roma, municipalities.milano);
  assert.equal(task(plan, "auto").kind, "dont");
});

test("Figli aggiungono la verifica di scuola e servizi locali", () => {
  const q = { ...base, children: "si" };
  const plan = buildPlan(q, municipalities.roma, municipalities.milano);
  assert.equal(task(plan, "scuola").kind, "verify");
});

test("Animali aggiungono la verifica dei dati", () => {
  const q = { ...base, pets: "si" };
  const plan = buildPlan(q, municipalities.roma, municipalities.milano);
  assert.equal(task(plan, "animali").kind, "verify");
});

test("Cambio residenza ha scadenza di 20 giorni", () => {
  const plan = buildPlan(base, municipalities.roma, municipalities.milano);
  assert.equal(task(plan, "residenza").timing, "entro 20 giorni dal trasferimento");
  assert.equal(task(plan, "residenza").when, "Entro 9 novembre");
});

test("Medico e comunicazioni sono successive all'aggiornamento della residenza", () => {
  const plan = buildPlan(base, municipalities.roma, municipalities.milano);
  assert.equal(task(plan, "medico").timing, "dopo l'aggiornamento della residenza");
  assert.equal(task(plan, "comunicazioni").timing, "dopo l'aggiornamento della residenza");
});

test("Il piano contiene gli adempimenti essenziali", () => {
  const plan = buildPlan(base, municipalities.roma, municipalities.milano);
  for (const id of [
    "residenza",
    "tari-nuova",
    "tari-vecchia",
    "utenze",
    "internet",
    "medico",
    "contatori",
    "documenti",
    "comunicazioni"
  ]) {
    task(plan, id);
  }
});
