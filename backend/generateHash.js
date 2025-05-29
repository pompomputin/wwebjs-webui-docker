const bcrypt = require('bcryptjs');
const passwordToHash = 'wkwkland123'; // Change this to your desired password
const saltRounds = 10;
const hashedPassword = bcrypt.hashSync(passwordToHash, saltRounds);
console.log(`Username: maw`); // Replace yourNewUsername
console.log(`Password: ${passwordToHash}`);
console.log(`Hashed Password: ${hashedPassword}`);
