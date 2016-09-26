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
	https: true,
	webPort: 443,
	webPath: path.resolve('../ngtaxi/dist'),
	clientRoutes,
	bcrypt: true,
	jwtSecret: 'Mxmbawlx50XOpKkUMcY2wNjoRmU06g3ComNXJfxfnyt9ESuAKSQxe8FXG' +
		'2dgiEtWdUxbqK9hZ9sWZ4KdGwI5pRmQo0xivuMlh5G2f0ZBco2eDPEZ269Mg' +
		'z4af93xm9Xg',
	DEV: {
		cors: true,
		https: false,
		webPort: 7777
	},
	WINDEV: {
		cors: true,
		https: false,
		webPort: 7777,
		bcrypt: false
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
