document.getElementById('settingsForm').addEventListener('submit', function(e) {
  e.preventDefault();

  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  if (name == '') {
    alert('Name is required');
    return;
  }

  if (!email.includes('@')) {
    alert('Email is invalid');
    return;
  }

  if (password.length < 8) {
    alert('Password must be at least 8 characters');
    return;
  }

  alert('Settings saved!');
});
