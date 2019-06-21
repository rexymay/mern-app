const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator/check');
 
// @route POST api/users
// @desc Register/Add User
// @access Public
router.post('/', 
    [
        // check name
        check('name', 'Name is required').not().isEmpty(),
        // validate email
        check('email', 'Please include a valid email').isEmail(),
        // password must be at least 6 chars long
        check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
    ],
    async (req, res) => {
        console.log('calling api/users');
        console.log(req.body);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(200).json({ errors: errors.array() });
        }

        const { name, email, password } = req.body;

        try {
            let user = await User.findOne({ email });
            // See if user exist
            if(user){
                console.log('Error: User already exists');
                return res.status(200).json({ errors: [{ msg: 'User already exist' }] }); 
            }

            // Get user gravatar
            const avatar = gravatar.url(email, {
                s: '200',
                r: 'pg',
                d: 'mm'
            });
            console.log('Avatar: '+avatar);

            // create a new instance of User to save it later to mongoDB
            user = new User({
                name,
                email,
                avatar,
                password
            });

            // Encrypt password using bcryptjs
            const salt = await bcrypt.genSalt(10);
            console.log('Salt: ' + salt);
            user.password = await bcrypt.hash(password, salt);
            console.log('Password: '+user.password);
            await user.save(); // save User data to mongoDB

            
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
                    return res.status(200).json({ token });
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