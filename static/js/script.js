Promise.all([
  document.fonts.ready,
  new Promise(resolve => setTimeout(resolve, 2000))
]).then(() => {
  const loading = document.getElementById('loading-screen');
  if (loading) {
    loading.classList.add('hide');
    setTimeout(() => loading.remove(), 500);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  if (isIOS) {
    document.body.classList.add("ios");
  }
});

const options = {
  genre: [],
  difficulty: [],
  count: Array.from({ length: 10 }, (_, i) => ({ label: `${i + 1}`, value: `${i + 1}` })),
  stars: []
};

const selectorState = {};
let genreList = [], difficultyList = [];
let genreMap = {}, difficultyMap = {};

const fetchJSON = (url) => fetch(url).then(res => res.json());

Promise.all([
  fetchJSON('/genre-config/genre.json'),
  fetchJSON('/genre-config/difficulty.json')
]).then(([genreData, difficultyData]) => {
  genreList = genreData;
  difficultyList = difficultyData;

  genreMap = Object.fromEntries(genreList.map(g => [g.key, g]));
  difficultyMap = Object.fromEntries(difficultyList.map(d => [d.key, d]));

  options.genre = [{ label: '全ジャンル', value: '' }, ...genreList.map(g => ({ label: g.label, value: g.key }))];
  options.difficulty = difficultyList.map(d => ({ label: d.label, value: d.key }));

  updateStarsOptions(options.difficulty[0].value);
  initializeSelectors();
});

function initializeSelectors() {
  document.querySelectorAll('.selector').forEach(selector => {
    const name = selector.dataset.name;
    const valueElem = selector.querySelector('.value');

    if (!options[name] || options[name].length === 0) {
      valueElem.textContent = '読み込み中...';
      return;
    }

    let index = getInitialIndex(name);

    const updateDisplay = () => {
      if (!options[name][index]) index = 0;

      valueElem.textContent = options[name][index].label;
      selectorState[name] = index;

      if (name === 'difficulty') {
        updateStarsOptions(options.difficulty[index].value);
      }
    };

    selector.querySelector('.left').onclick = (e) => {
      index = (index - 1 + options[name].length) % options[name].length;
      updateDisplay();
      buttonEffect(e.currentTarget);
    };

    selector.querySelector('.right').onclick = (e) => {
      index = (index + 1) % options[name].length;
      updateDisplay();
      buttonEffect(e.currentTarget);
    };

    updateDisplay();
  });
}

function updateStarsOptions(difficultyValue) {
  let maxStars;

  if (difficultyValue === 'oni-edit') {
    maxStars = 10;
  } else {
    const difficulty = difficultyMap[difficultyValue];
    maxStars = difficulty?.maxStars ?? 10;
  }

  options.stars = [{ label: 'ランダム', value: '' }].concat(
    Array.from({ length: maxStars }, (_, i) => ({ label: `${i + 1}`, value: `${i + 1}` }))
  );

  const starsSelector = document.querySelector('.selector[data-name="stars"]');
  if (!starsSelector) return;

  const valueElem = starsSelector.querySelector('.value');
  let index = Math.min(selectorState.stars || 0, options.stars.length - 1);

  valueElem.textContent = options.stars[index].label;
  selectorState.stars = index;
}

function getInitialIndex(name) {
  if (name === 'difficulty') return 0;
  if (name === 'stars') return 10;
  return 0;
}

function buttonEffect(button) {
  button.classList.add('active');
  setTimeout(() => button.classList.remove('active'), 200);
}

document.getElementById('submitButton').addEventListener('click', async () => {
  createStatusBox();

  const wait2sec = new Promise(resolve => setTimeout(resolve, 2000));
  const selected = getSelectedOptions();
  const excludeSouuchi = document.getElementById('excludeSouuchi').checked;

  const params = new URLSearchParams(Object.entries(selected).filter(([_, v]) => v));
  if (excludeSouuchi) params.append('excludeSouuchi', 'true');

  const [res] = await Promise.all([
    fetch(`/api/random-taiko?${params.toString()}`),
    wait2sec
  ]);

  const data = await res.json();
  removeStatusBox();
  renderSongs(data, selected);
});

function getSelectedOptions() {
  const selected = {};
  for (const name in selectorState) {
    const index = selectorState[name];
    selected[name] = options[name][index].value;
  }
  return selected;
}

function removeStatusBox() {
  document.getElementById('status-box')?.remove();
  document.getElementById('overlay-blocker')?.remove();
}

function renderSongs(data, selected) {
  const result = document.getElementById('result');
  result.innerHTML = '';

  if (!Array.isArray(data)) {
    result.textContent = data.error || 'エラーが発生しました';
    return;
  }

  data.forEach(song => {
    const { genre, difficulties } = song;
    const genreInfo = genreMap[genre] || { color: '#ccc' };
    const color = genreInfo.color;

    const { level, used } = resolveDifficulty(selected.difficulty, selected.stars, difficulties);

    const card = document.createElement('div');
    card.className = 'song-card';
    card.style.setProperty('--genre-color', color);
    card.style.setProperty('--genre-color-light', lightenColor(color, 0.2));
    card.style.setProperty('--genre-color-dark', darkenColor(color, 0.2));

    card.innerHTML = `
      <div class="song-title-text">${escapeXml(song.title)}</div>
      <div class="song-difficulty-badge" style="background-image: url('/static/assets/img/difficulty-${used}.png');">
        <span>★${level ?? '-'}</span>
      </div>
    `;

    result.appendChild(card);
  });

  const firstCard = document.querySelector('.song-card');
  if (firstCard) smoothScrollTo(firstCard, 1500);
}

function resolveDifficulty(selectedDifficulty, selectedStars, difficulties) {
  if (selectedDifficulty === 'oni-edit') {
    const oniStars = difficulties.oni;
    const editStars = difficulties.edit;

    if (!selectedStars) {
      if (oniStars != null && editStars != null) {
        const used = Math.random() < 0.5 ? 'oni' : 'edit';
        return { used, level: difficulties[used] };
      } else if (oniStars != null) {
        return { used: 'oni', level: oniStars };
      } else if (editStars != null) {
        return { used: 'edit', level: editStars };
      } else {
        return { used: '-', level: '-' };
      }
    }

    const starNum = parseInt(selectedStars);

    const oniMatch = oniStars === starNum;
    const editMatch = editStars === starNum;

    if (oniMatch && editMatch) {
      const used = Math.random() < 0.5 ? 'oni' : 'edit';
      return { used, level: difficulties[used] };
    } else if (oniMatch) {
      return { used: 'oni', level: oniStars };
    } else if (editMatch) {
      return { used: 'edit', level: editStars };
    } else {
      return { used: '-', level: '-' };
    }
  }

  const level = difficulties[selectedDifficulty] ?? '-';
  return { used: selectedDifficulty, level };
}

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
    if (progress < 1) requestAnimationFrame(animateScroll);
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