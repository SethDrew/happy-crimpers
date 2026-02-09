(function () {
  'use strict';

  // --- Workout Definitions ---
  const WORKOUTS = {
    maxhang: {
      name: 'Max Hang',
      hold: 'jug4',
      holdLabel: 'jug-label',
      sets: 6,
      phases: [
        { label: 'ARM 1', type: 'hang', duration: 10 },
        { label: 'SWITCH ARMS', type: 'switch', duration: 15 },
        { label: 'ARM 2', type: 'hang', duration: 10 },
        { label: 'REST', type: 'rest', duration: 180 }
      ]
    },
    cooldown: {
      name: 'Cooldown',
      hold: null,
      holdLabel: 'any-label',
      sets: 3,
      phases: [
        { label: 'HANG', type: 'hang', duration: 30 },
        { label: 'REST', type: 'rest', duration: 60 }
      ]
    }
  };

  // --- DOM Elements ---
  const homeScreen = document.getElementById('home-screen');
  const workoutScreen = document.getElementById('workout-screen');
  const completeScreen = document.getElementById('complete-screen');
  const workoutNameEl = document.getElementById('workout-name');
  const setProgressEl = document.getElementById('set-progress');
  const phaseLabelEl = document.getElementById('phase-label');
  const timerDisplayEl = document.getElementById('timer-display');
  const stopBtn = document.getElementById('stop-btn');
  const doneBtn = document.getElementById('done-btn');

  // --- Audio ---
  let audioCtx = null;

  function ensureAudioCtx() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function beep(frequency, durationMs, volume) {
    ensureAudioCtx();
    volume = volume || 0.3;
    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = frequency;
    osc.type = 'sine';
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + durationMs / 1000);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + durationMs / 1000);
  }

  function countdownBeep() {
    beep(880, 100, 0.25);
  }

  function goBeep() {
    beep(660, 200, 0.4);
    setTimeout(function () { beep(660, 200, 0.4); }, 220);
  }

  function stopBeep() {
    beep(440, 300, 0.35);
  }

  function warningBeep() {
    beep(600, 80, 0.15);
  }

  // --- Wake Lock ---
  var wakeLock = null;

  async function requestWakeLock() {
    if ('wakeLock' in navigator) {
      try {
        wakeLock = await navigator.wakeLock.request('screen');
      } catch (e) {
        // silently fail
      }
    }
  }

  function releaseWakeLock() {
    if (wakeLock) {
      wakeLock.release();
      wakeLock = null;
    }
  }

  // --- Screen Management ---
  function showScreen(screen) {
    homeScreen.classList.remove('active');
    workoutScreen.classList.remove('active');
    completeScreen.classList.remove('active');
    screen.classList.add('active');
  }

  // --- SVG Hold Highlighting ---
  function clearHighlights() {
    document.querySelectorAll('.hold').forEach(function (h) {
      h.classList.remove('highlighted');
    });
    document.querySelectorAll('.hold-label').forEach(function (l) {
      l.classList.remove('visible');
    });
  }

  function highlightHold(workout) {
    clearHighlights();
    if (workout.hold) {
      var holdEl = document.querySelector('[data-hold="' + workout.hold + '"]');
      if (holdEl) holdEl.classList.add('highlighted');
    }
    if (workout.holdLabel) {
      var labelEl = document.getElementById(workout.holdLabel);
      if (labelEl) labelEl.classList.add('visible');
    }
  }

  // --- Timer State ---
  var currentWorkout = null;
  var currentSet = 0;
  var currentPhaseIndex = 0;
  var secondsLeft = 0;
  var timerInterval = null;

  function startWorkout(workoutKey) {
    ensureAudioCtx();
    currentWorkout = WORKOUTS[workoutKey];
    currentSet = 0;
    currentPhaseIndex = 0;

    workoutNameEl.textContent = currentWorkout.name;
    setProgressEl.textContent = '';
    highlightHold(currentWorkout);
    showScreen(workoutScreen);
    requestWakeLock();

    // 5-second get-ready countdown before first hang
    secondsLeft = 5;
    phaseLabelEl.textContent = 'GET READY';
    phaseLabelEl.className = 'phase-label switch';
    timerDisplayEl.className = 'timer-display switch';
    updateTimerText(secondsLeft);

    timerInterval = setInterval(function () {
      secondsLeft--;
      if (secondsLeft <= 3 && secondsLeft > 0) countdownBeep();
      if (secondsLeft <= 0) {
        clearInterval(timerInterval);
        startPhase();
        return;
      }
      updateTimerText(secondsLeft);
    }, 1000);
  }

  function getPhases() {
    var phases = currentWorkout.phases;
    // On the last set, remove trailing rest
    if (currentSet === currentWorkout.sets - 1) {
      var lastPhase = phases[phases.length - 1];
      if (lastPhase.type === 'rest') {
        return phases.slice(0, -1);
      }
    }
    return phases;
  }

  function startPhase() {
    var phases = getPhases();
    if (currentPhaseIndex >= phases.length) {
      // Move to next set
      currentSet++;
      currentPhaseIndex = 0;
      if (currentSet >= currentWorkout.sets) {
        finishWorkout();
        return;
      }
    }

    var phase = getPhases()[currentPhaseIndex];
    secondsLeft = phase.duration;

    updateDisplay(phase);

    // Play go beep at start of hang phases
    if (phase.type === 'hang') {
      goBeep();
    }

    timerInterval = setInterval(tick, 1000);
  }

  function tick() {
    secondsLeft--;

    var phase = getPhases()[currentPhaseIndex];

    // Audio cues
    if (secondsLeft <= 3 && secondsLeft > 0 && phase.type !== 'rest') {
      countdownBeep();
    }
    if (secondsLeft === 10 && phase.type === 'rest') {
      warningBeep();
    }
    if (secondsLeft <= 3 && secondsLeft > 0 && phase.type === 'rest') {
      countdownBeep();
    }

    if (secondsLeft <= 0) {
      clearInterval(timerInterval);
      // Play stop beep at end of hang phases
      if (phase.type === 'hang') {
        stopBeep();
      }
      currentPhaseIndex++;
      startPhase();
      return;
    }

    updateTimerText(secondsLeft);
  }

  function updateDisplay(phase) {
    setProgressEl.textContent = 'Set ' + (currentSet + 1) + ' of ' + currentWorkout.sets;

    phaseLabelEl.textContent = phase.label;
    phaseLabelEl.className = 'phase-label ' + phase.type;

    timerDisplayEl.className = 'timer-display ' + phase.type;
    updateTimerText(secondsLeft);
  }

  function updateTimerText(seconds) {
    if (seconds >= 60) {
      var m = Math.floor(seconds / 60);
      var s = seconds % 60;
      timerDisplayEl.textContent = m + ':' + (s < 10 ? '0' : '') + s;
    } else {
      timerDisplayEl.textContent = seconds;
    }
  }

  function finishWorkout() {
    clearInterval(timerInterval);
    clearHighlights();
    releaseWakeLock();
    stopBeep();
    showScreen(completeScreen);
  }

  function stopWorkout() {
    if (confirm('Stop workout?')) {
      clearInterval(timerInterval);
      clearHighlights();
      releaseWakeLock();
      showScreen(homeScreen);
    }
  }

  // --- Event Listeners ---
  document.querySelectorAll('.workout-btn[data-workout]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      startWorkout(btn.dataset.workout);
    });
  });

  stopBtn.addEventListener('click', stopWorkout);

  doneBtn.addEventListener('click', function () {
    showScreen(homeScreen);
  });

  // Re-acquire wake lock on visibility change
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && timerInterval) {
      requestWakeLock();
    }
  });

})();
