let jwt = require('jsonwebtoken');

let jwtSecret = null;

function setup(secret) {
	jwtSecret = secret;
}


//-------------------- Authentication --------------------

function registerLogin(router, loginUrl, getUser) {
	router.post(loginUrl, (req, res) => {
		getUser(req.body.userId, user => {
			if (!user) {
				res.status(401)
				.json({ message: 'Invalid login'});
			}
			else {
				if (comparePW(req.body.password, user.password)) {
					let tokenBody = {
						sub: user.userId,
						aud: user.role
					};
					res.status(201)
					.json({
						message: 'Login OK',
						//TODO consider sending a cookie
						token: jwt.sign(tokenBody, jwtSecret)
					});
				}
				else {
					res.status(401)
					.json({ message: 'Invalid login'});
				}
			}
		});
	});
}

function comparePW(reqPW, dbPW) {
	//TODO use some standard pw encryption
	//	see: https://codahale.com/how-to-safely-store-a-password/
	//	and: https://github.com/ncb000gt/node.bcrypt.js/
	return reqPW == dbPW;
}


//-------------------- Authorization --------------------

function registerAuthorizationCheck(route, roles, url) {
	route.use(url, (req, res, next) => {
		let token = getToken(req);
		if (!token)
			return rejectNoToken(res);
		token = verifyToken(token);
		if (!token)
			return rejectInvalidToken(res);
		if (!roleAuthorized(token, roles))
			return rejectNotAuthorized(res);
		else
			next();
	});
}

function getToken(req) {
	//TODO for testing only - replace with real code when app supports JWT
	return jwt.sign({ sub: 'userid', aud: 'employee' }, jwtSecret);
	//return req.body.token || req.query.token || req.headers['x-access-token'];
}

function verifyToken(token) {
	return jwt.verify(token, jwtSecret)
	//return token;	//TODO decode and return token
}

function roleAuthorized(token, roles) {
	return roles[token.aud];
}


function rejectNoToken(res) {
    res.status(403)
	.json({
		message: 'No token provided',
		href: '/api/login'
	});
}

function rejectInvalidToken(res) {
    res.status(401)
	.json({
		message: 'Invalid token'
	});
}

function rejectNotAuthorized(res) {
    res.status(401)
	.json({
		message: 'Provided token not authorized for requested resource'
	});
}


module.exports = {
	setup,
	registerAuthorizationCheck,
	registerLogin
};