# COMP3133_101460767_Assignment1
npm install
docker-compose up --build

 for signup http://localhost:4000/graphql (POST):
 
{"query": "mutation {\n  signup(\n    username: \"johndoe\"\n    email: \"john@example.com\"\n    password: \"pass123\"\n  ) {\n    _id\n    username\n    email\n    created_at\n  }\n}"}