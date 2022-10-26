const express = require("express");
const path = require("path");
const app = express();
app.use(express.json());

const bcrypt = require("bcrypt");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const dbPath = path.join(__dirname, "userData.db");
let db = null;

const initializeDBServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("The Server Is Deployed.... :]");
    });
  } catch (err) {
    console.log(`Error: ${err.message}`);
    process.exit(1);
  }
};

initializeDBServer();

//API-1
//Create New User Account

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  //Encrypting Password: hashing=10
  const hashedPassword = await bcrypt.hash(password, 10);

  const checkUserName = `
    SELECT *
        FROM user
    WHERE username='${username}'`;

  const checkNameResponse = await db.get(checkUserName);
  //Scenario-1
  //check If the username already exists

  if (checkNameResponse !== undefined) {
    response.status(400);
    response.send("User already exists");
  } else {
    //Scenario-2
    //If the registrant provides a password with less than 5 characters

    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      //Scenario-3
      //Successful registration of the registrant after passing all condition's

      const insertNewUserQuery = `
        INSERT INTO user (username, name, password, gender, location)
            VALUES 
            ('${username}',
            '${name}',
            '${hashedPassword}',
            '${gender}',
            '${location}');`;

      await db.run(insertNewUserQuery);
      response.send("User created successfully");
    }
  }
});

//API-2

//Login the User and check for user details in DB

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const checkUserQuery = `
  SELECT * 
    FROM user
  WHERE username = '${username}';`;

  const checkUserResponse = await db.get(checkUserQuery);

  //SCENARIO-1
  //If an unregistered user tries to login

  if (checkUserResponse === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    //SCENARIO-2
    //If the user provides incorrect password

    const isPasswordMatched = await bcrypt.compare(
      password,
      checkUserResponse.password
    );
    //SCENARIO-3
    //Successful registration of the registrant
    if (isPasswordMatched === true) {
      response.status(200);
      response.send("Login success!");

      //SCENARIO-2
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//API-3
//UPDATING EXISTING USER PASSWORD

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const newHashedPassword = await bcrypt.hash(newPassword, 10);
  const checkUserQuery = `
    SELECT *
        FROM user
    WHERE username='${username}';`;
  const checkUserResponse = await db.get(checkUserQuery);

  if (checkUserResponse !== undefined) {
    const checkOldPassword = await bcrypt.compare(
      oldPassword,
      checkUserResponse.password
    );

    //SCENARIO-1
    //If the user provides incorrect current password

    if (checkOldPassword === true) {
      //SCENARIO-2
      //If the user provides new password with less than 5 characters
      if (newPassword.length < 5) {
        response.status(400);
        response.send("Password is too short");
        //SCENARIO-3
        //Successful password update if all conditions passed
      } else {
        const updatePasswordQuery = `
            UPDATE user
                SET password='${newHashedPassword}'
            WHERE username='${username}';`;

        await db.run(updatePasswordQuery);

        response.status(200);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  } else {
    response.status(400);
    response.send("Invalid user");
  }
});

module.exports = app;
