const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')
//SETUP MONGODB
const mongoose = require('mongoose')
mongoose.connect(process.env.SECRET || 'mongodb://localhost/exercise-track', {useNewUrlParser: true} )
.then( ()=> console.log('Ati wa Connected to DB...') )
.catch( (err) => console.log('Ko work', err))
mongoose.Promise = global.Promise

//post Schema
var postSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  date: {
    type: String,
    default: new Date()
  },
})

var Post = mongoose.model('Post', postSchema)

//UserSchema
var usernameSchema = new mongoose.Schema({
  _id: {type: mongoose.Schema.Types.ObjectId},
  username: {
    type: String,
    required: true
  },
  post: [postSchema],
})

//Mongoose model
var Username = mongoose.model('User', usernameSchema)

app.use(cors())

app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())
app.set('view engine', 'ejs')

app.use(express.static('public'))
app.get('/', (req, res) => {
  //res.sendFile(__dirname + '/views/index.html')
  res.render('index')
});

app.post('/api/exercise/add', (req,res) => {
  Username.findOne({_id: req.body.userId}, (err,data) => {
    data.post.push({
      description: req.body.description,
      duration: req.body.duration,
      date: req.body.date
    })
  })
  
})

app.post('/api/exercise/new-user', (req,res) => {
  Username.create({
    _id: mongoose.Types.ObjectId(),
    username: req.body.username
  }, (err, data) => {
    console.log(data.username)
    if(err) {
      res.json({error: err.message})
    }else {
      res.json({username: data.username, _id: data._id})    
     }
  })
  
})

// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
