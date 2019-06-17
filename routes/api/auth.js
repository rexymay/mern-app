const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');
const config = require('config');
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator/check');

// @route GET api/auth
// @desc Test route
// @access Public
router.get('/', auth, async (req, res) => {
    try {
        console.log('Req: '+  req.user);
        const user =  await User.findById(req.user.id).select('-password');
        res.json(user);
    }
    catch (err) {   
        console.error(err.message);
        res.status(500).send('Sever Error');
    }
});

// @route POST api/auth
// @desc Authenticate user & get token / LOGIN
// @access Public
router.post('/', 
    [
        // validation
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Password is required').exists()
    ],
    async (req, res) => {
        console.log('LOGIN: method:POST, route: api/auth');
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
 
        // User request post data (from login form, e.g. username/email & password) 
        const { email, password } = req.body;

        try {
            let user = await User.findOne({ email });
            console.log(user);
            // See if user do not exist
            if(!user){
                console.log('Error: Invalid credentials');
                return res.status(400).json({ errors: [{ msg: 'Error: Invalid credentials' }] }); 
            }

            // Compare user input password to data from mongoDB
            const isMatch = await bcrypt.compare(password, user.password);

            if(!isMatch) {
                return res.status(400).json({ errors: [{ msg: 'Error: Invalid credentials' }] }); 
            }

            // Return jsonwebtoken (for authentication, protected routes)
            const payload = {
                user: {
                    id: user.id
                }
            }

            jwt.sign(
                payload, 
                config.get('jwtSecret'), 
                { expiresIn: 360000 },
                (err, token) => {
                    if(err){
                        console.log('jwt error: '+ err);
                        throw err;
                    } 
                    console.log('jwt token: '+token);
                    return res.json({ token });
                }
            );
        }
        catch {
            console.log(err);
            console.error(err.message);
            res.status(500).send('Server error');
        }
    }
);

module.exports = router;