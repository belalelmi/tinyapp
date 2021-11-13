const express = require('express');
const app = express();
const PORT = 8080;
const morgan = require('morgan');
const { getUserByEmail, urlsForUser } = require("./helper");
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');

app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieSession({ name: 'session', secret: 'notsosecretsession' }));
app.set('view engine', 'ejs');

const urlDatabase = {
  // "b2xVn2": {
  //   shortUrl: "b2xVn2",
  //   longUrl: "http://www.lighthouselabs.ca"
  // }
};

const users = {
  // "userRandomID": {
  //   id: "userRandomID",
  //   email: "user@example.com",
  //   password: "purple-monkey-dinosaur"
  // }
};

app.get('/', (req, res) => {
  if (req.session.userID) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

const generateRandomString = () => {
  return Math.floor((1 + Math.random()) * 0x1000000).toString(16).substring(1);
};

app.get('/urls', (req, res) => {
  const userID = req.session.userID;
  const userUrls = urlsForUser(userID, urlDatabase); //using the newly created urlsForUser function
  const templateVars = { urls: userUrls, user: users[userID] };

  if (!userID) {
    res.statusCode = 401;
  }

  res.render('urls_index', templateVars);
});

app.post('/urls', (req, res) => {
  if (req.session.userID) {
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = {
      longURL: req.body.longURL,
      userID: req.session.userID
    };
    res.redirect('/urls');
  }
});

app.get('/urls/new', (req, res) => {
  if (req.session.userID) {
    const templateVars = { user: users[req.session.userID] };
    res.render('urls_new', templateVars);
  } else {
    res.redirect('/login');
  }
});

app.get('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  const userID = req.session.userID;
  const userUrls = urlsForUser(userID, urlDatabase);
  const templateVars = { urlDatabase, userUrls, shortURL, user: users[userID] };

  if (!urlDatabase[shortURL] || !userID) {
    const error = 'Please try again!!';
    res.send(error);
  } else {
    res.render('urls_show', templateVars);
  }
});

app.post('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;

  if (req.session.userID && req.session.userID === urlDatabase[shortURL].userID) {
    urlDatabase[shortURL].longURL = req.body.longURL;
    res.redirect('/urls');
  } else {
    const error = 'Please login.';
    res.send(error);
  }
});

app.get('/u/:shortURL', (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    res.redirect(urlDatabase[req.params.shortURL].longURL);
  }
});

app.post('/urls/:shortURL/delete', (req, res) => {
  const shortURL = req.params.shortURL;

  if (req.session.userID && req.session.userID === urlDatabase[shortURL].userID) {
    delete urlDatabase[shortURL];
    res.redirect('/urls'); //redirection for delete
  }
});

app.get('/login', (req, res) => {
  if (req.session.userID) {
    res.redirect('/urls');
    return;
  }
  const templateVars = { user: users[req.session.userID] };
  res.render('urls_login', templateVars);
});

app.post('/login', (req, res) => {
  const user = getUserByEmail(req.body.email, users); //storing the return
  if (user && bcrypt.compareSync(req.body.password, user.password)) {
    req.session.userID = user.userID;
    console.log('LOGGED IN - hashedPassword:', user.password);
    res.redirect('/urls');
  } else {
    res.send('Please enter a valid Email & Password combination!\n\n If you dont have an account please register!');
  }
});
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  console.log(req.params.shortURL + " was just DELETED!!");
  res.redirect("/urls");
});
app.post("/urls/:shortURL/", (req, res) => {
  // console.log(req.params.shortURL)
  const longURL = req.body.longURL;
  const shortURL = req.params.shortURL;
  urlDatabase[shortURL] = longURL;
  res.redirect('/urls');
});

app.post('/logout', (req, res) => { //mentor said to add seesion.sig
  req.session.userID = null;

  res.redirect('/urls');
});

app.get('/register', (req, res) => {
  if (req.session.userID) {
    return res.redirect('/urls');
  }
  const templateVars = { user: users[req.session.userID] };
  res.render('urls_registration', templateVars);
});

app.post('/register', (req, res) => {
  if (req.body.email && req.body.password) {
    if (!getUserByEmail(req.body.email, users)) {
      const userID = generateRandomString();
      users[userID] = {
        userID: userID,
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password, 10) //using 10 to cycle through the encryption 10 times
      };
      console.log('hashedPassword:', users[userID].password);
      req.session.userID = userID;
      res.redirect('/urls');
    } else {
      res.send('Please enter a NEW Email & Password combination!');
      res.redirect('/urls');
    }
  } else {
    res.send('Please enter a VALID Email & Password combination!');
  }
});

app.listen(PORT, () => {
  console.log(`Server running in development mode & listening on port ${PORT}:`);
});