const express = require('express');
const cors = require('cors');
const { connect } = require('mongoose');
require('dotenv').config();
const upload = require('express-fileupload');

const PORT = process.env.PORT;

const userRoutes = require('./routes/userRoutes')
const postRoutes = require('./routes/postRoutes')
const { notFound, errorHandler } = require('./middlewares/errorMiddleware')

const app = express();
app.use(express.json({extended: true}))
app.use(express.urlencoded({extended: true}))

// Determine CORS origin based on the environment
const corsOptions = {
    credentials: true,
    origin: process.env.NODE_ENV === 'production' 
      ? 'https://radblokmultimedia.onrender.com' 
      : 'http://localhost:3000'
  };
app.use(cors(corsOptions));

app.use(upload());
app.use('uploads', express.static(__dirname + '/uploads'))

app.use('/api/users/', userRoutes)
app.use('/api/posts/', postRoutes)


app.use(notFound)
app.use(errorHandler)

connect(process.env.MONGO_URI).then(app.listen(PORT, () => 
console.log(`Running on PORT: ${PORT}\nDatabase Connected Successfully!`)))
.catch(error => {console.log(error)})
