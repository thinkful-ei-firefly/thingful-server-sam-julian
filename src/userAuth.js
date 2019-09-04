const bcrypt = require('bcrypt')

function requireAuth(req, res, next) {
  const authToken = req.get('Authorization') || ''

  if (!authToken.toLowerCase().startsWith('basic ')) {
    return res.status(401).json({error: 'Missing basic token'})
  }

  const basicToken = authToken.slice('basic '.length, authToken.length);

  const [token_username, token_password] = Buffer
    .from(basicToken, 'base64')
    .toString()
    .split(':')

  if (!token_username || !token_password) {
    return res.status(401).json({error: 'Unauthorized request (no username/password)'})
  }

  req.app.get('db')('thingful_users')
    .where({user_name: token_username})
    .first()
    .then(user => {
      if (!user) {
        return res.status(401).json({error: 'Unauthorized request(no user match or wrong password)'})
      }
      return bcrypt.compare(token_password, user.password)
        .then(match => {
          if (!match) {
            return res.status(401).json({error: 'Unauthorized request'})
          }
          req.user = user
          next()
        })
      
      
    })
    .catch(next)
}


module.exports = requireAuth