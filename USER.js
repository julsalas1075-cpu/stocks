// USER.js — Auth + Request UI (Firebase compat)
const auth = firebase.auth();
const db = firebase.database();

// DOM
const signedOutPanel = document.getElementById('signedOutPanel');
const signedInPanel = document.getElementById('signedInPanel');
const authControls = document.getElementById('authControls');
const showLogin = document.getElementById('showLogin');
const authModal = document.getElementById('authModal');
const authTitle = document.getElementById('authTitle');
const authSubmit = document.getElementById('authSubmit');
const authCancel = document.getElementById('authCancel');
const authToggle = document.getElementById('authToggle');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const userEmailSpan = document.getElementById('userEmail');
const signOutBtn = document.getElementById('signOutBtn');

const submitReqBtn = document.getElementById('submitReq');
const reqName = document.getElementById('reqName');
const reqQty = document.getElementById('reqQty');
const reqCategory = document.getElementById('reqCategory');
const reqNote = document.getElementById('reqNote');
const userBody = document.getElementById('userBody');

const invBody = document.getElementById('invBody');

let authMode = 'login'; // or 'register'

// Show modal
showLogin.addEventListener('click', () => {
  authMode = 'login';
  authTitle.innerText = 'Sign in';
  authToggle.innerText = 'Switch to Register';
  authModal.classList.remove('hidden');
});

// modal cancel
authCancel.addEventListener('click', () => authModal.classList.add('hidden'));

// toggle between login/register
authToggle.addEventListener('click', () => {
  if (authMode === 'login') {
    authMode = 'register';
    authTitle.innerText = 'Register';
    authToggle.innerText = 'Switch to Sign in';
  } else {
    authMode = 'login';
    authTitle.innerText = 'Sign in';
    authToggle.innerText = 'Switch to Register';
  }
});

// submit auth
authSubmit.addEventListener('click', () => {
  const email = emailInput.value.trim();
  const pw = passwordInput.value;
  if (!email || !pw) return alert('Enter email and password');

  if (authMode === 'login') {
    auth.signInWithEmailAndPassword(email, pw)
      .then(() => { authModal.classList.add('hidden'); emailInput.value = ''; passwordInput.value = ''; })
      .catch(e => alert('Sign-in error: ' + e.message));
  } else {
    auth.createUserWithEmailAndPassword(email, pw)
      .then(() => { authModal.classList.add('hidden'); emailInput.value = ''; passwordInput.value = ''; })
      .catch(e => alert('Register error: ' + e.message));
  }
});

// sign out
signOutBtn.addEventListener('click', () => auth.signOut());

// Auth state listener
auth.onAuthStateChanged(user => {
  if (user) {
    // signed in
    signedOutPanel.classList.add('hidden');
    signedInPanel.classList.remove('hidden');
    userEmailSpan.innerText = user.email;
    showLogin.classList.add('hidden');
    // load user's requests and inventory
    listenUserRequests(user.uid);
    listenInventory();
  } else {
    // signed out
    signedOutPanel.classList.remove('hidden');
    signedInPanel.classList.add('hidden');
    showLogin.classList.remove('hidden');
    userEmailSpan.innerText = '';
    userBody.innerHTML = '';
    invBody.innerHTML = '';
    // remove listeners if needed (we'll rely on firebase to garbage collect)
  }
});

// Submit a request (creates entry under /requests)
submitReqBtn.addEventListener('click', () => {
  const user = auth.currentUser;
  if (!user) return alert('Sign in first');
  const name = reqName.value.trim();
  const qty = Number(reqQty.value) || 0;
  const category = reqCategory.value.trim();
  const note = reqNote.value.trim();
  if (!name || qty <= 0) return alert('Fill name and quantity');

  const payload = {
    name, qty, category, note,
    status: 'Pending',
    uid: user.uid,
    userEmail: user.email,
    ts: Date.now()
  };

  db.ref('requests').push(payload)
    .then(() => {
      reqName.value = '';
      reqQty.value = 1;
      reqCategory.value = '';
      reqNote.value = '';
      alert('Request submitted');
    })
    .catch(e => alert('Error: ' + e.message));
});

// Listen to user's requests only (filtered)
let reqListener = null;
function listenUserRequests(uid) {
  if (reqListener) reqListener.off && reqListener.off();
  const q = db.ref('requests').orderByChild('uid').equalTo(uid);
  reqListener = q;
  q.on('value', snap => {
    const data = snap.val() || {};
    const arr = Object.keys(data).map(k => ({ id: k, ...data[k] })).sort((a,b) => b.ts - a.ts);
    renderUserRequests(arr);
  });
}

function renderUserRequests(arr) {
  userBody.innerHTML = '';
  arr.forEach(r => {
    const tr = document.createElement('tr');
    const when = new Date(r.ts || 0).toLocaleString();
    const status = escapeHtml(r.status || 'Pending');
    tr.innerHTML = `<td>${escapeHtml(r.name)}</td><td>${escapeHtml(r.qty)}</td><td><span class="status ${status}">${status}</span></td><td>${when}</td>`;
    userBody.appendChild(tr)
