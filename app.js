(function () {
  'use strict';

  // --- Workout Definitions ---
  var GET_READY_DURATION = 5;

  var WORKOUTS = {
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

  // --- Flatten all phases into a linear timeline ---
  function flattenPhases(workout) {
    var flat = [{ label: 'GET READY', type: 'switch', duration: GET_READY_DURATION, set: -1 }];
    for (var s = 0; s < workout.sets; s++) {
      for (var p = 0; p < workout.phases.length; p++) {
        // Skip trailing rest on last set
        if (s === workout.sets - 1 && p === workout.phases.length - 1 && workout.phases[p].type === 'rest') {
          continue;
        }
        flat.push({
          label: workout.phases[p].label,
          type: workout.phases[p].type,
          duration: workout.phases[p].duration,
          set: s
        });
      }
    }
    return flat;
  }

  // --- Compute position from elapsed seconds ---
  function computePosition(flat, elapsedSec) {
    var remaining = elapsedSec;
    for (var i = 0; i < flat.length; i++) {
      if (remaining < flat[i].duration) {
        return {
          index: i,
          secondsLeft: Math.ceil(flat[i].duration - remaining),
          done: false
        };
      }
      remaining -= flat[i].duration;
    }
    return { index: flat.length, secondsLeft: 0, done: true };
  }

  // --- DOM Elements ---
  var homeScreen = document.getElementById('home-screen');
  var workoutScreen = document.getElementById('workout-screen');
  var completeScreen = document.getElementById('complete-screen');
  var workoutNameEl = document.getElementById('workout-name');
  var setProgressEl = document.getElementById('set-progress');
  var phaseLabelEl = document.getElementById('phase-label');
  var timerDisplayEl = document.getElementById('timer-display');
  var stopBtn = document.getElementById('stop-btn');
  var doneBtn = document.getElementById('done-btn');

  // --- Audio ---
  var audioCtx = null;

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

  function countdownBeep() { beep(880, 100, 0.25); }
  function goBeep() {
    beep(660, 200, 0.4);
    setTimeout(function () { beep(660, 200, 0.4); }, 220);
  }
  function stopBeep() { beep(440, 300, 0.35); }
  function warningBeep() { beep(600, 80, 0.15); }

  // --- Wake Lock ---
  var wakeLock = null;

  async function requestWakeLock() {
    if ('wakeLock' in navigator) {
      try {
        wakeLock = await navigator.wakeLock.request('screen');
      } catch (e) { /* silently fail */ }
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

  // --- Timer Display ---
  function updateTimerText(seconds) {
    if (seconds >= 60) {
      var m = Math.floor(seconds / 60);
      var s = seconds % 60;
      timerDisplayEl.textContent = m + ':' + (s < 10 ? '0' : '') + s;
    } else {
      timerDisplayEl.textContent = seconds;
    }
  }

  // --- State ---
  var workoutKey = null;
  var startTime = null;
  var flat = null;
  var timerInterval = null;
  var prevIndex = -1;
  var prevSecondsLeft = -1;

  // --- localStorage persistence ---
  function saveState() {
    if (workoutKey && startTime) {
      localStorage.setItem('hc_state', JSON.stringify({ workoutKey: workoutKey, startTime: startTime }));
    }
  }

  function clearState() {
    localStorage.removeItem('hc_state');
  }

  function loadState() {
    try {
      var raw = localStorage.getItem('hc_state');
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    return null;
  }

  // --- Start a new workout ---
  function startWorkout(key) {
    ensureAudioCtx();
    workoutKey = key;
    startTime = Date.now();
    flat = flattenPhases(WORKOUTS[workoutKey]);
    prevIndex = -1;
    prevSecondsLeft = -1;

    workoutNameEl.textContent = WORKOUTS[workoutKey].name;
    setProgressEl.textContent = '';
    highlightHold(WORKOUTS[workoutKey]);
    showScreen(workoutScreen);
    requestWakeLock();
    saveState();
    runTimer();
  }

  // --- Resume a saved workout ---
  function resumeWorkout(state) {
    workoutKey = state.workoutKey;
    startTime = state.startTime;
    flat = flattenPhases(WORKOUTS[workoutKey]);
    prevIndex = -1;
    prevSecondsLeft = -1;

    // Check if already finished
    var elapsed = (Date.now() - startTime) / 1000;
    var pos = computePosition(flat, elapsed);
    if (pos.done) {
      clearState();
      return;
    }

    workoutNameEl.textContent = WORKOUTS[workoutKey].name;
    highlightHold(WORKOUTS[workoutKey]);
    showScreen(workoutScreen);
    requestWakeLock();
    runTimer();
  }

  // --- Timer loop ---
  function runTimer() {
    tick();
    timerInterval = setInterval(tick, 250);
  }

  function tick() {
    var elapsed = (Date.now() - startTime) / 1000;
    var pos = computePosition(flat, elapsed);

    if (pos.done) {
      clearInterval(timerInterval);
      timerInterval = null;
      clearState();
      finishWorkout();
      return;
    }

    var phase = flat[pos.index];
    var phaseChanged = pos.index !== prevIndex;
    var secondsChanged = pos.secondsLeft !== prevSecondsLeft;

    // Update display on phase change
    if (phaseChanged) {
      phaseLabelEl.textContent = phase.label;
      phaseLabelEl.className = 'phase-label ' + phase.type;
      timerDisplayEl.className = 'timer-display ' + phase.type;

      if (phase.set >= 0) {
        setProgressEl.textContent = 'Set ' + (phase.set + 1) + ' of ' + WORKOUTS[workoutKey].sets;
      } else {
        setProgressEl.textContent = '';
      }
    }

    // Update timer text on seconds change
    if (secondsChanged) {
      updateTimerText(pos.secondsLeft);
    }

    // Audio: only on second boundaries within the same phase (no replay after jump)
    if (secondsChanged && !phaseChanged) {
      if (pos.secondsLeft <= 3 && pos.secondsLeft > 0) {
        countdownBeep();
      }
      if (pos.secondsLeft === 10 && phase.type === 'rest') {
        warningBeep();
      }
    }

    // Audio: phase transition sounds
    if (phaseChanged && prevIndex >= 0) {
      var prev = flat[prevIndex];
      if (prev && prev.type === 'hang') {
        stopBeep();
      }
      if (phase.type === 'hang') {
        setTimeout(function () { goBeep(); }, 80);
      }
    }

    prevIndex = pos.index;
    prevSecondsLeft = pos.secondsLeft;
  }

  function finishWorkout() {
    clearHighlights();
    releaseWakeLock();
    stopBeep();
    showScreen(completeScreen);
  }

  function stopWorkout() {
    if (confirm('Stop workout?')) {
      clearInterval(timerInterval);
      timerInterval = null;
      clearState();
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

  // --- Resume on page load ---
  var saved = loadState();
  if (saved && WORKOUTS[saved.workoutKey]) {
    resumeWorkout(saved);
  }

})();
