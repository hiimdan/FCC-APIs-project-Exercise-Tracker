const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const mongo = require('mongodb')
const shortid = require('shortid')

const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect(process.env.MONGOLAB_URI, {dbName: 'FCC_Projects'})

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const exlogs = new mongoose.Schema({
  description: {type: String, required: true},
  duration: {type: Number, required: true},
  date: Date
})

const User = new mongoose.Schema({
  username: {type: String, required: true},
  userId: String,
  logs: [exlogs],
  count: Number
})

let userModel = mongoose.model('User', User)



// Create new user
app.post('/api/exercise/new-user', (req, res, next) => {
  console.log('endpoint reached')
  userModel.findOne({username: req.body.username}, (err, user) => {
    if (err) {return next(err)};
    if (user) {
      res.type('txt').send(req.body.username + ' is taken.');
    } else {
      let newUser = new userModel({username: req.body.username, userId: shortid.generate(), count: 0});
      newUser.save((err, data) => {
        if (err) {return next(err)};
        res.json({'username': data.username, 'userId': data.userId});
      })
    }
  })
})

// Add excercise log to user
app.post('/api/exercise/add', (req, res, next) => {
  if (!req.body.userId) {return next({status: 500, message: 'userId field is required'})}
  let update = {
    $push: {
      logs: {
        description: req.body.description,
        duration: req.body.duration,
        date: req.body.date ? new Date(req.body.date) : new Date()
      }
    },
    $inc: {count: 1}
  }
  
  let options = {
    new: true,
    runValidators: true
  }
  userModel.findOneAndUpdate({userId: req.body.userId}, update, options, (err, doc) => {
    if (err) {return next(err)};
    if (doc) {
      res.json(doc);
    } else {
      res.type('txt').send('userId ' + req.body.user + ' does not exist');
    }
  })
})


// Request all users
app.get('/api/exercise/users', (req, res, next) => {
  userModel.find({}, (err, data) => {
    if (err) {return next(err)}
    if (data) {
      res.json(data)
    } else {
      res.type('txt').send('no users exist')
    }
  })
})

// Query user data
app.get('/api/exercise/log', (req, res, next) => {
  if (req.query.userId) {
    userModel.findOne({userId: req.query.userId}, (err, user) => {
      if (err) {return next(err)}
      if (user) {
        if (Object.keys(req.query).length === 1) {
          res.json(user)
        } else {
          let from = req.query.from ? new Date(req.query.from) : null;
          if (from && from.toString() == 'Invalid Date') {
            return next({status: 500, message: req.query.from + ' is not a valid date format'})
          }
          let to = req.query.to ? new Date(req.query.to) : null;
          if (to && to.toString() == 'Invalid Date') {
            return next({status: 500, message: req.query.from + ' is not a valid date format'})
          } else if (to) {
            to = to.setDate(to.getDate() + 1)
          }
          let limit = req.query.limit ? req.query.limit : null;
          if (limit && parseInt(limit) == NaN) {
            return next({status: 500, message: req.query.limit + ' is not a valid number'})
          }
          
          let fData = user.logs.filter((log) => {
            if (from && log.date < from) { return false}
            if (to && log.date >= to) {return false}
            if (limit && log.duration > limit) {return false}
            return true;
          })
          
          if (fData.length === 0) {
            res.type('txt').send('no data found')
          } else {
            res.json(fData)
          }
        }
      } else {
        res.type('text').send('could not find ' + req.query.userId)
      }
    })
  } else {
    res.type('txt').send('username required')
  }
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
