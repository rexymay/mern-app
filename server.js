const express = require('express');
const connectDB = require('./config/db');
const app =  express();
const cors = require('cors');

// Connect to MongoDB Server
connectDB();

// Init Middleware
app.use(express.json({extended:false})); // user express.json() instead of bodyParser.json() of the old way
app.use(cors());

// Main Route - Entry point (you can use index.jx, server.js, etc...)
app.get('/', (req, res) => res.send('API Running'));

// Define API Routes
app.use('/api/users', require('./routes/api/users'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/profile', require('./routes/api/profile'));
app.use('/api/posts', require('./routes/api/posts'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log('Server started on port ' + PORT));


