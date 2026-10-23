export function setupPasswordReset(db) {
  const $ = id => document.getElementById(id);
  const hash = new URLSearchParams(location.hash.slice(1));
  let active = hash.get('type') === 'recovery';
  let verified = false;
  let sending = false;
  let saving = false;
  const message = text => { $('authMessage').textContent = text; };
  function pane(name) {
    for (const id of ['loginPane', 'registerPane', 'forgotPane', 'resetPane']) $(id).hidden = id !== name;
    document.querySelector('.auth-tabs').hidden = name === 'resetPane';
    $('loginTab').setAttribute('aria-selected', String(name === 'loginPane'));
    $('registerTab').setAttribute('aria-selected', String(name === 'registerPane'));
  }
  function show() {
    $('authPanel').classList.remove('portal-hidden');
    $('portalWorkspace').classList.add('portal-hidden');
    $('signOutBtn').hidden = true;
    pane('resetPane');
    $('resetSubmit').disabled = !verified || saving;
  }
  function forgot() {
    active = false;
    verified = false;
    $('authPanel').classList.remove('portal-hidden');
    $('portalWorkspace').classList.add('portal-hidden');
    pane('forgotPane');
    $('resetEmail').value = $('loginEmail').value.trim();
    message('Enter your account email to receive a password reset link.');
    $('resetEmail').focus();
  }
  $('forgotPassword').onclick = forgot;
  $('requestAnotherReset').onclick = forgot;
  $('backToSignIn').onclick = () => { pane('loginPane'); message('Enter your business email and password.'); $('loginEmail').focus(); };
  $('loginTab').addEventListener('click', () => { if (!active) pane('loginPane'); });
  $('registerTab').addEventListener('click', () => { if (!active) pane('registerPane'); });
  $('forgotPasswordForm').onsubmit = async event => {
    event.preventDefault();
    if (sending || !event.target.reportValidity()) return;
    sending = true;
    const button = $('sendResetLink');
    button.disabled = true;
    message('Sending reset link…');
    try {
      const { error } = await db.auth.resetPasswordForEmail($('resetEmail').value.trim(), { redirectTo: 'https://marinequo.com/passport.html' });
      if (error) {
        message(error.status === 429 ? 'Please wait a few minutes before requesting another link.' : 'We could not send the reset email. Please try again or contact info@kontesmarine.com.');
        return;
      }
      message('If an account exists for that email, you will receive a password reset link. Please check your inbox and spam folder.');
    } catch { message('Connection problem. Please try again.'); }
    finally { sending = false; button.disabled = false; }
  };
  $('resetPasswordForm').onsubmit = async event => {
    event.preventDefault();
    if (saving) return;
    if (!active || !verified) { message('Open a valid password reset link from your email first.'); return; }
    if (!event.target.reportValidity()) return;
    const password = $('newPassword').value;
    if (password.length < 12) { message('Use at least 12 characters.'); return; }
    if (password !== $('confirmPassword').value) { message('The passwords do not match.'); $('confirmPassword').focus(); return; }
    saving = true;
    $('resetSubmit').disabled = true;
    message('Updating your password…');
    try {
      const { error } = await db.auth.updateUser({ password });
      if (error) { message(error.message || 'Unable to update your password. Request a new reset link and try again.'); return; }
      event.target.reset();
      active = false;
      verified = false;
      history.replaceState(null, '', location.pathname);
      const { error: signOutError } = await db.auth.signOut({ scope: 'local' });
      if (signOutError) {
        message('Password updated. Please use Sign out before signing in again.');
        $('signOutBtn').hidden = false;
      } else {
        pane('loginPane');
        $('authPanel').classList.remove('portal-hidden');
        $('portalWorkspace').classList.add('portal-hidden');
        message('Password updated successfully. Sign in with your new password.');
        $('loginEmail').focus();
      }
    } catch { message('Connection problem. Please try again.'); }
    finally { saving = false; $('resetSubmit').disabled = !verified; }
  };
  db.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY' && session) {
      active = true;
      verified = true;
      show();
      message('Choose a new password with at least 12 characters.');
      $('newPassword').focus();
    } else if (event === 'SIGNED_OUT' && active) {
      verified = false;
      show();
      message('Your reset session has expired. Request a new link.');
    }
  });
  if (active) { show(); message('Verifying your reset link…'); }
  else if (hash.has('error')) {
    forgot();
    message('This email link is invalid or has expired. Request a new reset link.');
    history.replaceState(null, '', location.pathname);
  }
  return {
    isActive: () => active,
    show,
    settle: () => { if (active && !verified) { show(); message('This reset link is invalid or has expired. Request a new link.'); } }
  };
}
