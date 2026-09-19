const express = require('express');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 3000;
const authRoutes = require('./src/routes/auth');
const ordersRoutes = require ('./src/routes/orders');


app.use(express.json());
app.use('/auth', authRoutes);
app.use('/orders', ordersRoutes);

app.listen(port, () => {
  console.log(`Server is listening at port ${port}...`);
});