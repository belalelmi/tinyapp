const getUserByEmail = (email, database) => {
  if (database) {   //CHECK TO SEE IF THE DATABASE EXISTS// 
    for (const user in database) {
      if (database[user].email === email) {
        return database[user];
      }
    }
  }
  return undefined;
};

const urlsForUser = (name, database) => {
  let userUrls = {};
  for (const shortURL in database) {
    if (database[shortURL].userID === name) {
      userUrls[shortURL] = database[shortURL];
    }
  }
  return userUrls;
};

module.exports = {
  getUserByEmail,
  urlsForUser
}
