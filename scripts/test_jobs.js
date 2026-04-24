const jwt = require('jsonwebtoken');

const token = jwt.sign(
    {
        userId: '+40731156333',
        installerId: 7,
        isCompleted: true,
        role: 'admin',
        teamMemberId: 2,
        ownPhone: '+40766676132'
    },
    'fallback-secret-for-jwt-keep-safe-in-prod',
    { expiresIn: '30d' }
);

fetch('http://localhost:3010/api/mobile/jobs', {
    headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(console.log)
.catch(console.error);

fetch(`http://localhost:3010/api/dispatch/orders?role=admin&region=Bucuresti`, {
    headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(data => console.log('Available Jobs length:', data.orders ? data.orders.length : 0))
.catch(console.error);
