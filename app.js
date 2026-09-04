const STORAGE_KEY = "riposoState";

// ---------------------------------------------------------
// PARAMETRI
// ---------------------------------------------------------

// Durata normale prevista del riposo: 3 ore
const RIPOSO_BASE_MINUTI = 180;

// Modalità test
const TEST_MODE = false;

// Durata fittizia del riposo, in minuti.
// Esempi:
// 120 = 2:00
// 165 = 2:45
// 180 = 3:00
// 195 = 3:15
// 225 = 3:45
const TEST_ELAPSED_MINUTES = 194;

const statusEl = document.getElementById("status");
const timerEl = document.getElementById("timer");
const estimateEl = document.getElementById("estimate");

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");

const resultView = document.getElementById("resultView");
const activeView = document.getElementById("activeView");

const actualDurationEl =
  document.getElementById("actualDuration");

const roundedDurationEl =
  document.getElementById("roundedDuration");
  
const startTimeEl =
  document.getElementById("startTime");

const endTimeEl =
  document.getElementById("endTime");

const newBtn = document.getElementById("newBtn");

let displayTimer = null;


/*
 * ---------------------------------------------------------
 * SALVATAGGIO
 * ---------------------------------------------------------
 */

function loadState() {
  try {
    return JSON.parse(
      localStorage.getItem(STORAGE_KEY)
    ) || null;

  } catch {
    return null;
  }
}


function saveState(state) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(state)
  );
}


function clearState() {
  localStorage.removeItem(STORAGE_KEY);
}


/*
 * ---------------------------------------------------------
 * FORMATTAZIONE
 * ---------------------------------------------------------
 */

function pad(number) {
  return String(number).padStart(2, "0");
}


function formatClock(milliseconds) {

  const totalSeconds =
    Math.max(0, Math.floor(milliseconds / 1000));

  const hours =
    Math.floor(totalSeconds / 3600);

  const minutes =
    Math.floor(
      (totalSeconds % 3600) / 60
    );

  const seconds =
    totalSeconds % 60;

  return (
    `${pad(hours)}:` +
    `${pad(minutes)}:` +
    `${pad(seconds)}`
  );
}


function formatDuration(milliseconds) {

  const totalSeconds =
    Math.max(0, Math.floor(milliseconds / 1000));

  const hours =
    Math.floor(totalSeconds / 3600);

  const minutes =
    Math.floor((totalSeconds % 3600) / 60);

  const seconds =
    totalSeconds % 60;

  return (
    `${pad(hours)}:` +
    `${pad(minutes)}:` +
    `${pad(seconds)}`
  );
}

function formatHoursMinutes(milliseconds) {

  const totalMinutes =
    Math.round(milliseconds / 60000);

  const hours =
    Math.floor(totalMinutes / 60);

  const minutes =
    totalMinutes % 60;

  return (
    `${pad(hours)}:` +
    `${pad(minutes)}`
  );
}


/*
 * ---------------------------------------------------------
 * ARROTONDAMENTO
 * ---------------------------------------------------------
 *
 * Per la 0.1 utilizziamo il normale arrotondamento
 * alla mezz'ora più vicina.
 *
 * Esempi:
 *
 * 1h14  -> 1h
 * 1h15  -> 1h30
 * 1h44  -> 1h30
 * 1h45  -> 2h
 *
 * Questa funzione verrà sostituita con la regola
 * definitiva concordata per il foglio Excel.
 */

function calculateDifference(milliseconds) {

  const baseMilliseconds =
    RIPOSO_BASE_MINUTI *
    60 *
    1000;

  return milliseconds -
    baseMilliseconds;
}

function getResultText(durationMilliseconds) {

  const difference =
    calculateDifference(
      durationMilliseconds
    );


  const rounded =
    roundToHalfHour(
      difference
    );


  if (rounded === 0) {

    return "";
  }


  const value =
    formatHoursMinutes(
      rounded
    );


  if (difference > 0) {

    return `${value} ASSENZA`;
  }


  return `${value} RECUPERO`;
}


function roundToHalfHour(milliseconds) {

  const halfHour =
    30 * 60 * 1000;

  return Math.round(
    Math.abs(milliseconds) / halfHour
  ) * halfHour;
}


function formatHours(milliseconds) {

  const halfHours =
    Math.round(
      milliseconds /
      (30 * 60 * 1000)
    );

  const hours = halfHours / 2;


  if (Number.isInteger(hours)) {
    return `${hours} h`;
  }


  return `${hours.toFixed(1)} h`;
}


/*
 * ---------------------------------------------------------
 * CRONOMETRO VISIVO
 * ---------------------------------------------------------
 */

function getElapsedTime(startTimestamp) {

  const realElapsed =
    Date.now() - startTimestamp;


  if (TEST_MODE) {

    return (
      TEST_ELAPSED_MINUTES *
      60 *
      1000
    ) + realElapsed;
  }


  return realElapsed;
}


function updateRunningTimer(startTimestamp) {

  const elapsed =
    getElapsedTime(startTimestamp);


  // Cronometro
  timerEl.textContent =
    formatClock(elapsed);


  // Stima assenza / recupero
  estimateEl.textContent =
    getResultText(elapsed);
}


/*
 * ---------------------------------------------------------
 * STATO: RIPOSO IN CORSO
 * ---------------------------------------------------------
 */

function showRunning(startTimestamp) {

  activeView.classList.remove("hidden");
  resultView.classList.add("hidden");

  statusEl.textContent =
    "Riposo in corso";

  startBtn.classList.add("hidden");
  stopBtn.classList.remove("hidden");


  updateRunningTimer(startTimestamp);


  if (displayTimer) {
    clearInterval(displayTimer);
  }


  displayTimer = setInterval(
    () => updateRunningTimer(startTimestamp),
    1000
  );
}


/*
 * ---------------------------------------------------------
 * STATO: PRONTO
 * ---------------------------------------------------------
 */

function showReady() {

  if (displayTimer) {

    clearInterval(displayTimer);
    displayTimer = null;
  }


  activeView.classList.remove("hidden");
  resultView.classList.add("hidden");


  statusEl.textContent = "Pronto";

  timerEl.textContent = "00:00:00";
  estimateEl.textContent = "";


  startBtn.classList.remove("hidden");
  stopBtn.classList.add("hidden");
}


/*
 * ---------------------------------------------------------
 * STATO: RISULTATO
 * ---------------------------------------------------------
 */

function showResult(
  durationMilliseconds,
  startTimestamp,
  endTimestamp
) {

  if (displayTimer) {

    clearInterval(displayTimer);
    displayTimer = null;
  }


  activeView.classList.add("hidden");
  resultView.classList.remove("hidden");
  
  startTimeEl.textContent =
    formatTime(startTimestamp);
	
  endTimeEl.textContent =
    formatTime(endTimestamp);

  actualDurationEl.textContent =
    formatDuration(durationMilliseconds);


  roundedDurationEl.textContent =
  getResultText(
    durationMilliseconds
  );
}

function formatTime(timestamp) {

  const date =
    new Date(timestamp);

  return date.toLocaleTimeString(
    "it-IT",
    {
      hour: "2-digit",
      minute: "2-digit"
    }
  );
}


/*
 * ---------------------------------------------------------
 * START
 * ---------------------------------------------------------
 */

startBtn.addEventListener(
  "click",
  () => {

    const startTimestamp =
      Date.now();


    saveState({

      status: "running",

      startTimestamp
    });


    showRunning(startTimestamp);
  }
);


/*
 * ---------------------------------------------------------
 * STOP
 * ---------------------------------------------------------
 */

stopBtn.addEventListener(
  "click",
  () => {

    if (!confirm("Terminare il riposo?")) {
      return;
    }
	
	const state =
      loadState();


    if (
      !state ||
      state.status !== "running"
    ) {

      showReady();
      return;
    }


    const durationMilliseconds =
  getElapsedTime(
    state.startTimestamp
  );


const endTimestamp =
  state.startTimestamp +
  durationMilliseconds;


    saveState({

      status: "finished",

      startTimestamp:
        state.startTimestamp,

      endTimestamp,

      durationMs:
        durationMilliseconds
    });


    showResult(
	  durationMilliseconds,
	  state.startTimestamp,
	  endTimestamp
	);
  }
);


/*
 * ---------------------------------------------------------
 * NUOVO RIPOSO
 * ---------------------------------------------------------
 */

newBtn.addEventListener(
  "click",
  () => {

    clearState();

    showReady();
  }
);


/*
 * ---------------------------------------------------------
 * RIPRISTINO ALL'APERTURA
 * ---------------------------------------------------------
 */

function restore() {

  const state =
    loadState();


  if (!state) {

    showReady();
    return;
  }


  if (
    state.status === "running"
  ) {

    showRunning(
      state.startTimestamp
    );

    return;
  }


  if (
    state.status === "finished"
  ) {

    showResult(
  state.durationMs,
  state.startTimestamp,
  state.endTimestamp
);

    return;
  }


  showReady();
}


restore();
