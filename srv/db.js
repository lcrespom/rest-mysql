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
			var sql = `SELECT * FROM ${tableName}`;
			conn.query(sql, cb);
		},
		byId: (id, cb) => {
			var sql = `SELECT * FROM ${tableName} WHERE id=?`;
			conn.query(sql, [id], cb);
		},
		create: (params, cb) => {
			var sql = `INSERT INTO ${tableName} SET ?`;
			conn.query(sql, params, cb);
		},
		update: (id, params, cb) => {
			var sql = `UPDATE ${tableName} SET ? WHERE id=?`;
			conn.query(sql, [params, id], cb);
		},
		delete: (id, cb) => {
			var sql = `DELETE FROM ${tableName} WHERE id=?`;
			conn.query(sql, [id], cb);
		}
	}
}

module.exports = {
	setup, getCrudHandler
};