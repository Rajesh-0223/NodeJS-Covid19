const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3009, () => {
      console.log("Server Running at http://localhost:3009/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertStateToPascalCase = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

// Returns a list of all states in the state table
app.get("/states/", async (request, response) => {
  const getStatesQuery = `
        SELECT
        *
        FROM
        state;
    `;
  const statesArray = await db.all(getStatesQuery);
  response.send(
    statesArray.map((eachState) => convertStateToPascalCase(eachState))
  );
});

// Returns a state based on the state ID
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;

  const getStateQuery = `
        SELECT
        *
        FROM
        state
        WHERE
        state_id = ${stateId};
    `;
  const state = await db.get(getStateQuery);
  response.send(state);
});

module.exports = app;
