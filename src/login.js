function setup(router, realm = 'REST API') {
	router.use((req, res, next) => {
		if (isAuthorized(req))
			return next();
		res.status(401)
		.header('WWW-Authenticate', `Basic realm="${realm}"`)
		.json({
			message: 'Authentication required'
		});
	});
}

function isAuthorized(req) {
	var authorization = req.header('Authorization');
	//TODO check that authorization is correct
	if (authorization) return true;
	return false;
}

module.exports = {
	setup
}