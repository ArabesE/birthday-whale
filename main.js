// === 0. Celebration Sounds ===
// For now, we'll use web audio synthesis instead of audio files
// This creates beautiful whale-like sounds programmatically

// --- 3D Birthday Whale Interactive Page ---
// Uses: three.js, anime.js, canvas-confetti (all via CDN)

// === 1. DOM Setup ===
const hintText = document.getElementById("hint-text");
const celebrationText = document.getElementById("celebration-text");

// Create and insert the canvas for three.js
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setClearColor(0x001122, 1);
// Respect device pixel ratio for crisp rendering; cap to avoid overdraw on hiDPI
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.id = "three-canvas";
document.body.appendChild(renderer.domElement);
// Disable default touch gestures so pointer events fire immediately on mobile
renderer.domElement.style.touchAction = "none";

// === 2. Scene, Camera, Controls ===
const scene = new THREE.Scene();
let bgColor = { color: "#001122" };

// Camera - optimized for mobile and desktop viewing
const cameraDistance = 16; // Much further back for full mobile visibility
const cameraY = 3; // Higher camera position
const lookAtY = -1; // Look down at whale to position it lower on screen
const camera = new THREE.PerspectiveCamera(
  65, // Wide FOV for mobile phones
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, cameraY, cameraDistance);
camera.lookAt(0, lookAtY, 0);

// Responsive resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// === 3. Ocean Floor ===
const oceanFloorGeo = new THREE.PlaneGeometry(40, 40, 64, 64);
const oceanFloorMat = new THREE.MeshPhongMaterial({
  color: 0x0c2340,
  shininess: 20,
  transparent: true,
  opacity: 0.8,
});
const oceanFloor = new THREE.Mesh(oceanFloorGeo, oceanFloorMat);
oceanFloor.rotation.x = -Math.PI / 2;
oceanFloor.position.y = -4;
scene.add(oceanFloor);

// === 4. Whale Body (grouped for animation) ===
const whaleGroup = new THREE.Group();
whaleGroup.position.y = -6.2; // Lower the whale even further toward the bottom
const whaleBaseY = whaleGroup.position.y; // Preserve base Y to swim around it
scene.add(whaleGroup);

// Main body (ellipsoid)
const bodyGeo = new THREE.SphereGeometry(2.5, 32, 16);
bodyGeo.scale(1.8, 1, 1); // elongate
const bodyMat = new THREE.MeshPhongMaterial({
  color: 0x1e3a5f,
  shininess: 60,
  specular: 0x4f94cd,
});
const whaleBody = new THREE.Mesh(bodyGeo, bodyMat);
whaleBody.position.set(0, 0, 0);
whaleGroup.add(whaleBody);

// Tail
const tailGeo = new THREE.ConeGeometry(1.2, 2.5, 16);
const tailMat = new THREE.MeshPhongMaterial({
  color: 0x1e3a5f,
  shininess: 60,
  specular: 0x4f94cd,
});
const whaleTail = new THREE.Mesh(tailGeo, tailMat);
whaleTail.rotation.x = Math.PI / 2;
whaleTail.position.set(0, 0, -3.5);
whaleGroup.add(whaleTail);

// Fins
const finGeo = new THREE.SphereGeometry(0.8, 16, 8);
finGeo.scale(2, 0.2, 1);
const finMat = new THREE.MeshPhongMaterial({
  color: 0x2d4a70,
  shininess: 60,
  specular: 0x4f94cd,
});
const leftFin = new THREE.Mesh(finGeo, finMat);
leftFin.position.set(-2.8, -0.5, 0.5);
leftFin.rotation.z = -0.3;
whaleGroup.add(leftFin);

const rightFin = new THREE.Mesh(finGeo, finMat);
rightFin.position.set(2.8, -0.5, 0.5);
rightFin.rotation.z = 0.3;
whaleGroup.add(rightFin);

// Eyes
const eyeGeo = new THREE.SphereGeometry(0.15, 16, 16);
const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
leftEye.position.set(-1.2, 0.8, 2.2);
whaleGroup.add(leftEye);

const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
rightEye.position.set(1.2, 0.8, 2.2);
whaleGroup.add(rightEye);

// === 5. Musical Note Bubbles System ===
// Update: Transposed to C major (next higher). Pre-celebration pops follow the first phrase in C: G4 G4 A4 G4 C5 B4
const birthdayNotes = ["G", "G", "A", "G", "C", "B"]; // First phrase, C major
const TOTAL_NOTES = birthdayNotes.length; // Avoid magic numbers elsewhere
const noteFrequencies = {
  // Octave-specific notes (4th octave for lower start)
  D4: 293.66,
  E4: 329.63,
  "F#4": 369.99,
  // Existing mapping (kept for compatibility with any legacy calls)
  G: 392.0, // G4 - tonic
  A: 440.0, // A4
  B: 493.88, // B4
  C: 523.25, // C5
  D: 587.33, // D5
  E: 659.25, // E5
  F: 698.46, // F5
  // Provide F# in the 5th octave as well if ever needed
  "F#": 739.99, // F#5
};

const activeBubbles = []; // Currently floating bubbles
const notesPopped = []; // Track which notes have been popped
const whalemouth = { x: 0, y: 0.5, z: 2.5 }; // Whale's mouth position (y will be based on whaleGroup.position)
let lastBubbleTime = 0;
let gameStarted = false;
let lastHandledAt = -Infinity; // tracks last time we successfully handled a pop

// === 6. Ambient Ocean Lighting ===
const ambientLight = new THREE.AmbientLight(0x1e4a6b, 0.4);
scene.add(ambientLight);

// Directional light (moonlight from above)
const moonLight = new THREE.DirectionalLight(0x87ceeb, 0.6);
moonLight.position.set(0, 10, 5);
moonLight.castShadow = true;
scene.add(moonLight);

// === 7. Celebration Light (initially off) ===
const celebrationLight = new THREE.PointLight(0x00ffff, 0, 50, 2);
celebrationLight.position.set(0, 8, 0);
scene.add(celebrationLight);

// === 8. Raycaster for Note Interaction ===
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// === 6. Bubble Creation and Management ===
function createBubble() {
  // Create bubble geometry
  const bubbleGeo = new THREE.SphereGeometry(0.4, 16, 16); // slightly bigger bubbles
  const bubbleMat = new THREE.MeshBasicMaterial({
    color: 0x40e0d0,
    transparent: true,
    opacity: 0.8,
  });
  const bubble = new THREE.Mesh(bubbleGeo, bubbleMat);

  // Start at whale's mouth with slight randomization
  bubble.position.set(
    whalemouth.x + (Math.random() - 0.5) * 0.5,
    whaleGroup.position.y + 0.5,
    whalemouth.z + (Math.random() - 0.5) * 0.3
  );

  // Add bubble properties (no specific note - determined on pop)
  bubble.userData = {
    velocity: {
      x: (Math.random() - 0.5) * 0.005,
      y: 0.015 + Math.random() * 0.008, // Faster upward (0.015-0.023) so they float off-screen
      z: (Math.random() - 0.5) * 0.003,
    },
    life: 0,
    maxLife: 1500, // Longer lifetime so most bubbles reach the top
  };

  scene.add(bubble);
  activeBubbles.push(bubble);

  // Add bubble light
  const light = new THREE.PointLight(0x40e0d0, 0.6, 2, 2);
  light.position.copy(bubble.position);
  scene.add(light);
  bubble.userData.light = light;
}

function updateBubbles() {
  for (let i = activeBubbles.length - 1; i >= 0; i--) {
    const bubble = activeBubbles[i];
    const data = bubble.userData;

    // Update position with bubble physics
    bubble.position.x += data.velocity.x;
    bubble.position.y += data.velocity.y;
    bubble.position.z += data.velocity.z;

    // Update light position
    data.light.position.copy(bubble.position);

    // Add some wobble
    data.life++;
    bubble.position.x += Math.sin(data.life * 0.1) * 0.005;
    bubble.position.z += Math.cos(data.life * 0.08) * 0.003;

    // Remove bubble if it's too old or too high
    if (data.life > data.maxLife || bubble.position.y > 8) {
      scene.remove(bubble);
      scene.remove(data.light);
      activeBubbles.splice(i, 1);
    }
  }
}

function getIntersects(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  let x, y;
  if (event.touches) {
    x = event.touches[0].clientX;
    y = event.touches[0].clientY;
  } else {
    x = event.clientX;
    y = event.clientY;
  }
  mouse.x = ((x - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((y - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  return raycaster.intersectObjects(activeBubbles);
}

let hintTimeout,
  hintShown = false,
  firstBubblePopped = false,
  celebrationStarted = false;

// Debounce to avoid duplicate input on mobile (pointer + synthetic touch)
let lastInputAt = -Infinity; // so the very first tap is never debounced

function showHint() {
  if (!hintShown && !firstBubblePopped) {
    hintText.style.opacity = 1;
    hintShown = true;
  }
}

function hideHint() {
  if (hintShown) {
    anime({
      targets: hintText,
      opacity: 0,
      duration: 500,
      easing: "easeInOutQuad",
    });
    hintShown = false;
  }
}

// === 9. Web Audio for Whale Songs ===
let audioContext;
let masterGain;
let musicboxBuffer = null;
let musicboxSource = null;
let musicboxGain = null;

function initAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioContext.createGain();
    masterGain.connect(audioContext.destination);
    masterGain.gain.value = 0.3;
  }
}

// Ensure AudioContext is resumed on mobile after a user gesture
function ensureAudioUnlocked() {
  initAudio();
  if (audioContext && audioContext.state === "suspended") {
    return audioContext.resume().catch(() => {
      /* noop: resume can fail without user gesture */
    });
  }
  return Promise.resolve();
}

async function loadMusicbox() {
  initAudio();
  if (musicboxBuffer) return musicboxBuffer;
  const res = await fetch("sounds/musicbox.wav");
  const arrayBuffer = await res.arrayBuffer();
  musicboxBuffer = await audioContext.decodeAudioData(arrayBuffer);
  return musicboxBuffer;
}

function playMusicbox(loop = true, delaySec = 0.0) {
  if (!musicboxBuffer) return;
  // Stop any existing instance
  stopMusicbox();
  musicboxSource = audioContext.createBufferSource();
  musicboxSource.buffer = musicboxBuffer;
  musicboxSource.loop = loop;

  musicboxGain = audioContext.createGain();
  musicboxGain.gain.setValueAtTime(0.0, audioContext.currentTime + delaySec);
  musicboxGain.gain.linearRampToValueAtTime(0.25, audioContext.currentTime + delaySec + 1.0);

  musicboxSource.connect(musicboxGain);
  musicboxGain.connect(masterGain);
  musicboxSource.start(audioContext.currentTime + delaySec);
}

function stopMusicbox(fadeOutSec = 0.6) {
  if (musicboxSource && musicboxGain) {
    const now = audioContext.currentTime;
    musicboxGain.gain.cancelScheduledValues(now);
    musicboxGain.gain.setValueAtTime(musicboxGain.gain.value, now);
    musicboxGain.gain.linearRampToValueAtTime(0.0, now + fadeOutSec);
    try {
      musicboxSource.stop(now + fadeOutSec + 0.05);
    } catch {
      /* noop: stopping a source shortly after start may throw */
    }
  }
  musicboxSource = null;
}

function playWhaleNote(frequency, duration = 0.8) {
  initAudio();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.connect(gain);
  gain.connect(masterGain);

  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(
    frequency * 0.7,
    audioContext.currentTime + duration
  );
  oscillator.type = "sine";

  gain.gain.setValueAtTime(0, audioContext.currentTime);
  gain.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.1);
  gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
}

// Schedule a note precisely in the future (used for melody playback)
function scheduleWhaleNote(frequency, startAt, duration = 0.8) {
  initAudio();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.connect(gain);
  gain.connect(masterGain);

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, startAt);
  oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.7, startAt + duration);

  // Smooth attack/release
  gain.gain.setValueAtTime(0, startAt);
  gain.gain.linearRampToValueAtTime(0.5, startAt + Math.min(0.08, duration * 0.2));
  gain.gain.exponentialRampToValueAtTime(0.01, startAt + duration);

  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.01);
}

// === 10. Bubble Pop Handler ===
async function onPointerDown(event) {
  if (celebrationStarted) return;

  // Compute intersections immediately using the original event coordinates
  const intersects = getIntersects(event);

  // Start the game on first click
  if (!gameStarted) {
    gameStarted = true;
    hideHint();
  }

  // Ensure audio is unlocked (mobile Safari/Chrome). If not running, await resume so first note plays.
  if (!audioContext || audioContext.state !== "running") {
    try {
      await ensureAudioUnlocked();
    } catch {
      /* noop: resume may fail on some browsers */
    }
  }

  if (intersects.length > 0) {
    // Debounce only when there's an actual hit to avoid blocking click fallback
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    if (now - lastInputAt < 220) return;
    lastInputAt = now;

    // Prevent default browser gestures only if we actually hit something
    if (event && typeof event.preventDefault === "function" && event.cancelable) {
      event.preventDefault();
    }
    if (event && typeof event.stopPropagation === "function") {
      event.stopPropagation();
    }
    const bubble = intersects[0].object;
    const data = bubble.userData;
    // Prevent popping the same bubble more than once due to duplicate events
    if (data && data.popped) return;
    if (data) data.popped = true;

    // Mark handled time
    lastHandledAt = now;

    // Play the next note in sequence based on how many have been popped
    const nextNoteIndex = notesPopped.length; // Current length = next note index
    const nextNote = birthdayNotes[nextNoteIndex];
    if (!nextNote) return; // guard against out-of-range
    const frequency = noteFrequencies[nextNote];
    if (typeof frequency !== "number") return;
    playWhaleNote(frequency);

    // Add to popped notes
    notesPopped.push(nextNote);
    console.log(`Popped bubble! Playing note: ${nextNote} (${notesPopped.length}/${TOTAL_NOTES})`);

    // Always hide hint when bubble is popped
    if (hintShown) {
      hideHint();
    }

    // Remove bubble with pop animation
    anime({
      targets: bubble.scale,
      x: 1.5,
      y: 1.5,
      z: 1.5,
      duration: 200,
      easing: "easeOutQuad",
    });

    anime({
      targets: bubble.material,
      opacity: 0,
      duration: 200,
      easing: "easeOutQuad",
      complete: () => {
        scene.remove(bubble);
        scene.remove(data.light);
        const index = activeBubbles.indexOf(bubble);
        if (index > -1) activeBubbles.splice(index, 1);
      },
    });

    if (!firstBubblePopped) {
      firstBubblePopped = true;
    }

    // Check if song is complete
    if (notesPopped.length === TOTAL_NOTES) {
      triggerCelebration();
    }
  }
}

renderer.domElement.addEventListener("pointerdown", onPointerDown);
// Fallback: some mobile browsers may delay/suppress pointerdown on first tap
renderer.domElement.addEventListener("click", (e) => {
  // If celebration hasn't started and we didn't handle pointerdown, try handling via click
  const now = typeof performance !== "undefined" ? performance.now() : Date.now();
  if (!celebrationStarted && now - lastHandledAt > 50) {
    onPointerDown(e);
  }
});

// === 11. Celebration Sequence ===
function triggerCelebration() {
  celebrationStarted = true;

  // 1. Ocean background becomes bioluminescent
  anime({
    targets: bgColor,
    color: "#002b4d",
    duration: 2000,
    easing: "easeInOutQuad",
    update: () => {
      renderer.setClearColor(bgColor.color);
    },
  });

  // 2. Celebration light activates
  anime({
    targets: celebrationLight,
    intensity: 15,
    duration: 1500,
    easing: "easeInOutQuad",
  });

  // 3. Whale starts gentle swimming motion
  whaleSwimming = true;

  // 4. Play the birthday song (first four lines) in C major with proper rhythm
  //    Then continue with the music box background when the melody ends.
  playWhaleSong().then(() => {
    // Start music box a tiny moment after melody ends
    loadMusicbox().then(() => playMusicbox(true, 0.1));
  });

  // 5. Ocean floor becomes bioluminescent
  anime({
    targets: oceanFloorMat,
    emissive: new THREE.Color(0x003366),
    duration: 2000,
    easing: "easeInOutQuad",
  });

  // 6. Underwater confetti (bubbles)
  createBubbleConfetti();
  setTimeout(() => createBubbleConfetti(), 600);
  setTimeout(() => createBubbleConfetti(), 1200);

  // 7. Celebration text
  anime({
    targets: celebrationText,
    opacity: 1,
    duration: 1500,
    easing: "easeInOutQuad",
  });
}

function playWhaleSong() {
  initAudio();
  // Happy Birthday in C major (starting on G4)
  // Lines (scale degrees in C):
  // 1) 5 5 6 5 1' 7   -> G4 G4 A4 G4 C5 B4
  // 2) 5 5 6 5 2' 1'  -> G4 G4 A4 G4 D5 C5
  // 3) 5 5 5 3' 1' 7 6 -> G4 G4 G4 E5 C5 B4 A4
  // 4) 4' 4' 3' 1' 2' 1' -> F5 F5 E5 C5 D5 C5
  // Durations are in beats (quarter note = 1 beat). Rhythm matches the familiar tune.
  const sequence = [
    // Line 1
    { n: "G", d: 0.5 },
    { n: "G", d: 0.5 },
    { n: "A", d: 1 },
    { n: "G", d: 1 },
    { n: "C", d: 1 }, // C5
    { n: "B", d: 2 },
    // Line 2
    { n: "G", d: 0.5 },
    { n: "G", d: 0.5 },
    { n: "A", d: 1 },
    { n: "G", d: 1 },
    { n: "D", d: 1 }, // D5
    { n: "C", d: 2 },
    // Line 3
    { n: "G", d: 0.5 },
    { n: "G", d: 0.5 },
    { n: "G", d: 1 },
    { n: "E", d: 1 }, // E5
    { n: "C", d: 1 },
    { n: "B", d: 1 },
    { n: "A", d: 2 },
    // Line 4
    { n: "F", d: 0.5 }, // F5
    { n: "F", d: 0.5 },
    { n: "E", d: 1 },
    { n: "C", d: 1 },
    { n: "D", d: 1 },
    { n: "C", d: 2 },
  ];

  const tempoBPM = 110; // Feel free to tweak
  const secPerBeat = 60 / tempoBPM;
  let t = audioContext.currentTime + 0.12; // small offset to start cleanly
  let totalBeats = 0;

  for (const { n, d } of sequence) {
    const freq = noteFrequencies[n];
    if (freq) {
      // Slightly shorten sustain to make room between notes
      const durSec = secPerBeat * d * 0.95;
      scheduleWhaleNote(freq, t, durSec);
    }
    t += secPerBeat * d;
    totalBeats += d;
  }

  const totalSeconds = totalBeats * secPerBeat + 0.12;
  return new Promise((resolve) => setTimeout(() => resolve(totalSeconds), totalSeconds * 1000));
}

function createBubbleConfetti() {
  confetti({
    particleCount: 50,
    spread: 80,
    angle: 90,
    origin: { x: Math.random() * 0.6 + 0.2, y: 1 },
    colors: ["#40e0d0", "#87ceeb", "#00ffff", "#1e90ff", "#4fd0e4"],
    gravity: -0.3,
    scalar: 0.8,
    shapes: ["circle"],
  });
}

// === 12. Animation Loop ===
let whaleSwimming = false;
let time = 0;

function animate() {
  requestAnimationFrame(animate);
  time += 0.01;

  // Gentle whale breathing animation
  whaleGroup.scale.y = 1 + 0.05 * Math.sin(time * 2);

  if (whaleSwimming) {
    // Swimming motion during celebration, centered around base Y
    whaleGroup.position.y = whaleBaseY + Math.sin(time * 1.5) * 0.3;
    whaleGroup.rotation.z = Math.sin(time * 0.8) * 0.1;
    whaleTail.rotation.y = Math.sin(time * 4) * 0.2;
  }

  // Generate new bubbles if game has started and not all notes are popped
  if (gameStarted && !celebrationStarted && notesPopped.length < TOTAL_NOTES) {
    const currentTime = Date.now();
    const timeSinceLastBubble = currentTime - lastBubbleTime;
    const randomDelay = 2000 + Math.random() * 3000; // 2-5 second intervals

    if (timeSinceLastBubble > randomDelay) {
      createBubble(); // Create generic bubble - note determined on pop
      lastBubbleTime = currentTime;
    }
  }

  // Update all active bubbles
  updateBubbles();

  // Ocean floor wave animation
  const positions = oceanFloor.geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const z = positions.getZ(i);
    const wave = Math.sin(time * 0.5 + x * 0.1) * Math.cos(time * 0.3 + z * 0.1) * 0.1;
    positions.setY(i, wave);
  }
  positions.needsUpdate = true;

  renderer.render(scene, camera);
}

animate();

// === 13. Initialize Game ===
celebrationText.style.opacity = 0;
hintText.style.opacity = 0;
clearTimeout(hintTimeout);
hintTimeout = setTimeout(showHint, 3000);

// Initialize game state and auto-start bubble generation
gameStarted = false;
lastBubbleTime = Date.now();

// Auto-start bubble generation after 2.5 seconds
setTimeout(() => {
  gameStarted = true;
  console.log("Bubble generation started automatically!");
}, 2500);
