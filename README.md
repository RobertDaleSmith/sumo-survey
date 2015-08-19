# sumo-survey


##Setup Instructions:
-----

1. Spin up your MySQL server.

2. Create a new database schema named: 'sumosurvey'.

3. Add MySQL database credentials to the config.json file. (host, username, password)

4. npm install

5. npm app



##Admin Interface
-----

- Login to admin interface at: http://localhost:3000/admin

- Default admin username and password can be set in config.json before first launch.

- Default username is 'sumo', password is 'tacos'.


##Bugs:
-----

- Association between Question and Answer randomly now working.

- Added check to fetch detached answers on public facing page, until resolved.


##In response to:
-----

Create a web app written in Node.JS using an Express based framework, SequelizeJS, and MySQL.

Use NPM to declare all dependencies so that we can run it in a test environment.

The app should allow an admin to enter survey questions with multiple choice answers.

When a guest visits the app in a browser it should present a random survey question to the guest and allow them to answer.

Record answers and display the survey results in an admin interface.

Avoid showing a previously answered question to the same guest.

Make sure the UI is mobile browser friendly.

Provide a clear README with instructions on how to setup and run the app.

Create a github.com repository with the app that we can pull from and test.


-- 
Noah Kagan

Ps. We're hiring 1 javascript developer at SumoMe. I'll buy you a year of tacos for a successful referral!