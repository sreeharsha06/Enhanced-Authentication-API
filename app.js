const express = require('express');
const mongoose = require('mongoose');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const home = require('./routes/home')

require('dotenv').config();

const options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Auth',
        version: '1.0.0',
        description: '',
      }
    },
  
    apis: ['./routes/*.js'],
  };
const app = express();
const PORT = process.env.PORT || 3000;
const specs = swaggerJsdoc(options);

app.use(express.json());

app.use('/', home)
app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
