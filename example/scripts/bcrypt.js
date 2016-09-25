var bcrypt = require('bcrypt');

const defaultSaltRounds = 10;
// Get input from argv
var pw = process.argv[2];
if (!pw)
	return console.error('Missing password parameter');
var rounds = process.argv[3];
if (!rounds || isNaN(rounds))
	rounds = defaultSaltRounds;
else
	rounds = +rounds;
// Perform hash & report
console.time('bcrypt');
var hash = bcrypt.hashSync(pw, rounds);
console.timeEnd('bcrypt');
console.log(hash);