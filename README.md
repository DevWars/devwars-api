# DevWars <img align="right" src="http://i.imgur.com/D9giOVL.png">

*Official Website for [Devwars.tv](http://devwars.tv/)* 

---
## Stack:
[<img src="https://img.shields.io/badge/Express-brightgreen.svg">](https://expressjs.com/)
[<img src="https://img.shields.io/badge/Typescript-0076c6.svg">](https://www.typescriptlang.org/)
[<img src="https://img.shields.io/badge/TypeORM-red.svg">](http://typeorm.io/#/)
[<img src="https://img.shields.io/badge/MySQL-orange.svg">](https://www.mysql.com/)
---
## Running our test suite:
Go to the root of the repo

``` bash
npm install
npm test
```

All of your tests should pass by default on your first run. We use SQLite so you won't need a database running while you develop.

If however, you want to run our entire stack, please refer to our repo [DevWars Stack](https://github.com/DevWars/devwars-stack)

---
## Project Structure

Overview

    ├── app                           - Main App
    |   ├── controllers                 - HTTP Layer (Handles incoming requests)
    |   ├── factory                     - Factories for all of our models (Helps with testing)
    |   ├── middlewares                 - HTTP Middleware (Useful shorthand for guarding requests) 
    |   ├── models                      - All of the domain in DevWars
    |   ├── repository                  - Data Access Layer (How we fetch our data)
    |   ├── request                     - Structures for complicated request models
    |   ├── routes                      - Individual express modules for separate controllers
    |   ├── services                    - Service layer (Executing actions for DevWars)
    |   ├── types                       - Extra TypeScript definitions
    |   ├── utils                       - Miscellaneous utilities
    ├── cli                           - CLI commands for quick dev tools
    |   ├── Seeder                      - Seeds random data (Will be split eventually)
    |   ├── ChangeRole                  - Changes role of a user by username
    |   ├── GetTestUser                 - Prints out the email / username of a random user
    ├── config                        - CLI commands for quick dev tools
    ├── coverage                      - Test coverage output
    ├── docs                          - API Doc output folder
    ├── test                          - Miscellaneous Tests

## License:
DevWars is licensed with a GPL V3 License
