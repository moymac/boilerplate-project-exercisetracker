const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser');


let mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

let ExercisesSchema = new mongoose.Schema({
  description: String,
  duration: Number,
  date: Date
});

let UserSchema = new mongoose.Schema({
  username: String,
  log: [ExercisesSchema]
});

let Excercise = mongoose.model('Exercise', ExercisesSchema);
let User = mongoose.model('User', UserSchema);

app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

///664a58d71bdbff15b5055c32
app.post('/api/users', function (req, res) {
  const user = new User({
    username: req.body.username
  });

  user.save(function (err, data) {
    if (err) {
      console.log(err);
    }
    else {
      res.send(data);
    }
  });

}
);

app.post('/api/users/:_id/exercises', function (req, res) {
  const _id = req.params._id;
  const exercise = req.body;
  User.findById(_id, function (err, data) {
    if (err) {
      return done(err);
    }

    const excerciseToAdd = new Excercise({
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date ? new Date(exercise.date) : new Date(),
    });

    data.log.push(excerciseToAdd);
    data.save(function (err, savedData) {
      if (err) {
        console.log(err);
      }
      const response = {
        _id: data._id,
        username: data.username,
        description: excerciseToAdd.description,
        duration: excerciseToAdd.duration,
        date: excerciseToAdd.date.toDateString()
      };

      res.send(response);
    });
  });
})

app.get('/api/users/:_id/logs', function (req, res) {

  User.findById(req.params._id, function (err, data) {
    if (err) {
      console.log(err);
    }
    else {
      try {
        const from = req.query.from;
        const to = req.query.to;
        const limit = req.query.limit;
        const userData = { _id: data._id, username: data.username, count: data?.log?.length ?? 0 };
        let result = data.log;

        if (result.length === 0) {
          res.send(data);
        }
        if (from) {
          result = data.log.filter(function (item) {
            return item.date >= new Date(from);
          });
        }
        if (to) {
          result = data.log.filter(function (item) {
            return item.date <= new Date(to);
          });
        }
        if (limit) {
          result = data.log.slice(0, limit);
        }

        const response = { ...userData, log: result.map((item) => ({ description: item.description, duration: item.duration, date: item.date.toDateString() })) }
        res.send(response);
      } catch (e) {
        console.log(e);
        res.send({ error: 'error' });
      }
    }
  });

})

app.get('/api/users', function (req, res) {
  User.find({}, function (err, data) {
    if (err) {
      console.log(err);
    }
    else {
      res.send(data);
    }
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
