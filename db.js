var mysql = require('mysql');


function setup(config) {
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
		}
	});
	return dbconn;
}

function getCrudHandler(conn, tableName) {
	return {
		find: (params, cb) => {
			conn.query('SELECT * FROM ' + tableName, (err, rows, fields) => {
				//TODO errors should be passed to callback
				if (err) throw err;
				cb(rows);
			});
		},
		create: (params, cb) => {
			conn.query(`INSERT INTO ${tableName} SET ?`, params, (err, result) => {
				//TODO errors should be passed to callback
				if (err) throw err;
				cb({ id: result.insertId });
			});
		}
	}
}

module.exports = {
	setup, getCrudHandler
};