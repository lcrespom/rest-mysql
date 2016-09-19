# rest-mysql
REST API to relational DB using node.js, Express and MySQL.

Experimenting with generic CRUD access to MYSQL tables via REST,
following guidelines from [this blog post](https://scotch.io/tutorials/build-a-restful-api-using-node-and-express-4).

##TODO
- Big refactor
	- Separate generic from app-specific via npm package
	- Implement in TypeScript, add types 
	- Use Promises instead of callbacks
- Add function to purge unused addresses
	- Remove all addresses not referenced by customer's pickup address id
		nor recent addresses list
	- Consider admin user profile and UI
- Test https://letsencrypt.org/
- Setup and document an automated daily database rolling backup system
- Consider using morgan package for tracing
