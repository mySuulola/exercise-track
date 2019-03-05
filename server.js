const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')
///////////////////////////////////
//   SETUP MONGODB
///////////////////////////////////
const mongoose = require('mongoose')
mongoose.connect(process.env.SECRET || 'mongodb://localhost/exercise-track', {useNewUrlParser: true} )
.then( ()=> console.log('Ati wa Connected to DB...') )
.catch( (err) => console.log('Ko work', err))
mongoose.Promise = global.Promise

//post Schema
var exerciseSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: new Date()
  },
  
})

var Exercise = mongoose.model('Exercise', exerciseSchema)

//UserSchema
var userSchema = new mongoose.Schema({
  _id: {type: mongoose.Schema.Types.ObjectId},
  username: {
    type: String,
    required: true
  },
  exercise: [exerciseSchema],
  
}, { usePushEach: true })

//Mongoose model
var User = mongoose.model('User', userSchema)

app.use(cors())

app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())
app.set('view engine', 'ejs')

app.use(express.static('public'))


////////////////////////////////////////
//           ROUTES
/////////////////////////////////////////

//Route to NEW and EDIT
app.get('/', (req, res) => {
  //res.sendFile(__dirname + '/views/index.html')
  res.render('index')
});

//Route for INDEX 
app.get('/api/exercise/users', (req, res) => {
  User.find({}, (err,data) => {
    if(err){
      res.json({'error': err.message})
    }else{     
      res.json(data)
    }
  })
});
// Route to UPDATE
app.post('/api/exercise/add', (req,res) => {
  User.findOne({_id: req.body.userId}, (err,user) => {
    if(err){
      res.json({message: "Not registered"})
    }else{
      user.exercise.push({
        _id: req.body.userId,
        'description': req.body.description,
        'duration': req.body.duration,
        'date': !req.body.date ? new Date() :  new Date(req.body.date).toLocaleDateString() 
       })
       user.save((err,data) => {
         if(err){
           console.log(err)
           res.json({error: err.message})
         }else{
           res.json({message: data})
         }
       })
    }
  })
})

//Route to CREATE
app.post('/api/exercise/new-user', (req,res) => {
  User.findOne({username: req.body.username}, (err, data) => {
    if(data){
      res.json({'message': 'Already registered, provide your Id instead in Exercise Form'})
    }else{
      User.create({
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
    }
  })
})

//Route to SHOW
app.get('/api/exercise/:id', (req,res) => {
  const id = req.params.id
  User.findById(id, (err,data) => {
    res.json(data)
  })
})

//I can retrieve part of the log of any user by also passing along optional parameters of from & to or limit. (Date format yyyy-mm-dd, limit = int)
app.get('/api/exercise/log/:userid/:from?/:to?/:limit?', (req, res) => {
	
	let userId = req.params.userid; 
	let from = req.params.from;
	let to = req.params.to;
	let limit = req.params.limit;

	findUserByIdAndReturnExercises(userId, (err, exercises) => {
		if(err) throw err

		let setOfExercises = []
		let fromDate 
		let toDate 

		if(from === undefined){
			setOfExercises = exercises;	

		} else if(to === undefined ) {
			fromDate = new Date(from).getTime();
			setOfExercises = exercises.filter((item)=>{
				let date = new Date(item.date).getTime()
				return date > fromDate 
			});

		} else {
			fromDate = new Date(from).getTime();
			toDate = new Date(to).getTime();
			setOfExercises = exercises.filter((item)=>{
				let date = new Date(item.date).getTime()
				return date > fromDate && date < toDate 
			});
		}
		
		if(limit !==  undefined) {
			setOfExercises = setOfExercises.slice(0, limit);	
		}

		res.json({
			setOfExercises
		})
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
