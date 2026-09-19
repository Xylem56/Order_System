const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { GetCommand, PutCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const docClient = require('../db/dynamoClient');

const requireRole = (role) => (req, res, next) => {
  const userRole = req.user && req.user.role;
  if (userRole === role) return next();
  return res.status(403).json({ message: 'Forbidden' });
};

router.post('/register',  async (req, res) => {
  const { full_name, email, password, staffId } = req.body;

  if (!full_name || !email || !password || !staffId) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const idCheck = await docClient.send(
      new GetCommand({
        TableName: 'StaffIds',
        Key: { staffId },
      })
    );

    const idRecord = idCheck.Item;
    if (!idRecord) {
      return res.status(400).json({ message: 'Invalid Staff ID' });
    }

    if (idRecord.used) {
      return res.status(401).json({ message: 'Staff ID has already been used' });
    }

    const existingUser = await docClient.send(
      new GetCommand({
        TableName: 'Staff',
        Key: { email },
      })
    );

    if (existingUser.Item) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const role = 'staff';

    await docClient.send(
      new PutCommand({
        TableName: 'Staff',
        Item: {
          full_name,
          email,
          password: hashedPassword,
          role,
          staffId,
        },
      })
    );

    await docClient.send(
      new UpdateCommand({
        TableName: 'StaffIds',
        Key: { staffId },
        UpdateExpression: 'set used = :used',
        ExpressionAttributeValues: { ':used': true },
      })
    );

    const token = jwt.sign({ email, role }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '1h' });
    return res.status(201).json({ message: 'Staff registered successfully', token });
  } catch (error) {
    console.error('Error during registration:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const result = await docClient.send(
      new GetCommand({
        TableName: 'Staff',
        Key: { email },
      })
    );

    const staff = result.Item;
    if (!staff) {
      return res.status(404).json({ message: 'User not found' });
    }

    const validPassword = await bcrypt.compare(password, staff.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid Password' });
    }

    const token = jwt.sign(
      { email: staff.email, role: staff.role || 'staff' },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '1h' }
    );

    return res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
