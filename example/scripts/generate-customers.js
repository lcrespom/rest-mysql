var mysql = require('mysql');
var mysqlConfig = require('./mysql-config.json');
mysqlConfig.port = process.env.MYSQL_PORT || mysqlConfig.port;
var numCustomers = process.argv[2];
if (!numCustomers || isNaN(numCustomers))
	numCustomers = 10;

setupDB(mysqlConfig, dbconn => {
	var i = 0;
	var cb = (err, res) => {
		if (err) throw new Error('DB error: ' + err);
		if (i++ < numCustomers) {
			var cust = randomCustomer();
			console.log(`Adding customer ${i}: ${cust.email}`);
			addCustomer(dbconn, cust, randomAddress(), cb);
		}
		else {
			dbconn.end(_ => {
				console.log('Done');
			});
		}
	};
	cb(false, true);
});

function randomCustomer() {
	var name = randomWord(3, 8);
	var surname = randomWord(4, 10);
	var company = randomWord(5, 10);
	return {
		name: ucfirst(name),
		surname: ucfirst(surname),
		company: ucfirst(company) + ' S.A.',
		mobile: randomPhone('6'),
		phone: randomPhone('9', 0.6),
		email: `${name}.${surname}@${company}.com`,
		member: randomNum(100, 999, 0.3)
	};
}

function randomAddress() {
	return {
		street: `C/ ${ucfirst(randomWord(4, 10))} ${randomNum(1, 200)}`,
		town: ucfirst(randomWord(4, 8, 0.2))
	}
}

//-------------------- Randomization --------------------

var CONSONANTS = 'bcdfgjlmnprstvz';
var VOWELS = 'aeiou';
var NUMBERS = '0123456789';

function ucfirst(str) {
	if (!str) return str;
	return str[0].toUpperCase() + str.substr(1);
}

function randomChar(chars) {
	return chars[Math.floor(Math.random() * chars.length)];
}

function randomWord(minL, maxL, optional = 1) {
	if (Math.random() > optional) return undefined;
	var wlen = minL + Math.floor(Math.random() * (maxL - minL));
	var w = randomChar(CONSONANTS);
	while (w.length < wlen)
		w += randomChar(w.length % 2 ? VOWELS : CONSONANTS);
	return w;
}

function randomPhone(startNum, optional = 1) {
	if (Math.random() > optional) return undefined;
	var p = startNum;
	while (p.length < 11) {
		p += randomChar(NUMBERS);
		if (p.length == 3 || p.length == 7) p += ' ';
	}
	return p;
}

function randomNum(min, max, optional = 1) {
	if (Math.random() > optional) return undefined;
	return min + Math.floor(Math.random() * (max - min));
}


//-------------------- DB access --------------------

function setupDB(config, cb) {
	console.log("DB: creating connection...")
	var dbconn = mysql.createConnection(config);
	dbconn.connect(function(err) {
		if (err) {
			console.error('Error connecting to DB:');
			console.error(err);
			throw new Error('Error connecting to DB');
		}
		else {
			console.log('connected to MYSQL');
			cb(dbconn);
		}
	});
}

function addCustomer(dbconn, customer, address, cb) {
	var sql1 = `INSERT INTO addresses SET ?`;
	dbconn.query(sql1, address, (err, result) => {
		if (err) cb(err, result);
		customer.id_pickup_addr = result.insertId;
		var sql2 = `INSERT INTO customers SET ?`;
		dbconn.query(sql2, customer, cb);
	});
}
