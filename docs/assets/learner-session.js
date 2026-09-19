const PROFILE_KEY = 'englishai-learner-profile-v2';

function readSavedProfile() {
  try {
    const value = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null');
    return value && typeof value.name === 'string' && typeof value.skill === 'string' ? value : null;
  } catch {
    return null;
  }
}

function fillProfileForm(profile) {
  const form = document.getElementById('profileForm');
  if (!form) return false;
  for (const [name, value] of Object.entries({
    name: profile.name,
    language: profile.language || '',
    level: profile.level || 'B1',
    skill: profile.skill,
    goal: profile.goal || ''
  })) {
    const field = form.elements.namedItem(name);
    if (field) field.value = value;
  }
  return true;
}

function addResumeAction(profile) {
  const profilePanel = document.getElementById('profile');
  const form = document.getElementById('profileForm');
  if (!profilePanel || !form || document.getElementById('resumeSession')) return;

  const row = document.createElement('div');
  row.id = 'resumeSession';
  row.className = 'feedback';
  row.setAttribute('role', 'status');
  row.setAttribute('aria-live', 'polite');
  row.innerHTML = `Saved learner state found for <strong>${profile.name.replace(/[&<>"']/g, '')}</strong> · ${profile.skill}.`;

  const actions = document.createElement('div');
  actions.className = 'actions';
  const resume = document.createElement('button');
  resume.type = 'button';
  resume.className = 'btn';
  resume.textContent = 'Resume saved session';
  resume.addEventListener('click', () => {
    if (!fillProfileForm(profile)) return;
    form.requestSubmit();
  });
  const clear = document.createElement('button');
  clear.type = 'button';
  clear.className = 'btn';
  clear.textContent = 'Clear saved state';
  clear.addEventListener('click', () => {
    localStorage.removeItem(PROFILE_KEY);
    row.remove();
    actions.remove();
  });
  actions.append(resume, clear);
  profilePanel.insertBefore(row, form);
  profilePanel.insertBefore(actions, form);
}

document.addEventListener('DOMContentLoaded', () => {
  const profile = readSavedProfile();
  if (profile && document.getElementById('profile')) addResumeAction(profile);
});
