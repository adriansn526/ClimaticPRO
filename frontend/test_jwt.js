const jwt = require('jsonwebtoken');
const token = jwt.sign({ id: 1, role: 'installer' }, 'fallback_secret_for_development_only');
console.log(token);
try {
  console.log(jwt.verify(token, 'fallback_secret_for_development_only'));
} catch (e) { console.error('Error verifying token', e); }
