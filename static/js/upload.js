document.getElementById('uploadForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  });
  const data = await res.json();
  document.getElementById('result').textContent = JSON.stringify(data, null, 2);
});

document.getElementById('addForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const title = document.getElementById('title').value.trim();
  const genre = document.getElementById('genre').value;
  const adminPass = document.getElementById('addPass').value.trim();

  if (!title || !genre || !adminPass) {
    return alert("曲名・ジャンル・パスワードを入力してください");
  }

  const difficultyFields = ['easy', 'normal', 'hard', 'oni', 'edit'];
  const difficulties = {};

  difficultyFields.forEach((key) => {
    const val = document.getElementById(key).value;
    if (val === '') {
      difficulties[key] = null;
    } else {
      const parsed = parseInt(val);
      difficulties[key] = isNaN(parsed) ? null : parsed;
    }
  });

  const songData = { title, genre, difficulties, adminPass };

  const res = await fetch('/api/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(songData)
  });

  const data = await res.json();

  const resultEl = document.getElementById('result');
  if (data.error) {
    resultEl.innerHTML = `<span style="color: red; font-weight: bold;">エラー: ${data.error}</span>`;
  } else {
    resultEl.innerHTML = `
      <div class="result-message">
        <div><strong>${data.status}</strong></div>
        <div>・${data.title}</div>
      </div>
    `;
  }
});