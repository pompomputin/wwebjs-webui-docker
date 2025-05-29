const bcrypt = require('bcryptjs');
const passwordToHash = 'hashpassword'; // Change this to your desired password
const saltRounds = 10;
const hashedPassword = bcrypt.hashSync(passwordToHash, saltRounds);
console.log(`Username: username`); // Replace yourNewUsername
console.log(`Password: ${passwordToHash}`);
console.log(`Hashed Password: ${hashedPassword}`);
