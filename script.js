// Adjust the app height based on viewport height for mobile compatibility
function setAppHeight() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

window.addEventListener('DOMContentLoaded', () => {
  setAppHeight();
  setTimeout(setAppHeight, 100);
});

window.addEventListener('resize', setAppHeight);

document.addEventListener("DOMContentLoaded", () => {
  const splash = document.getElementById("splash-screen");
  const app = document.querySelector(".app-container");
  const audio = document.getElementById("start-sound");
  const restartButton = document.getElementById('restart');
  const dingSound = document.getElementById('ding-sound');
  const failSound = document.getElementById('fail-sound');
  const alertSound = document.getElementById('alert-sound');

  let gameStarted = false;
  let score = 0;
  let isPaused = false;
  let pauseOverlay;
  let scoreTimer;

  
  function startScoreTimer() {
    scoreTimer = setInterval(() => {
      score -= 1.4; // deduct 1.4 but never go below 0
      updateScoreDisplay();
    }, 1000); // every second
  }

  document.getElementById('pause').addEventListener('click', () => {
    if (!isPaused) {
      isPaused = true;
      clearInterval(scoreTimer); // pause the score timer
      pauseOverlay.style.display = 'block'; // show the pause overlay
    }
  });


  // Add click event listener for the restart button
  restartButton.addEventListener('click', () => {
    // Play the alert sound
    alertSound.play();

    // Delay the confirm to allow alert.mp3 to start playing
    setTimeout(() => {
      const confirmRestart = confirm("Are you sure you would like to restart?");
      
      if (confirmRestart) {
        // Navigate to index.html (restart game)
        window.location.href = 'index.html';
      }
      // If cancelled, do nothing – game continues
    }, 300); // slight delay so alert.mp3 is audible
  });

  function remainingSetsExist() {
    const unlockedCards = Array.from(document.querySelectorAll('.card:not(.locked)'));
    const setsById = {};

    unlockedCards.forEach(card => {
      const set = card.dataset.set;
      if (!setsById[set]) setsById[set] = [];
      setsById[set].push(card);
    });

    return Object.values(setsById).some(group => group.length >= 3);
  }

    function updateScoreDisplay() {
    document.getElementById('score-value').textContent = Math.floor(score);
  }


  splash.addEventListener("click", () => {
    splash.style.display = "none";
    app.style.display = "flex";

    // Play intro audio after delay
    setTimeout(() => {
      audio.play();
    }, 1200);

    initializeGame();

    // Cover all cards and start the game after 5.1 seconds
    setTimeout(() => {
      document.querySelectorAll('.card').forEach(card => card.classList.add('covered'));
      gameStarted = true;
    }, 5163);

    // Start score timer after 7 seconds
    setTimeout(() => {
      startScoreTimer();
    }, 7000);

    // 🔹 Step 2: Create the pause overlay (full screen groupB.png)
    pauseOverlay = document.createElement('div');
    pauseOverlay.id = 'pause-overlay';
    pauseOverlay.style.position = 'fixed';
    pauseOverlay.style.top = 0;
    pauseOverlay.style.left = 0;
    pauseOverlay.style.width = '100%';
    pauseOverlay.style.height = '100%';
    pauseOverlay.style.backgroundImage = 'url(groupB.png)';
    pauseOverlay.style.backgroundPosition = 'center';
    pauseOverlay.style.backgroundRepeat = 'no-repeat';
    pauseOverlay.style.backgroundSize = 'contain'; // key change: ensures full image fits
    pauseOverlay.style.backgroundColor = 'black'; // optional: black background behind image

    pauseOverlay.style.display = 'none';
    pauseOverlay.style.zIndex = 9999;
    document.body.appendChild(pauseOverlay);

    // 🔹 Step 3: Add click event to unpause and resume timer
    pauseOverlay.addEventListener('click', () => {
      pauseOverlay.style.display = 'none';
      isPaused = false;
      startScoreTimer();
    });
  });


  function initializeGame() {
    const body = document.body;
    const start = Number(body.dataset.start);
    const end = Number(body.dataset.end);

    const sets = [];
    for (let i = start; i <= end; i++) {
      const num = String(i).padStart(2, '0');
      const setId = `set${num}`;
      sets.push({
        id: setId,
        images: [
          { src: `flip/flipd${num}.svg`, set: setId },
          { src: `flip/flipf${num}.svg`, set: setId },
          { src: `flip/flipp${num}.svg`, set: setId }
        ]
      });
    }

    let allImages = sets.flatMap(set => set.images);
    allImages = allImages.sort(() => Math.random() - 0.5);

    const grid = document.getElementById('grid');
    grid.innerHTML = '';

    allImages.forEach(({ src, set }) => {
      const card = document.createElement('div');
      card.className = 'card';
      card.dataset.set = set;

      const img = document.createElement('img');
      img.className = 'card-face';
      img.src = src;
      img.alt = 'Card';
      img.dataset.set = set;

      if (src.includes('flipf')) img.dataset.type = 'fraction';
      else if (src.includes('flipp')) img.dataset.type = 'percent';
      else if (src.includes('flipd')) img.dataset.type = 'decimal';

      const back = document.createElement('img');
      back.className = 'card-back';
      back.src = 'cardback.png';
      back.alt = 'Card Back';

      card.appendChild(img);
      card.appendChild(back);

      // Prevent double click or drag selection
      card.addEventListener('mousedown', e => e.preventDefault());
    card.addEventListener('click', () => {
      // Prevent interaction if game hasn't started or card is locked
      if (!gameStarted || card.classList.contains('locked')) return;

      if (card.classList.contains('covered')) {
        // Don't count locked cards toward the 3 visible limit
        const visible = document.querySelectorAll('.card:not(.covered):not(.locked)');
        if (visible.length < 3) {
          card.classList.remove('covered');
        }
      } else {
        card.classList.add('covered');
      }
    });

      grid.appendChild(card);
    });
  }

  function getVisibleCards() {
    return Array.from(document.querySelectorAll('.card:not(.covered)'));
  }

  function checkVisibleCards() {
    const visibleCards = getVisibleCards();

    if (visibleCards.length === 3) {
      const sets = visibleCards.map(card => card.dataset.set);
      const uniqueSets = [...new Set(sets)];

      if (uniqueSets.length === 1) return { set: true, pair: false };
      if (uniqueSets.length === 2) return { set: false, pair: true };
      return { set: false, pair: false };
    } 
    
    if (visibleCards.length === 2) {
      const [firstSet, secondSet] = visibleCards.map(card => card.dataset.set);
      return { set: false, pair: firstSet === secondSet };
    }

    // Not enough cards visible for pair or set
    return { set: false, pair: false };
  }

  // PAIR button logic
  document.getElementById('pair').addEventListener('click', () => {
    const visibleCards = getVisibleCards();

    // Must have at least 2 cards visible
    if (visibleCards.length < 2) return;

    const result = checkVisibleCards();

    if (result.set || result.pair) {
      // ✅ Correct: play success, award 23 points
      dingSound.play();
      score += 19;
      updateScoreDisplay();

      if (result.set) {
        // --- If it's actually a full set, cover all 3 ---
        visibleCards.forEach(card => {
          card.classList.add('locked', 'covered');
          const back = card.querySelector('.card-back');
          const face = card.querySelector('.card-face');
          if (face) face.style.display = 'none';
          if (back) {
            back.src = 'empty.png';
            back.style.display = 'block';
          }
        });

      } else {
        // --- It's a pair: cover those two, then find & cover the 3rd ---
        // Group by set
        const groups = {};
        visibleCards.forEach(card => {
          groups[card.dataset.set] = groups[card.dataset.set] || [];
          groups[card.dataset.set].push(card);
        });
        const pairSetId = Object.keys(groups).find(id => groups[id].length === 2);
        const pairCards = groups[pairSetId];

        // Cover the two visible pair cards
        pairCards.forEach(card => {
          card.classList.add('locked', 'covered');
          const back = card.querySelector('.card-back');
          const face = card.querySelector('.card-face');
          if (face) face.style.display = 'none';
          if (back) {
            back.src = 'empty.png';
            back.style.display = 'block';
          }
        });

        // Find and cover the third card of that set
        const allCards = Array.from(document.querySelectorAll('.card'));
        const third = allCards.find(c => c.dataset.set === pairSetId && !visibleCards.includes(c));
        if (third) {
          third.classList.add('locked', 'covered');
          const back = third.querySelector('.card-back');
          const face = third.querySelector('.card-face');
          if (face) face.style.display = 'none';
          if (back) {
            back.src = 'empty.png';
            back.style.display = 'block';
          }
        }
      }

      // --- Check for end‑of‑game ---
      if (!remainingSetsExist()) {
        clearInterval(scoreTimer);
        const cheer = document.getElementById('cheer-sound');
        cheer.play();
        const fs = document.getElementById('final-screen');
        const fm = document.getElementById('final-message');
        fm.textContent = `NICE! Your score is ${Math.round(score)}!`;
        fs.style.display = 'flex';
        fs.addEventListener('click', () => window.location.href = 'index.html');
      }

    } else {
      // ❌ Incorrect: play fail sound, deduct 7 points
      failSound.play();
      score -= 7;
      updateScoreDisplay();
    }
  });



  // SET button logic
  document.getElementById('set').addEventListener('click', () => {
    const visibleCards = getVisibleCards();

    // Must have exactly 3 cards visible
    if (visibleCards.length !== 3) return;

    const result = checkVisibleCards();

    if (result.set) {
      // ✅ Correct set: play success, award 33 points
      dingSound.play();
      score += 31;
      updateScoreDisplay();

      // Cover and lock all 3 cards
      visibleCards.forEach(card => {
        card.classList.add('locked', 'covered');
        const back = card.querySelector('.card-back');
        const face = card.querySelector('.card-face');
        if (face) face.style.display = 'none';
        if (back) {
          back.src = 'empty.png';
          back.style.display = 'block';
        }
      });

      // --- Check for end‑of‑game ---
      if (!remainingSetsExist()) {
        clearInterval(scoreTimer);
        const cheer = document.getElementById('cheer-sound');
        cheer.play();
        const fs = document.getElementById('final-screen');
        const fm = document.getElementById('final-message');
        fm.textContent = `NICE! Your score is ${Math.round(score)}!`;
        fs.style.display = 'flex';
        fs.addEventListener('click', () => window.location.href = 'index.html');
      }

    } else {
      // ❌ Incorrect: play fail sound, deduct 7 points
      failSound.play();
      score -= 7;
      updateScoreDisplay();
    }
  });

});
