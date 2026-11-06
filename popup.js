const DEFAULT_DETAILS = [
  { key: 'Email address', value: '' },
  { key: 'Phone number', value: '' },
  { key: 'LinkedIn URL', value: '' },
  { key: 'Portfolio URL', value: '' },
  { key: 'Current location', value: '' },
  { key: 'Years of experience', value: '' }
];

const list = document.querySelector('#details-list');
const search = document.querySelector('#search');
const countPill = document.querySelector('#count-pill');
const resultLabel = document.querySelector('#result-label');
const emptyState = document.querySelector('#empty-state');
const emptyTitle = document.querySelector('#empty-title');
const emptyCopy = document.querySelector('#empty-copy');
const dialog = document.querySelector('#detail-dialog');
const form = document.querySelector('#detail-form');
const keyInput = document.querySelector('#key-input');
const valueInput = document.querySelector('#value-input');
const formError = document.querySelector('#form-error');
const toast = document.querySelector('#toast');
const deleteButton = document.querySelector('#delete-button');

let details = [];
let editingId = null;
let toastTimer;

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));

function makeId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function loadDetails() {
  const saved = await chrome.storage.local.get('quickInfoDetails');
  if (Array.isArray(saved.quickInfoDetails)) {
    details = saved.quickInfoDetails.filter((item) => item && typeof item.key === 'string')
      .map((item) => ({ id: item.id || makeId(), key: item.key.trim(), value: String(item.value ?? '') }))
      .filter((item) => item.key);
  } else {
    details = DEFAULT_DETAILS.map((item) => ({ ...item, id: makeId() }));
    await persist();
  }
  render();
}

async function persist() {
  await chrome.storage.local.set({ quickInfoDetails: details });
}

function render() {
  const query = search.value.trim().toLocaleLowerCase();
  const shown = details.filter((item) => `${item.key} ${item.value}`.toLocaleLowerCase().includes(query));
  countPill.textContent = String(details.length);
  resultLabel.textContent = query ? `${shown.length} of ${details.length}` : '';
  list.innerHTML = '';
  const noEntries = details.length === 0;
  const noMatches = details.length > 0 && shown.length === 0;
  emptyState.hidden = !(noEntries || noMatches);
  list.hidden = noEntries || noMatches;
  if (noMatches) {
    emptyTitle.textContent = 'No matching details';
    emptyCopy.textContent = 'Try another search, or add a new detail.';
    document.querySelector('#empty-add').hidden = true;
  } else {
    emptyTitle.textContent = 'Nothing here yet';
    emptyCopy.textContent = 'Add the details you use most in job applications. They stay saved on this device.';
    document.querySelector('#empty-add').hidden = false;
  }

  for (const item of shown) {
    const card = document.createElement('article');
    card.className = 'detail-card';
    card.setAttribute('role', 'listitem');
    const preview = item.value.trim() ? escapeHtml(item.value.trim().replace(/\s+/g, ' ')) : 'Add your answer';
    card.innerHTML = `
      <div class="detail-main" tabindex="0" role="button" aria-label="Edit ${escapeHtml(item.key)}">
        <span class="detail-key">${escapeHtml(item.key)}</span>
        <span class="detail-preview ${item.value.trim() ? '' : 'is-empty'}">${preview}</span>
      </div>
      <div class="row-actions">
        <button class="copy-button" type="button" ${item.value.length ? '' : 'disabled'} aria-label="Copy ${escapeHtml(item.key)}">
          <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="5.5" y="5.5" width="8" height="9" rx="1.5"/><path d="M10.5 3.5v-1A1.5 1.5 0 0 0 9 1H2.5A1.5 1.5 0 0 0 1 2.5V10A1.5 1.5 0 0 0 2.5 11.5h1"/></svg>
          <span>Copy</span>
        </button>
        <button class="icon-button edit-button" type="button" aria-label="Edit ${escapeHtml(item.key)}" title="Edit">···</button>
      </div>`;
    const edit = () => openEditor(item.id);
    card.querySelector('.detail-main').addEventListener('click', edit);
    card.querySelector('.detail-main').addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); edit(); }
    });
    card.querySelector('.edit-button').addEventListener('click', edit);
    card.querySelector('.copy-button').addEventListener('click', () => copyValue(item));
    list.append(card);
  }
}

function openEditor(id = null) {
  editingId = id;
  const item = details.find((entry) => entry.id === id);
  document.querySelector('#dialog-eyebrow').textContent = item ? 'EDIT DETAIL' : 'NEW DETAIL';
  document.querySelector('#dialog-title').textContent = item ? 'Edit detail' : 'Add a detail';
  document.querySelector('.save-button').textContent = item ? 'Save changes' : 'Save detail';
  deleteButton.hidden = !item;
  keyInput.value = item?.key || '';
  valueInput.value = item?.value || '';
  formError.textContent = '';
  dialog.showModal();
  requestAnimationFrame(() => keyInput.focus());
}

async function copyValue(item) {
  try {
    await navigator.clipboard.writeText(item.value);
    showToast(`${item.key} copied`);
  } catch {
    const temporary = document.createElement('textarea');
    temporary.value = item.value;
    temporary.style.position = 'fixed';
    temporary.style.opacity = '0';
    document.body.append(temporary);
    temporary.select();
    const copied = document.execCommand('copy');
    temporary.remove();
    showToast(copied ? `${item.key} copied` : 'Could not copy. Please try again.');
  }
}

function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('is-visible');
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 1700);
}

document.querySelector('#add-button').addEventListener('click', () => openEditor());
document.querySelector('#empty-add').addEventListener('click', () => openEditor());
document.querySelector('#close-dialog').addEventListener('click', () => dialog.close());
document.querySelector('#cancel-dialog').addEventListener('click', () => dialog.close());
search.addEventListener('input', render);

document.addEventListener('keydown', (event) => {
  if (event.key === '/' && !dialog.open && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
    event.preventDefault();
    search.focus();
  }
  if (event.key === 'Escape' && dialog.open) dialog.close();
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const key = keyInput.value.trim();
  const value = valueInput.value;
  if (!key) {
    formError.textContent = 'Please enter a label.';
    keyInput.focus();
    return;
  }
  const duplicate = details.find((item) => item.key.toLocaleLowerCase() === key.toLocaleLowerCase() && item.id !== editingId);
  if (duplicate) {
    formError.textContent = 'That label already exists. Choose a unique label.';
    keyInput.focus();
    return;
  }
  if (editingId) {
    details = details.map((item) => item.id === editingId ? { ...item, key, value } : item);
  } else {
    details.unshift({ id: makeId(), key, value });
  }
  await persist();
  dialog.close();
  render();
  showToast(editingId ? 'Changes saved' : 'Detail added');
});

deleteButton.addEventListener('click', async () => {
  if (!editingId) return;
  details = details.filter((item) => item.id !== editingId);
  await persist();
  dialog.close();
  render();
  showToast('Detail deleted');
});

loadDetails();
