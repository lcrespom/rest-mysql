var jwt = require('jsonwebtoken');
var bcrypt = require('bcrypt');

var jwtSecret = null;

function setup(secret) {
	jwtSecret = secret;
}


//-------------------- Authentication --------------------

function registerLogin(router, loginUrl, getUser) {
	router.post(loginUrl, (req, res) => {
		getUser(req.body.userid, user => {
			if (!user)
				respondLoginError(res);
			else {
				comparePW(req.body.password, user.pwhash, (err, pwOK) => {
					if (err || !pwOK)
						respondLoginError(res);
					else
						respondLoginOK(res, user);
				});
			}
		});
	});
}

function respondLoginOK(res, user) {
	var tokenBody = {
		sub: user.userid,
		aud: user.role
	};
	delete user.pwhash;
	res.status(201)
	.json({
		message: 'Login OK',
		user,
		token: jwt.sign(tokenBody, jwtSecret)
	});
}

function respondLoginError(res) {
	res.status(401)
	.json({ message: 'Invalid login'});
}

function comparePW(reqPW, storedPW, cb) {
	bcrypt.compare(reqPW, storedPW, cb);
}


//-------------------- Authorization --------------------

function registerAuthorizationCheck(route, roles, url) {
	route.use(url, (req, res, next) => {
		var token = getToken(req);
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
	return req.headers['x-access-token'] || req.body.token || req.query.token;
}

function verifyToken(token) {
	return jwt.verify(token, jwtSecret)
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


//-------------------- Exports --------------------

module.exports = {
	setup,
	registerAuthorizationCheck,
	registerLogin
};