<div align="center">
  <br>
  <img alt="DEV" src="https://i.imgur.com/D9giOVL.png" width="250px">
  <h1>DevWars API</h1>
  <strong>The Human Layer of the Stack</strong>
</div>
<br>
<p align="center">
  <a href="">
    <img src="https://img.shields.io/badge/Nodejs-v10.0.0-green.svg" alt="nodejs version">
  </a>
  <a href="https://expressjs.com/">
    <img src="https://img.shields.io/badge/Express-v4.0.0-brightgreen.svg" alt="expressjs version">
  </a>
  <a href="https://www.typescriptlang.org/">
    <img src="https://img.shields.io/badge/Typescript-v3.0.0-blue.svg" alt="typescript version">
  </a>
  <a href="http://typeorm.io/#/">
    <img src="https://img.shields.io/badge/TypeORM-v0.2.0-red.svg" alt="typeorm version">
  </a>
   <a href="http://typeorm.io/#/">
    <img src="https://img.shields.io/badge/PostgresSQL-v11.0.0-orange.svg" alt="postgres version">
  </a>
  <img src="https://flat.badgen.net/dependabot/devwars/devwars-api/162181219?icon=dependabot" alt="Dependabot Badge" />
</p>

Welcome to the [DevWars](https://DevWars.tv) API codebase. This is the core backbone and interface for the day to day running of the DevWars platform.

## What is DevWars?

[DevWars.tv](https://www.devwars.tv/) is a live game show for developers that is currently streamed on [Twitch](https://www.twitch.tv/devwars). People of all levels participate in an exhilarating battle to create the best website they can within 60 minutes. Teams are formed of 3 people, with the team's members each controlling a single language - HTML, CSS and JavaScript.

## Getting Started

### Prerequisites

-   [Nodejs](https://nodejs.org/en/): 10.0 or higher
-   [PostgreSQL](https://www.postgresql.org/): 9.4 or higher.
    <!-- -   [Firebase](https://firebase.google.com/): instance with database (service account). -->

### Dependency Installation

Run `npm run install` to install dependent node_modules.

### Environment Variables

Make a copy of the `.env.example` file in the same directory and rename the given file to `.env`. This will be loaded up into the application when it first starts running. These are required configuration settings to ensure correct function. Process through the newly created file and make the required changes if needed.

### Seeding The Database

Once you have everything setup in the environment variables folder, you will be able to seed the database. This process will generate fake data that will allow testing and usage of the API.

run `npm run seed`

### Testing

Running `npm run test` will start the testing process, using the second set of connection details within the `.env` file. This process is enforced as a git hook before committing code.

### Development

Running `npm run dev` will start a development server that will automatically restart when changes occur. Additionally running `npm run dev:break` will allow development with the inspector attached.

## Contributors

This project exists thanks to all the people who [contribute](https://github.com/DevWars/devwars-api/graphs/contributors). We encourage you to contribute to DevWars but ensure to open a related issue first. Please check out the [contributing](https://github.com/DevWars/devwars-api/blob/master/CONTRIBUTING.md) to DevWars guide for guidelines about how to proceed.

## License

> You can check out the full license [here](https://github.com/DevWars/devwars-api/blob/master/LICENSE)

This project is licensed under the terms of the **MIT** license.
