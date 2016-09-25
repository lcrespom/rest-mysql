const path = require('path');

//-------------------- CRUD table configuration --------------------
let tableRoutes = [{
	url: '/addresses',
	table: 'addresses',
	title: 'Postal address'
}, {
	url: '/customers',
	table: 'customers',
	title: 'Customer table',
	fkGetOne: { id_pickup_addr: 'addresses' },
	fkUpdate: { id_pickup_addr: 'addresses' },
	fkCreate: { id_pickup_addr: 'addresses' },
	roles: { employee: true }
}];

//-------------------- mySql server --------------------
let mySql = {
	host: 'localhost',
	user: 'root',
	password: 'root',
	database: 'testdb'
};

//-------------------- Client routes to be redirected to index --------------------
let clientRoutes = ['login', 'customers', 'rides'];


//-------------------- Full configuration --------------------
let config = {
	tableRoutes,
	mySql,
	webPort: 443,
	webPath: path.resolve('../ngtaxi/dist'),
	routes,
	NOSUDO: {
		webPort: 8443
	}
};

function init(env) {
	if (env) {
		if (config[env]) {
			return Object.assign(config, config[env]);
		}
		else {
			console.warn('Environment "' + env + '" not found in configuration. Using defaults.');
		}
	}
	return config;
}

module.exports = { init };
