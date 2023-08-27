const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const axios = require("axios");

const app = express();
app.use(express.static(path.join(__dirname, "index.html")));
app.use(express.json());
const dbPath = path.join(__dirname, "crypto.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

app.get("/crypto", async (request, response) => {
  try {
    // const dataFetched = await axios.get(
    //   "https://api.wazirx.com/api/v2/tickers"
    // );
    // response.json(dataFetched.data); // Sending the fetched data as JSON

    const res = await axios.get("https://api.wazirx.com/api/v2/tickers");
    const tickers = res.data;

    const top10Tickers = Object.values(tickers).slice(0, 10);
    // console.log(top10Tickers);

    for (const ticker of top10Tickers) {
      const { name, last, buy, sell, volume, base_unit } = ticker;

      console.log(name, last, buy, sell, volume, base_unit);
      const insertQuery = `insert into cryptos2 values('${name}',${last},${buy},${sell},${volume},'${base_unit}');`;
      try {
        await db.run(insertQuery);
      } catch (error) {
        console.error("Error inserting data:", error);
      }
    }

    response.json(top10Tickers);
  } catch (error) {
    console.error("Error fetching data:", error);
    response
      .status(500)
      .json({ error: "An error occurred while fetching data" });
  }
});

app.get("/get-crypto-data", async (request, response) => {
  try {
    const query = "SELECT * FROM cryptos2";
    const result = await db.all(query);

    response.json(result);
  } catch (error) {
    console.error("Error fetching data:", error);
    response
      .status(500)
      .json({ error: "An error occurred while fetching data" });
  }
});
