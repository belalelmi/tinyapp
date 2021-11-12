const express = require('express');
const app = express();
const PORT = 8080;
const morgan = require('morgan');
const { getUserByEmail, urlsForUser } = require("./helper")
app.use(morgan('dev'))
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

const cookieSession = require('cookie-session');
app.use(cookieSession({ name: 'session', secret: 'grey-rose-juggling-volcanoes' }));

const bcrypt = require('bcryptjs');

app.set('view engine', 'ejs');


const urlDatabase = {
  // "b2xVn2": {
  //   shortUrl: "b2xVn2",
  //   longUrl: "http://www.lighthouselabs.ca"
  // },
  // "9sm5xK": {
  //   shortUrl: "9sm5xK",
  //   longUrl: "http://www.google.com"
  // }
};

const users = {
  // "userRandomID": {
  //   id: "userRandomID",
  //   email: "user@example.com",
  //   password: "purple-monkey-dinosaur"
  // },
  // "userRandomID2": {
  //   id: "userRandomID2",
  //   email: "user2@example.com",
  //   password: "dishwasher-funk"
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
// const getUserByEmail = (email, database) => {
//   if (database) {   //CHECK TO SEE IF THE DATABASE EXISTS// 
//     for (const user in database) {
//       if (database[user].email === email) {
//         return database[user];
//       }
//     }
//   }
//   return false;
// };
// const urlsForUser = (name, database) => {
//   let userUrls = {};
//   for (const shortURL in database) {
//     if (database[shortURL].userID === name) {
//       userUrls[shortURL] = database[shortURL];
//     }
//   }
//   return userUrls;
// };

app.get('/urls', (req, res) => {
  const userID = req.session.userID;
  const userUrls = urlsForUser(userID, urlDatabase); //using the newly created urlsForUser 
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

  if (!urlDatabase[shortURL]) {
    const error = 'This short URL does not exist.';
    res.send(error)
  } else if (!userID || !userUrls[shortURL]) {
    const error = 'You are not authorized to see this URL.';
    res.send(error)
  } else {
    res.render('urls_show', templateVars);
  }
});

app.post('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;

  if (req.session.userID && req.session.userID === urlDatabase[shortURL].userID) {
    urlDatabase[shortURL].longURL = req.body.longURL;
    res.redirect(`/urls`);
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
    res.redirect('/urls');
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
    res.redirect('/urls');
  } else {
    res.send('Please enter a valid Email & Password combination!')
  }
});

app.post('/logout', (req, res) => { //mentor said to add seesion.sig 
  res.clearCookie('session');
  res.clearCookie('session.sig');
  res.redirect('/urls');
});

app.get('/register', (req, res) => {
  if (req.session.userID) {
    return res.redirect('/urls');
  }
  const templateVars = { user: users[req.session.userID] };
  res.render('urls_registration', templateVars);
});

// const registrationRedirect = (email, password) => {
//   if (email === "" || password === "") {
//     return false;
//   }
//   return true;
// }
app.post('/register', (req, res) => {
  if (req.body.email && req.body.password) {
    if (!getUserByEmail(req.body.email, users)) {
      const userID = generateRandomString();
      users[userID] = {
        userID: userID,
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password, 10) //using 10 to cycle through the encryption 10 times 
      };
      // console.log(users[userID].password)
      req.session.userID = userID;
      res.redirect('/urls');
    } else {
      res.send('Please enter a NEW Email & Password combination!')
      res.redirect('/urls');
    }
  } else {
    res.send('Please enter a Valid Email & Password combination!')
  }
});

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});