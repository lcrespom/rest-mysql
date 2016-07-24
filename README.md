# rest-mysql
REST API to relational DB using node, express and mysql

Experimenting with generic CRUD access to MYSQL tables via REST,
following guidelines from [this blog post](https://scotch.io/tutorials/build-a-restful-api-using-node-and-express-4).

##TODO
- Properly report error messages in the HTTP response
- Distinguish between 40x errors and 50x errors.
	- 40x errors:
		- Table or column name does not exist
		- Element with specified id not found (e.g. /api/tableName/5)
	- 50x errors: if 40x error could not be identified
- Improve HATEOAS
	- Add self field to all responses where it makes sense
	- Provide catalog at /api root address
- Write a sample app to test and illustrate usage
- Support relationships
- Support GraphQL (long term)
