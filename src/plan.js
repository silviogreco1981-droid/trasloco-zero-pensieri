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

export function buildPlan(q, municipality, originMunicipality) {
  const moveDate = q.date;
  const plan = [];

  if (q.residence === "si") {
    plan.push({
      id: "residenza", kind: "do", cat: "Residenza", title: "Cambio di residenza",
      when: "Entro " + relativeDate(moveDate, 20),
      timing: "entro 20 giorni dal trasferimento",
      text: "Presenta la dichiarazione di cambio di residenza al nuovo Comune tramite ANPR.",
      why: "La dichiarazione deve essere presentata entro 20 giorni dal trasferimento.",
      link: municipality?.residenceUrl || GENERAL_SOURCES.anpr, sourceLabel: municipality?.name || "ANPR"
    });
  }

  plan.push({
    id: "tari-nuova", kind: "verify", cat: "Tasse locali", title: "TARI della nuova casa",
    when: "Prima del trasloco", timing: "verifica la procedura del Comune di arrivo",
    text: municipality?.tariNote || "Verifica come dichiarare la nuova occupazione dell'abitazione nel Comune di arrivo.",
    why: "La procedura e le scadenze TARI sono locali e dipendono dalla situazione dell'immobile.",
    link: municipality?.tariUrl, sourceLabel: municipality?.name || "Comune"
  });

  if (q.residence === "si") {
    const oldHomeOutcome = q.oldHomeOutcome || "non_so";

    if (oldHomeOutcome === "mantengo") {
      plan.push({
        id: "tari-vecchia", kind: "verify", cat: "Tasse locali", title: "TARI della vecchia casa mantenuta",
        when: "Con il trasferimento", timing: "verifica prima del cambio di residenza",
        text: "Stai mantenendo la vecchia casa: non considerare automaticamente chiusa la posizione TARI. Verifica con il Comune di partenza se il tributo continua a essere dovuto.",
        why: "Il trasferimento di residenza non implica necessariamente la cessazione della TARI quando continui a mantenere la disponibilità dell'immobile.",
        link: originMunicipality?.tariUrl, sourceLabel: originMunicipality?.name || "Comune di partenza"
      });
    } else if (oldHomeOutcome === "non_so") {
      plan.push({
        id: "tari-vecchia", kind: "verify", cat: "Tasse locali", title: "Cosa succede alla TARI della vecchia casa?",
        when: "Prima del trasloco", timing: "chiarisci la situazione prima di chiudere o modificare la posizione",
        text: "Hai indicato che non hai ancora deciso cosa fare della vecchia casa. Verifica con il Comune di partenza se devi cessare, modificare o mantenere la posizione TARI.",
        why: "L'adempimento dipende da cosa accade alla vecchia abitazione e dalla sua disponibilità dopo il trasferimento.",
        link: originMunicipality?.tariUrl, sourceLabel: originMunicipality?.name || "Comune di partenza"
      });
    } else if (originMunicipality?.id === "torino" && q.oldHome === "affitto" && oldHomeOutcome === "lascio") {
      plan.push({
        id: "tari-vecchia", kind: "dont", cat: "Tasse locali", title: "Cessazione TARI a Torino",
        when: "Non devi farlo", timing: "se lasci la vecchia abitazione e completi il cambio di residenza",
        text: "Se trasferisci la residenza fuori Torino e lasci la vecchia abitazione, la cessazione TARI avviene automaticamente con la definizione della pratica di residenza.",
        why: "La Città di Torino prevede questo automatismo per il trasferimento in un altro Comune italiano.",
        link: "https://www.comune.torino.it/domande-frequenti/cessazione-servizio-tari-utenze-domestiche", sourceLabel: "Comune di Torino"
      });
    } else if (oldHomeOutcome === "lascio") {
      plan.push({
        id: "tari-vecchia", kind: "verify", cat: "Tasse locali", title: "Cessazione TARI della vecchia casa",
        when: "Con il trasferimento",
        timing: q.oldHome === "affitto"
          ? "quando termina la locazione"
          : "in occasione del trasferimento o della cessione dell'immobile",
        text: q.oldHome === "affitto"
          ? "Verifica la cessazione della TARI collegata alla vecchia abitazione quando termina la locazione."
          : "Verifica con il Comune di partenza la cessazione della TARI collegata alla vecchia abitazione in seguito al trasferimento o alla cessione dell'immobile.",
        why: "Le modalità di cessazione TARI sono locali e dipendono anche dal titolo con cui occupi o detieni l'immobile.",
        link: originMunicipality?.tariUrl, sourceLabel: originMunicipality?.name || "Comune di partenza"
      });
    } else if (oldHomeOutcome === "vendo") {
      plan.push({
        id: "tari-vecchia", kind: "verify", cat: "Tasse locali", title: "TARI della casa venduta",
        when: "Con la vendita", timing: "coordina la cessazione con la data di trasferimento dell'immobile",
        text: "Se vendi la vecchia casa, verifica con il Comune di partenza la cessazione della posizione TARI in relazione alla data in cui perdi la disponibilità dell'immobile.",
        why: "La vendita e la data effettiva di cessazione della disponibilità dell'immobile incidono sulla posizione TARI.",
        link: originMunicipality?.tariUrl, sourceLabel: originMunicipality?.name || "Comune di partenza"
      });
    }
  } else {
    plan.push({
      id: "residenza-non-trasferita", kind: "verify", cat: "Residenza",
      title: "Residenza non trasferita", when: "Prima del trasloco",
      timing: "verifica le conseguenze prima di trasferirti",
      text: "Hai indicato che non vuoi trasferire subito la residenza: verifica se la nuova abitazione sarà una seconda casa o se la tua situazione richiede comunque un cambio di residenza.",
      why: "Residenza anagrafica, disponibilità dell'immobile e TARI possono produrre adempimenti diversi."
    });
  }

  if (q.car === "si" && q.residence === "si") {
    plan.push({
      id: "auto", kind: "dont", cat: "Auto", title: "Aggiornamento della residenza del veicolo",
      when: "Non devi farlo", timing: "nessuna pratica separata",
      text: "Non presentare una pratica separata per aggiornare la residenza del veicolo.",
      why: "Il Comune comunica la variazione anagrafica agli archivi competenti.",
      link: GENERAL_SOURCES.aci, sourceLabel: "ACI"
    });
  }

  plan.push({
    id: "utenze", kind: "do", cat: "Casa", title: "Utenze della nuova casa",
    when: "Prima del trasloco", timing: "prima della data del trasloco",
    text: q.utilitiesActive === "si"
      ? "Chiedi al fornitore quale procedura serve per intestare le forniture: normalmente si tratta di una voltura se il contratto è ancora attivo."
      : "Verifica per ogni fornitura se serve un subentro o una nuova attivazione.",
    why: "Voltura, subentro e nuova attivazione dipendono dallo stato della fornitura.",
    link: GENERAL_SOURCES.areraElectricity, sourceLabel: "ARERA"
  });

  if (q.internet === "si") {
    plan.push({
      id: "internet", kind: "verify", cat: "Casa", title: "Internet e telefono",
      when: "Prima del trasloco", timing: "prima della data del trasloco",
      text: "Controlla se il contratto può essere trasferito al nuovo indirizzo e quali sono i tempi di attivazione.",
      why: "Un trasferimento può richiedere tempi tecnici oppure una nuova attivazione."
    });
  }

  if (q.residence === "si") {
    plan.push({
      id: "medico", kind: "verify", cat: "Salute", title: "Medico di base",
      when: "Dopo il cambio", timing: relativeDate(moveDate, 5, "Da "),
      text: "Verifica se il cambio di Comune richiede o rende opportuno scegliere un nuovo medico nel distretto di destinazione.",
      why: "La scelta del medico dipende dall'organizzazione sanitaria territoriale."
    });
  }

  plan.push({
    id: "contatori", kind: "do", cat: "Trasloco", title: "Foto dei contatori",
    when: "Giorno del trasloco", timing: formatDate(new Date(moveDate + "T12:00:00")),
    text: "Fotografa i contatori della vecchia e della nuova abitazione e conserva le letture insieme alla data.",
    why: "È una semplice precauzione utile per contestare eventuali consumi o letture non corretti."
  });

  plan.push({
    id: "documenti", kind: "dont", cat: "Documenti", title: "Rinnovo automatico dei documenti",
    when: "Non devi farlo", timing: "nessun rinnovo generalizzato",
    text: "Non rifare automaticamente carta d'identità, patente o passaporto solo perché hai cambiato residenza.",
    why: "Il cambio di residenza non comporta un rinnovo generalizzato dei documenti personali."
  });

  plan.push({
    id: "comunicazioni", kind: "verify", cat: "Comunicazioni", title: "Indirizzi presso soggetti privati",
    when: "Dopo il cambio", timing: relativeDate(moveDate, 5, "Da "),
    text: "Controlla banca, assicurazioni, datore di lavoro e altri servizi per cui il vecchio indirizzo è ancora utilizzato.",
    why: "Gli aggiornamenti verso soggetti privati non sono necessariamente coperti dal cambio anagrafico."
  });

  if (q.children === "si") {
    plan.push({
      id: "scuola", kind: "verify", cat: "Famiglia", title: "Scuola e servizi per i figli",
      when: "Prima del trasloco", timing: "prima del trasferimento",
      text: "Verifica se il cambio di Comune incide su scuola, mensa, trasporto scolastico o altri servizi locali.",
      why: "I servizi sono gestiti localmente e possono richiedere aggiornamenti separati."
    });
  }

  if (q.pets === "si") {
    plan.push({
      id: "animali", kind: "verify", cat: "Animali", title: "Dati dell'animale",
      when: "Prima del trasloco", timing: "prima del trasferimento",
      text: "Verifica che i dati di contatto associati all'animale siano aggiornati secondo le regole della tua Regione.",
      why: "La gestione dell'anagrafe degli animali è regionale."
    });
  }

  return plan;
}
