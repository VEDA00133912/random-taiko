document.getElementById('uploadForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  showLoading(true);

  try {
    const res = await fetch('/api/phigros/upload', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    showJsonResult(data);
  } catch (err) {
    showJsonResult({ error: 'アップロードに失敗しました' });
  } finally {
    showLoading(false);
  }
});

/*
document.getElementById('addForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = getValue('name');
  const adminPass = getValue('addPass');

  if (!name || !adminPass) {
    return alert("曲名・パスワードを入力してください");
  }

  const difficulties = getDifficultyValues(['easy', 'normal', 'hard', 'expert', 'master', 'append']);
  const songData = { name, difficulties, adminPass };

  showLoading(true);

  try {
    const res = await fetch('/api/prsk/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(songData)
    });
    const data = await res.json();
    showAddResult(data);
  } catch (err) {
    showAddResult({ error: '登録に失敗しました' });
  } finally {
    showLoading(false);
  }
});
*/
document.getElementById('deleteForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = getValue('deleteName');
  const adminPass = getValue('deletePass');

  if (!name || !adminPass) {
    return alert("曲名・パスワードを入力してください");
  }

  const deleteData = { name, adminPass };

  showLoading(true);

  try {
    const res = await fetch('/api/phigros/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deleteData)
    });
    const data = await res.json();
    showDeleteResult(data);
  } catch (err) {
    showDeleteResult({ error: '削除に失敗しました' });
  } finally {
    showLoading(false);
  }
});

function getValue(id) {
  return document.getElementById(id).value.trim();
}

function getDifficultyValues(keys) {
  const result = {};
  keys.forEach(key => {
    const val = getValue(key);
    result[key] = val === '' ? null : (isNaN(val) ? null : parseInt(val));
  });
  return result;
}

function showLoading(show = true) {
  const el = document.getElementById('loading-indicator');
  if (el) el.style.display = show ? 'block' : 'none';
}

function showJsonResult(data) {
  const resultEl = document.getElementById('result');
  resultEl.textContent = JSON.stringify(data, null, 2);
}

function showAddResult(data) {
  const resultEl = document.getElementById('result');
  if (data.error) {
    resultEl.innerHTML = `<span style="color: red; font-weight: bold;">エラー: ${data.error}</span>`;
  } else {
    resultEl.innerHTML = `
      <div class="result-message">
        <strong>${data.status}</strong><br />
        ・${data.name}
      </div>
    `;
  }
}

function showDeleteResult(data) {
  const resultEl = document.getElementById('result');
  if (data.error) {
    resultEl.innerHTML = `<span style="color: red; font-weight: bold;">エラー: ${data.error}</span>`;
  } else {
    resultEl.innerHTML = `
      <div class="result-message">
        <strong>${data.status}</strong><br />
        ・${data.name}
      </div>
    `;
  }
}
