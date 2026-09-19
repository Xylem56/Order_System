require("dotenv").config();
const { PutCommand } = require("@aws-sdk/lib-dynamodb");
const docClient = require("../db/dynamoClient");

const staffIdsToCreate = ["STF-896-1XO", "STF-577-9G2", "STF-226-3H5", "STF-889-4J8"];

async function seedStaffIds() {
  for (const staffId of staffIdsToCreate) {
    await docClient.send(
      new PutCommand({
        TableName: "StaffIds",
        Item: { staffId, used: false, createdAt: new Date().toISOString() },
      })
    );
    console.log("Created staff ID:", staffId);
  }
}

seedStaffIds().catch((err) => console.error("Seed failed:", err));