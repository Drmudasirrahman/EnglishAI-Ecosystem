import fs from 'node:fs';

const html = fs.readFileSync('docs/learner.html', 'utf8');
const app = fs.readFileSync('docs/assets/learner-app.js', 'utf8');

const requiredHtmlMarkers = [
  ['profile form', 'id="profileForm"'],
  ['quiz form', 'id="quizForm"'],
  ['feedback region', 'id="feedback"'],
  ['result region', 'id="result"'],
  ['question heading', 'id="question"'],
  ['score output', 'id="score"']
];

for (const [label, marker] of requiredHtmlMarkers) {
  if (!html.includes(marker)) throw new Error(`Learner HMI is missing ${label}: ${marker}`);
}

const requiredAppMarkers = [
  ['profile submit handler', "$('profileForm').addEventListener('submit'"],
  ['quiz submit handler', "$('quizForm').addEventListener('submit'"],
  ['question output update', "$('question').textContent"],
  ['feedback output update', "feedback.textContent"],
  ['local learner persistence', 'localStorage.setItem(PROFILE_KEY']
];

for (const [label, marker] of requiredAppMarkers) {
  if (!app.includes(marker)) throw new Error(`Learner app is missing ${label}: ${marker}`);
}

const labelCount = (html.match(/<label\b/g) || []).length;
const namedControlCount = (html.match(/\bname="(name|language|level|skill|goal)"/g) || []).length;
if (labelCount < 5 || namedControlCount < 5) {
  throw new Error('Learner profile form must keep five labelled, named controls.');
}

console.log('Learner HMI accessibility and integration contract passed.');
