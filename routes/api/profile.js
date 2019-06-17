const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator/check');
// Middleware
const auth = require('../../middleware/auth');
// Include Models
const Profile = require('../../models/Profile');
const User = require('../../models/User');

// @route GET api/profile/me
// @desc  Get current user profile
// @access Private
router.get('/me', auth, async (req, res) => {
    try {
        console.log('GET api/profile/me');
        const profile = await Profile.findOne({ user: req.user.id }).populate('user',['name','avatar']);

        if(!profile) {
            return res.status(400).json({ msg: 'No profile found for this user with id: '+ req.user.id});
        }

        return res.json(profile); 
    }
    catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route POST api/profile
// @desc  Create or update user profile
// @access Private
router.post(
    '/', 
    [
        auth, 
        [
            check('status', 'Status is required').not().isEmpty(),
            check('skills', 'Skills is required').not().isEmpty() 
        ]
    ], 
    async (req, res) => {
        console.log('POST api/profile');
        console.log(req.body);
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            company,
            website,
            location,
            bio,
            status,
            githubusername,
            skills,
            youtube,
            facebook,
            twitter,
            instagram,
            linkedin
        } = req.body;

        // Build profile object
        const profileFields = {};
        profileFields.user = req.user.id;
        profileFields.skills = "";

        if(company) profileFields.company = company;
        if(website) profileFields.website = website;
        if(location) profileFields.location = location;
        if(bio) profileFields.bio = bio;
        if(status) profileFields.status = status;
        if(githubusername) profileFields.githubusername = githubusername;
        if (skills) {
            profileFields.skills = skills.split(',').map(skill => skill.trim());
            console.log(profileFields.skills);
        }
       
        // Build social object
        profileFields.social = {}
        if(youtube) profileFields.social.youtube = youtube;
        if(twitter) profileFields.social.twitter = twitter;
        if(facebook) profileFields.social.facebook = facebook;
        if(linkedin) profileFields.social.linkedin = linkedin;
        if(instagram) profileFields.social.instagram = instagram;

        try { 
            let profile = await Profile.findOne({ user: req.user.id});
            if(profile)
            {
                console.log('Profile exists');
                // Update
                profile = await Profile.findOneAndUpdate(
                    { user: req.user.id },
                    { $set: profileFields },
                    { new: true } 
                );
                return res.json(profile);
            }
            // Else create profile
            console.log('New profile');
            profile = new Profile(profileFields);
            await profile.save();
            return res.json(profile);
        }
        catch (err) {
            console.error(err.message);
            return res.status(500).send('Server Error');
        }
    }
);

// @route GET api/profile
// @desc  Get all profiles
// @access Public
router.get('/', async (req, res) => {
    try {
        console.log('GET api/profile');
        const profiles = await Profile.find().populate('user', ['name','avatar']);
        return res.json(profiles);
    }
    catch (err) {
        console.error(err.message);
        return res.status(500).send('Server Error');
    }
});

// @route GET api/profile/user/:user_id
// @desc  Get profile by user ID
// @access Public
router.get('/user/:user_id', async (req, res) => {
    let userid = req.params.user_id;
    try {
        console.log('GET api/profile/user/:user_id');
        const profile = await Profile.findOne({ user: userid}).populate('user', ['name','avatar']);
        if(!profile) return res.status(400).json({msg: 'Profile not found for user with ID: '+userid});
        return res.json(profile);
    }
    catch (err) {
        console.error(err.message);
        if(err.kind == "ObjectId"){
            return res.status(400).json({msg: 'Profile not found for user with ID: '+userid});
        }
        return res.status(500).send('Server Error');
    }
});

// @route DELETE api/profile
// @desc  Delete profile, user & posts
// @access Private
router.delete('/', auth, async (req, res) => {
    let userid = req.user.id;
    try {
        console.log('DELETE api/profile');

        // Remove profile
        await Profile.findOneAndRemove({ user: userid});
        // Remove user
        await User.findOneAndRemove({ _id: userid});

        return res.json({msg: 'User & Profile deleted'});
    }
    catch (err) {
        console.error(err.message);
        return res.status(500).send('Server Error');
    }
});

// @route PUT api/profile/experience
// @desc  Add experience
// @access Private
router.put(
    '/experience', 
    [
        auth, 
        [
            check('title', 'Title is required').not().isEmpty(),
            check('company', 'Company is required').not().isEmpty(),
            check('from', 'From date is required').not().isEmpty()  
        ]
    ],
    async (req, res) => 
    {
        console.log(req.body);
        let userid = req.user.id;
        console.log('User ID: '+req.user.id);
        const errors = validationResult(req);
        
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            title,
            company,
            location,
            from,
            to,
            current,
            description
        } = req.body; // extract data submitted by the user (using a form, from the frontend)

        const nexExp = {
            title,
            company,
            location,
            from,
            to,
            current,
            description
        };

        try {
            const profile = await Profile.findOne({ user: userid });
            profile.experience.unshift(nexExp); // unshift means push data at the beginning 
            await profile.save();
            return res.json(profile);
        }
        catch (err) {
            console.error(err.message);
            return res.status(500).send('Server Error');
        }
    }    
);

// @route DELETE api/profile/experience/:exp_id
// @desc  Delete experience from profile
// @access Private
router.delete('/experience/:exp_id', auth, 
    async (req, res) => 
    {
        let userid = req.user.id;
        let expid =  req.params.exp_id;
        console.log('DELETE api/profile/experience/:exp_id');
        console.log('User ID: '+userid);
        console.log('Exp ID: '+expid);

        try {
            // Get profile
            const profile = await Profile.findOne({ user: userid});

            // Get remove index
            const removeIndex = profile.experience.map(item => item.id).indexOf(expid);
            profile.experience.splice(removeIndex, 1);
            
            await profile.save();
            return res.json(profile);
        }
        catch (err) {
            console.error(err.message);
            return res.status(500).send('Server Error');
        }
    }    
);

// @route PUT api/profile/education
// @desc  Add education
// @access Private
router.put(
    '/education', 
    [
        auth, 
        [
            check('school', 'School is required').not().isEmpty(),
            check('degree', 'Degree is required').not().isEmpty(),
            check('fieldofstudy', 'Field of study is required').not().isEmpty(),
            check('from', 'From date is required').not().isEmpty(),
            check('current', 'Current is required').not().isEmpty()
        ]
    ],
    async (req, res) => 
    {
        console.log(req.body);
        let userid = req.user.id;
        console.log('User ID: '+req.user.id);
        const errors = validationResult(req);
        
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            school,
            degree,
            fieldofstudy,
            from,
            current
        } = req.body; // extract education data submitted by the user

        const nexEduc = {
            school,
            degree,
            fieldofstudy,
            from,
            current
        };

        try {
            const profile = await Profile.findOne({ user: userid });
            profile.education.unshift(nexEduc);
            await profile.save();
            return res.json(profile);
        }
        catch (err) {
            console.error(err.message);
            return res.status(500).send('Server Error');
        }
    }    
);

// @route DELETE api/profile/education/:educ_id
// @desc  Delete education from profile
// @access Private
router.delete('/education/:educ_id', auth, 
    async (req, res) => 
    {
        let userid = req.user.id;
        let id =  req.params.educ_id;
        console.log('DELETE api/profile/experience/:educ_id');
        console.log('User ID: '+userid);
        console.log('Educ ID: '+id);

        try {
            // Get profile
            const profile = await Profile.findOne({ user: userid});

            // Get remove index
            const removeIndex = profile.education.map(item => item.id).indexOf(id);
            profile.education.splice(removeIndex, 1);
            
            await profile.save();
            return res.json(profile);
        }
        catch (err) {
            console.error(err.message);
            return res.status(500).send('Server Error');
        }
    }    
);

// @route GET api/profile/github/:username
// @desc  Get user repos from Github
// @access Public

module.exports = router;