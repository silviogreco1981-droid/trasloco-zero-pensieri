import { GENERAL_SOURCES } from "./data";

function addDays(date, days) {
  const d = new Date(date + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(date) {
  return new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long" }).format(date);
}

function relativeDate(moveDate, days, prefix = "") {
  if (!moveDate) return "";
  return prefix + formatDate(addDays(moveDate, days));
}

export function buildPlan(q, municipality) {
  const moveDate = q.date;
  const plan = [];

  if (q.residence === "si") {
    plan.push({
      id: "residenza",
      kind: "do",
      cat: "Residenza",
      title: "Cambio di residenza",
      when: "Entro " + relativeDate(moveDate, 20),
      timing: "entro 20 giorni dal trasferimento",
      text: "Presenta la dichiarazione di cambio di residenza al nuovo Comune tramite ANPR.",
      why: "La dichiarazione deve essere presentata entro 20 giorni dal trasferimento.",
      link: municipality?.residenceUrl || GENERAL_SOURCES.anpr,
      sourceLabel: municipality?.name || "ANPR"
    });
  }

  plan.push({
    id: "tari",
    kind: "verify",
    cat: "Tasse locali",
    title: "TARI della vecchia e della nuova casa",
    when: "Prima del trasloco",
    timing: "prima di lasciare la vecchia abitazione",
    text: municipality?.tariNote || "Verifica iscrizione, cessazione o trasferimento della posizione TARI nelle due abitazioni.",
    why: "La procedura non è identica in tutti i Comuni e può dipendere dal tipo di trasferimento e dalla disponibilità degli immobili.",
    link: municipality?.tariUrl,
    sourceLabel: municipality?.name || "Comune"
  });

  if (q.car === "si" && q.residence === "si") {
    plan.push({
      id: "auto",
      kind: "dont",
      cat: "Auto",
      title: "Aggiornamento della residenza del veicolo",
      when: "Non devi farlo",
      timing: "nessuna pratica separata",
      text: "Non presentare una pratica separata per aggiornare la residenza del veicolo.",
      why: "Il Comune comunica la variazione anagrafica agli archivi competenti.",
      link: GENERAL_SOURCES.aci,
      sourceLabel: "ACI"
    });
  }

  plan.push({
    id: "utenze",
    kind: "do",
    cat: "Casa",
    title: "Utenze della nuova casa",
    when: "Prima del trasloco",
    timing: relativeDate(moveDate, -14, "Entro "),
    text: q.utilitiesActive === "si"
      ? "Chiedi al fornitore quale procedura serve per intestare le forniture: normalmente si tratta di una voltura se il contratto è ancora attivo."
      : "Verifica per ogni fornitura se serve un subentro o una nuova attivazione.",
    why: "Voltura, subentro e nuova attivazione dipendono dallo stato della fornitura.",
    link: GENERAL_SOURCES.areraElectricity,
    sourceLabel: "ARERA"
  });

  if (q.internet === "si") {
    plan.push({
      id: "internet",
      kind: "verify",
      cat: "Casa",
      title: "Internet e telefono",
      when: "Prima del trasloco",
      timing: relativeDate(moveDate, -14, "Verifica entro "),
      text: "Controlla se il contratto può essere trasferito al nuovo indirizzo e quali sono i tempi di attivazione.",
      why: "Un trasferimento può richiedere tempi tecnici oppure una nuova attivazione.",
      link: "",
      sourceLabel: ""
    });
  }

  if (q.residence === "si") {
    plan.push({
      id: "medico",
      kind: "verify",
      cat: "Salute",
      title: "Medico di base",
      when: "Dopo il cambio",
      timing: relativeDate(moveDate, 5, "Da "),
      text: "Verifica se il cambio di Comune richiede o rende opportuno scegliere un nuovo medico nel distretto di destinazione.",
      why: "La scelta del medico dipende dall'organizzazione sanitaria territoriale.",
      link: "",
      sourceLabel: ""
    });
  }

  plan.push({
    id: "contatori",
    kind: "do",
    cat: "Trasloco",
    title: "Foto dei contatori",
    when: "Giorno del trasloco",
    timing: formatDate(new Date(moveDate + "T12:00:00")),
    text: "Fotografa i contatori della vecchia e della nuova abitazione e conserva le letture insieme alla data.",
    why: "È una semplice precauzione utile per contestare eventuali consumi o letture non corretti."
  });

  plan.push({
    id: "documenti",
    kind: "dont",
    cat: "Documenti",
    title: "Rinnovo automatico dei documenti",
    when: "Non devi farlo",
    timing: "nessun rinnovo generalizzato",
    text: "Non rifare automaticamente carta d'identità, patente o passaporto solo perché hai cambiato residenza.",
    why: "Il cambio di residenza non comporta un rinnovo generalizzato dei documenti personali."
  });

  plan.push({
    id: "comunicazioni",
    kind: "verify",
    cat: "Comunicazioni",
    title: "Indirizzi presso soggetti privati",
    when: "Dopo il cambio",
    timing: relativeDate(moveDate, 5, "Da "),
    text: "Controlla banca, assicurazioni, datore di lavoro e altri servizi per cui il vecchio indirizzo è ancora utilizzato.",
    why: "Gli aggiornamenti verso soggetti privati non sono necessariamente coperti dal cambio anagrafico."
  });

  if (q.children === "si") {
    plan.push({
      id: "scuola",
      kind: "verify",
      cat: "Famiglia",
      title: "Scuola e servizi per i figli",
      when: "Prima del trasloco",
      timing: relativeDate(moveDate, -30, "Verifica entro "),
      text: "Verifica se il cambio di Comune incide su scuola, mensa, trasporto scolastico o altri servizi locali.",
      why: "I servizi sono gestiti localmente e possono richiedere aggiornamenti separati."
    });
  }

  if (q.pets === "si") {
    plan.push({
      id: "animali",
      kind: "verify",
      cat: "Animali",
      title: "Dati dell'animale",
      when: "Prima del trasloco",
      timing: relativeDate(moveDate, -14, "Verifica entro "),
      text: "Verifica che i dati di contatto associati all'animale siano aggiornati secondo le regole della tua Regione.",
      why: "La gestione dell'anagrafe degli animali è regionale."
    });
  }

  return plan;
}