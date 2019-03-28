# FCC APIs project Exercise Tracker

### Details:
1. The "Create a New User" form `POSTS` form data to `/api/exercise/new-user` and verifies whether the user exists or not. If not, a new user is created and returned is that user's submitted username, and a unique id using the shortid module.
2. The "Add exercises" form `POSTS` form data to `/api/exercise/add` where a search for the user is made and the form data is included in the specified user's exercise log if the form data meets the validation requirements. For each new log created, a count within the user document is incremented by 1.
3. By submitting a `GET` request to `/api/exercise/users` a collection of all users existing in the database is returned.
4. Users can be queried through `GET /api/exercise/log?{userId}[&from][&to][&limit]`. If only the userId is included as a query parameter, then that entire user document is returned. If any additional valid queries are included, then the specific logs which match the query parameters are returned.
