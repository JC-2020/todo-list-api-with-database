const express = require('express');
const bodyParser = require('body-parser');
const db = require('./models');
const es6Renderer = require('express-es6-template-engine');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const store = new SequelizeStore({ db: db.sequelize });

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
  secret: 'secret', // used to sign the cookie
  resave: false, // update session even w/ no changes
  saveUninitialized: true, // always create a session
  store: store,
}))

store.sync();

app.use((req, res, next) => {
  console.log('==== USER ====')
  console.log(req.session.user);
  console.log('================')
  next()
})



app.use(express.static('./public'));

app.engine('html', es6Renderer);  //use es6renderee for html view templates
app.set('views', 'templates'); // look in he templates folder for view templates
app.set('view engine', 'html'); // set the view engine to use the html views


function checkAuth(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/login');
  }
}
app.get('/', checkAuth, (req, res) => {
  res.render('index', {
    locals: {
      user: req.session.user
    }
  });
})

app.get('/register', (req, res) => {
  res.render('register', {
    locals: {
      error: null,
    }
  });
})

app.post('/register', (req, res) => {
  // check if post was submitted wtih email and password
  if (!req.body.email || !req.body.password) {
    res.render('register', {
      locals: {
        error: 'Please submit all required fields'
      }
    })
    return;
  }
  const { email, password } = req.body;
  bcrypt.hash(password, 10, (err, hash) => {
    db.User.create({
      email: email,
      password: hash,
    })
      .then((user) => {
        res.redirect('/login');
      })
  })
})

app.get('/login', (req, res) => {
  res.render('login', {
    locals: {
      error: null,
    }
  });
})

app.post('/login', (req, res) => {
  // check if post was submitted wtih email and password
  if (!req.body.email || !req.body.password) {
    res.render('login', {
      locals: {
        error: 'Please submit all required fields'
      }
    })
    return;
  }
  db.User.findOne({
    where: {
      email: req.body.email
    }
  })
    .then((user) => {
      if (!user) {
        res.render('login', {
          locals: {
            error: 'No user with that email'
          }
        })
        return;
      }

      bcrypt.compare(req.body.password, user.password, (err, matched) => {
        if (matched) {
          req.session.user = user;
          res.redirect('/')
        } else {
          res.render('login', {
            locals: {
            error: 'Incorrect password. Please try again'
            }
          })
          return;
        }
      })
    })
})
app.get('/logout', (req, res) => {
  req.session.user = null;
  res.redirect('/login');
})

app.use('/api*', checkAuth)

//let todoList = [
//{
//id: 1,
//todo: 'Implement a REST API',
// },
//];

// GET /api/todos
app.get('/api/todos', (req, res) => {
  db.Todo.findAll({
    where: {
      UserId: req.session.user.id
    }
  })
    .then((todos) => {
      res.json(todos);
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ error: 'A Database Error Occurred' });
    })
});

// GET /api/todos/:id
app.get('/api/todos/:id', (req, res) => {
  const { id } = req.params;
  db.todo.findByPk(id)
    .then((todo) => {
      if (!todo) {
        res.status(404).json({ error: `Could not find Todo with id: ${id}` })
        return;
      }
      res.json(todo);
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ error: 'A Databse Error Occurred' });
    })
});

// POST /api/todos
app.post('/api/todos', (req, res) => {
  if (!req.body || !req.body.name) {
    res.status(400).json({
      error: 'Provide todo text',
    });
    return;
  }

  db.Todo.create({
    name: req.body.name,
    UserId: req.session.user.id
  })
    .then((newTodo) => {
      res.json(newTodo);
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ error: 'A Databse Error Occurred' });
    })
});

// PUT /api/todos/:id
app.put('/api/todos/:id', (req, res) => {
  if (!req.body || !req.body.name) {
    res.status(400).json({
      error: 'Provide todo text',
    });
    return;
  }
  const { id } = req.params;
  db.Todo.findByPk(id)
    .then((todo) => {
      if (!todo) {
        res.status(404).json({ error: `Could not find Todo with id: ${id}` })
        return;
      }
      todo.name = req.body.name;
      todo.save()
      res.json(todo);
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ error: 'A Databse Error Occurred' });
    })
});
///let updatedTodo = {};
//todoList.forEach((todo) => {
// if (todo.id === Number.parseInt(req.params.id)) {
//  todo.todo = req.body.todo;
//  updatedTodo = todo;
// }
// });
//const status = Object.keys(updatedTodo).length ? 200 : 404;
//res.status(status).json(updatedTodo);
//});

// DELETE /api/todos/:id
app.delete('/api/todos/:id', (req, res) => {
  const { id } = req.params
  db.Todo.destroy({
    where: {
      id: id
    }
  })
    .then((deleted) => {
      if (deleted === 0) {
        res.status(404).json({ eror: `Could not find Todo with id: ${id}` })
        return
      }
      res.status(204).json()
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ error: 'A Databse Error Occurred' });
    })
});


app.listen(3000, function () {
  console.log('Todo List API is now listening on port 3000...');
});
