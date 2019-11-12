const express = require("express");
const brycpt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");

const router = express.Router();

const { check, validationResult } = require("express-validator");

const User = require("../models/User");

// @route       POST api/users
// @desc        Register a user
// @access      Public

router.post(
	"/",
	[
		// Check Name is added
		check("name", "Please add name")
			.not()
			.isEmpty(),
		// Check if email is valid
		check("email", "Please add valid email").isEmail(),
		// Check if password is less than 6 character
		check("password", "Please add password greater than 6").isLength({ min: 6 })
	],
	async (req, res) => {
		// Finds the validation errors in this request and wraps them in an object with handy function
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		// Grab name, email, password from user Input.
		const { name, email, password } = req.body;

		try {
			let user = await User.findOne({ email });
			if (user) {
				return res.status(400).json({ msg: "User already exists !" });
			}
			user = new User({
				name,
				email,
				password
			});

			const salt = await brycpt.genSalt(10);
			user.password = await brycpt.hash(password, salt);

			await user.save();

			const payload = {
				user: {
					id: user.id
				}
			};

			jwt.sign(
				payload,
				config.get("jwtSecret"),
				{
					expiresIn: 360000
				},
				(err, token) => {
					if (err) throw err;
					res.json({ token });
				}
			);

		} catch (error) {
			console.log(error.message);
			res.status(500).send("Server Error");
		}
	}
);

module.exports = router;
