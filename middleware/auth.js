const jwt = require('jsonwebtoken');
const config = require('config');

// Note: middleware is a function that has access to request and response object and callback function next

module.exports = function(req, res, next)
{
    // Get token from header
    const token = req.header('x-auth-token');

    // Check if not token
    if(!token){
        return res.status(401).json({ msg: 'No token, access denied'});
    }

    // Verify token
    try { 
        const decoded = jwt.verify(token, config.get('jwtSecret'));
        console.log(decoded);
        req.user = decoded.user;
        next();
    }
    catch (err) {
        res.status(401).json({ msg: 'Invalid token'});
    }
}