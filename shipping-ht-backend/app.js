
const express = require('express');
const cors = require('cors');
const ordersRouter = require('./routes/orders');

const app = express();

// Middleware
app.use(cors()); // Allows frontend (e.g., localhost:5173) to access backend
app.use(express.json()); // Parses JSON bodies for POST/INSERT requests

// Routes
app.use('/api', ordersRouter);

// Error handling middleware (optional, for production)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});