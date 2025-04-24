const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors');
const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();
const userRoutes = require('./routes/user.routes')
const captainRoutes = require('./routes/captain.routes');
app.use(cors())
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.get('/', (req, res) => {
    res.send('hello world');
})
app.use(cookieParser())
app.use('/users', userRoutes);
app.use('/captains', captainRoutes);
module.exports = app;