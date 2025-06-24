const fontReady = document.fonts.ready;
const delay = new Promise(resolve => setTimeout(resolve, 2000));

Promise.all([fontReady, delay]).then(() => {
  const loading = document.getElementById('loading-screen');
  if (loading) {
    loading.classList.add('hide');
    setTimeout(() => loading.remove(), 500);
  }
});

document.addEventListener("DOMContentLoaded", function () {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  if (isIOS) {
    document.body.classList.add("ios");
  }
});

const options = {
  genre: [],
  difficulty: [],
  count: Array.from({ length: 10 }, (_, i) => ({ label: `${i + 1}`, value: `${i + 1}` })),
  stars: Array.from({ length: 10 }, (_, i) => ({ label: `${i + 1}`, value: `${i + 1}` }))
};

const selectorState = {};
let genreList = [];
let difficultyList = [];
let genreMap = {};
let difficultyMap = {};

Promise.all([
  fetch('/genre-config/genre.json').then(res => res.json()),
  fetch('/genre-config/difficulty.json').then(res => res.json())
]).then(([genreData, difficultyData]) => {
  genreList = genreData;
  difficultyList = difficultyData;
  genreMap = Object.fromEntries(genreList.map(g => [g.key, g]));
  difficultyMap = Object.fromEntries(difficultyList.map(d => [d.key, d.label]));

  options.genre = [{ label: '全ジャンル', value: '' }]
    .concat(genreList.map(g => ({ label: g.label, value: g.key })));

  options.difficulty = difficultyData.map(d => ({ label: d.label, value: d.key }));

  initializeSelectors();
});

function initializeSelectors() {
  document.querySelectorAll('.selector').forEach(selector => {
    const name = selector.dataset.name;
    const valueElem = selector.querySelector('.value');
    let index = 0;

    const updateDisplay = () => {
      valueElem.textContent = options[name][index].label;
      selectorState[name] = index;
    };

    selector.querySelector('.left').addEventListener('click', (e) => {
      index = (index - 1 + options[name].length) % options[name].length;
      updateDisplay();
      buttonEffect(e.currentTarget);
    });

    selector.querySelector('.right').addEventListener('click', (e) => {
      index = (index + 1) % options[name].length;
      updateDisplay();
      buttonEffect(e.currentTarget);
    });

    updateDisplay();
  });
}

function buttonEffect(button) {
  button.classList.add('active');
  setTimeout(() => button.classList.remove('active'), 200);
}

document.getElementById('submitButton').addEventListener('click', async () => {
  createStatusBox();

  const wait2sec = new Promise(resolve => setTimeout(resolve, 2000));
  const result = document.getElementById('result');

  const selected = {};
  Object.keys(selectorState).forEach(name => {
    const index = selectorState[name];
    selected[name] = options[name][index].value;
  });

  const selectedDifficulty = selected.difficulty;
  const selectedStars = parseInt(selected.stars);

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(selected)) {
    if (value) params.append(key, value);
  }

  const [res] = await Promise.all([
    fetch(`/api/random-taiko?${params.toString()}`),
    wait2sec
  ]);
  const data = await res.json();

  const box = document.getElementById('status-box');
  const blocker = document.getElementById('overlay-blocker');
  if (box) box.remove();
  if (blocker) blocker.remove();

  result.innerHTML = '';
  if (Array.isArray(data)) {
    data.forEach(song => {
      const genre = genreMap[song.genre] || { color: '#cccccc' };
      const genreColor = genre.color;
      const genreLight = lightenColor(genreColor, 0.2);
      const genreDark = darkenColor(genreColor, 0.2);

      let difficultyUsed = selectedDifficulty;
      let level = '-';

      if (selectedDifficulty === 'oni-edit') {
        if (song.difficulties.oni === selectedStars) {
          difficultyUsed = 'oni';
          level = song.difficulties.oni;
        } else if (song.difficulties.edit === selectedStars) {
          difficultyUsed = 'edit';
          level = song.difficulties.edit;
        }
      } else {
        level = song.difficulties[selectedDifficulty] ?? '-';
      }

      const div = document.createElement('div');
      div.className = 'song-card';
      div.style.setProperty('--genre-color', genreColor);
      div.style.setProperty('--genre-color-light', genreLight);
      div.style.setProperty('--genre-color-dark', genreDark);

      div.innerHTML = `
        <div class="song-title-text">${escapeXml(song.title)}</div>
        <div class="song-difficulty-badge" style="background-image: url('/static/assets/img/difficulty-${difficultyUsed}.png');">
          <span>★${level}</span>
        </div>
      `;
      result.appendChild(div);
    });
  } else {
    result.textContent = data.error || 'エラーが発生しました。';
  }

  const firstCard = document.querySelector('.song-card');
  if (firstCard) {
    smoothScrollTo(firstCard, 1500);
  }
});

function lightenColor(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent * 100);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return '#' + (
    0x1000000 +
    (Math.min(255, R) << 16) +
    (Math.min(255, G) << 8) +
    Math.min(255, B)
  ).toString(16).slice(1);
}

function darkenColor(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent * 100);
  const R = (num >> 16) - amt;
  const G = ((num >> 8) & 0x00FF) - amt;
  const B = (num & 0x0000FF) - amt;
  return '#' + (
    0x1000000 +
    (Math.max(0, R) << 16) +
    (Math.max(0, G) << 8) +
    Math.max(0, B)
  ).toString(16).slice(1);
}

function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, c => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    '"': '&quot;',
    "'": '&#039;'
  }[c]));
}

function smoothScrollTo(element, duration = 1000) {
  const targetY = element.getBoundingClientRect().top + window.scrollY;
  const startY = window.scrollY;
  const diff = targetY - startY;
  let startTime = null;

  function animateScroll(currentTime) {
    if (!startTime) startTime = currentTime;
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    window.scrollTo(0, startY + diff * ease);
    if (progress < 1) {
      requestAnimationFrame(animateScroll);
    }
  }

  requestAnimationFrame(animateScroll);
}

function createStatusBox() {
  const blocker = document.createElement('div');
  blocker.id = 'overlay-blocker';
  blocker.className = 'overlay-blocker show';

  const box = document.createElement('div');
  box.id = 'status-box';
  box.className = 'status-box show';
  box.innerHTML = `
    <img src="/static/assets/img/favicon.png" class="loading-icon" />
    <span class="status-text">〜選曲中〜</span>
  `;

  document.body.appendChild(blocker);
  document.body.appendChild(box);
}