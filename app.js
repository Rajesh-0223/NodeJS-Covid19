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
    db = await open({
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

  response.send(convertStateToPascalCase(state));
});

const convertDistrictTableToPascalCase = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

// Create a district in the district table, district_id is auto-incremented
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;

  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;

  const createNewDistrict = `
        INSERT INTO 
        district (district_name, state_id, cases, cured, active, deaths)
        VALUES (
            '${districtName}',
            ${stateId},
            ${cases},
            ${cured},
            ${active},
            ${deaths}
        );`;
  const newDistrict = await db.run(createNewDistrict);
  const districtId = newDistrict.lastID;
  response.send("District Successfully Added");
});

// Returns a district based on the district ID
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;

  const getDistrictQuery = `
        SELECT
        *
        FROM
        district
        WHERE 
        district_id = ${districtId};`;
  const district = await db.get(getDistrictQuery);
  response.send(convertDistrictTableToPascalCase(district));
});

// Deletes a district from the district table based on the district ID
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;

  const deleteDistrictQuery = `
        DELETE FROM
        district
        WHERE
        district_id = ${districtId};`;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

// Updates the details of a specific district based on the district ID
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;

  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;

  const updateDistrictQuery = `
        UPDATE 
        district
        SET
        district_name = '${districtName}',
        state_id = ${stateId},
        cases = ${cases},
        cured = ${cured},
        active = ${active},
        deaths = ${deaths}
        WHERE 
        district_id = ${districtId};`;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

// Returns the statistics of total cases, cured, active, deaths of a specific state based on state ID
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;

  const getStateStatsQuery = `
        SELECT 
        SUM(cases) as totalCases,
        SUM(cured) as totalCured,
        SUM(active) as totalActive,
        SUM(deaths) as totalDeaths
        FROM 
        district
        WHERE
        state_id = ${stateId};`;
  const stateStats = await db.get(getStateStatsQuery);
  console.log(stateStats);
  response.send(stateStats);
});

// Returns an object containing the state name of a district based on the district ID
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;

  const getStateNameQuery = `
        SELECT
        state_name as stateName
        FROM 
        district INNER JOIN state
        ON state.state_id = district.state_id
        WHERE 
        district_id = ${districtId};`;
  const stateName = await db.get(getStateNameQuery);
  response.send(stateName);
});

module.exports = app;
