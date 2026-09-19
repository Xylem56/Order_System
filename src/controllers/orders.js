const { v4: uuidv4 } = require("uuid");
const { PutCommand, QueryCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const docClient = require("../db/dynamoClient");

const TABLE_NAME = "Orders";

const ORDER_STATUS = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  PICKED_UP: "PICKED_UP",
  IN_TRANSIT: "IN_TRANSIT",
  AT_DESTINATION: "AT_DESTINATION",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
};

async function createOrder(req, res) {
  const { item, origin, destination } = req.body;
  const trackingId = uuidv4();

  const order = {
    trackingId,
    recordType: "ORDER",
    item,
    origin,
    destination,
    status: ORDER_STATUS.PENDING,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: order }));

  res.status(201).json(order);
}

async function addStatus(req, res) {
  const { trackingId } = req.params;
  const { status, location, notes } = req.body;
  const timestamp = new Date().toISOString();

  const statusRecord = {
    trackingId,
    recordType: `STATUS#${timestamp}`,
    status,
    location,
    notes,
    timestamp,
  };

  await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: statusRecord }));

  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { trackingId, recordType: "ORDER" },
      UpdateExpression: "SET #s = :status, updatedAt = :updatedAt",
      ExpressionAttributeNames: { "#s": "status" },
      ExpressionAttributeValues: { ":status": status, ":updatedAt": timestamp },
    })
  );

  res.status(201).json(statusRecord);
}

async function getOrder(req, res) {
  const { trackingId } = req.params;

  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "trackingId = :tid",
      ExpressionAttributeValues: { ":tid": trackingId },
    })
  );

  const items = result.Items;

  if (!items || items.length === 0) {
    return res.status(404).json({ message: "Order not found" });
  }

  const orderInfo = items.find((item) => item.recordType === "ORDER");
  const history = items
    .filter((item) => item.recordType.startsWith("STATUS#"))
    .map(({ recordType, ...rest }) => rest);

  res.status(200).json({ ...orderInfo, history });
}

module.exports = { createOrder, addStatus, getOrder };