//app.js
//import react-dates/lib/css/_datepicker.css;
//import 'react-dates/initialize';
//import { DateRangePicker } from "react-dates";

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const app = express();
const _ = require('lodash');
require('./db');
const Day = mongoose.model('Day');
const Week = mongoose.model('Week');
//bring in handlebars for templating
app.set('view engine', 'hbs');

const publicPath = path.resolve(__dirname, "public");
app.use(express.static(publicPath));

app.use(express.urlencoded({extended: false}));
//express-session
const sessionOptions = { 
	secret: 'secret stuff', 
	saveUninitialized: false, 
	resave: false 
};
app.use(session(sessionOptions));

//set up passport.js
//login and registration don't work yet, returns an error "Cannot set headers after they are sent to the client"
const User = mongoose.model('User');
const passport = require('passport');

const LocalStrategy = require('passport-local').Strategy;
passport.use(new LocalStrategy(User.authenticate()));

//tell passport how to store session
passport.serializeUser(User.serializeUser()/*(user, done) => {
	console.log('Inside serializeUser callback. User id is save to the session file store here')
	done(null, user.id);
}*/);

passport.deserializeUser(User.deserializeUser()/*(id, done) => {
	User.findById(id, function (err, user) {
        done(err, user);
    });
}*/);


app.use(passport.initialize());
app.use(passport.session());

app.get('/login', (req, res) => {
    res.render("login", {user: req.user});
});

app.post('/login',
  passport.authenticate('local', 
  	{ 
		successRedirect: '/',
		failureRedirect: '/register' 
	})
);

app.get('/register', function(req, res) {
	res.render('register');
});

app.post('/register', (req, res) => {
	const username = req.body.username;
	const password = req.body.password;
	User.register(new User({username: username}), password, function(err, user) {
		if (err) {
			const errObj = {message: "USER ALREADY REGISTERED"};
			res.render('register',{message:errObj.message});
		}
		passport.authenticate('local')(req, res, function () {
			res.redirect('/');
		});
   })
}); 

// add req.session.user to every context object for templates
app.use((req, res, next) => {
    res.locals.user = req.user;
    next();
  });

app.get('/', (req, res) => {
	if(req.user) {

		/*Day.find({},function(err,days) {
			res.render("home",{allDays : days, user: req.user});
		})*/
		//all weeks for each user
		Week.find({}, function(err,weeks){
			res.render("home",{allWeeks : weeks, user:req.user});
		})

	}
	else {
		res.render("home");
	}
	
});
app.get('/add', (req, res) => {
	res.render('add',{user: req.user});
});

app.post('/add', (req, res) => {
	Week.findOne({week:req.body.week},(err,thisWeek,count) => {
		if(err) {
			console.log("Error" + err);
		}
		else if(!isNaN(req.body.breakfast) || !isNaN(req.body.lunch) || !isNaN(req.body.dinner) || !isNaN(req.body.snack) ||!isNaN(req.body.goals)) {
			const isNum = {message: "NUMBER INPUTS NOT ALLOWED"};
			res.render('add',{message:isNum.message})
		}
		//if week is already exists in weeks collection
		else if(thisWeek) {
			console.log("week exists");
			new Day ({
				week: req.body.week,
				date: req.body.date,
				breakfast: req.body.breakfast,
				lunch:  req.body.lunch,
				dinner: req.body.dinner,
				snack: req.body.snack,
				goals: req.body.goals,
				difficulty: req.body.difficulty,
				filter: req.body.filter,
				goalCompleted: false
			}).save((err,eachDay,count) => {
			//eachDay is the day submitted in the forms
			//store in weeks embedded document, days
				thisWeek.markModified('days');
				const testDay = {
					week: eachDay.week,
					date: eachDay.date,
					breakfast: eachDay.breakfast,
					lunch: eachDay.lunch,
					dinner: eachDay.dinner,
					snack: eachDay.snack,
					goals: eachDay.goals,
					difficulty: eachDay.difficulty,
					filter: eachDay.filter,
					goalCompleted: false
				};

				//use map? instead of forEach
				if(thisWeek.days.length === 0) {
					thisWeek.days.push(testDay);
				}
				//dont save the same dates, return err message
				for(let i = 0; i < thisWeek.days.length; i++) {
					const firstDate = testDay.date;
					if(!(firstDate === thisWeek.days[i].date)){
						//if not equal push to days array
						thisWeek.days.push(testDay);
					}
					else {
						break;
					}
				}
				
				/*else if(!daysArr.includes(testDay.date)) {
					thisWeek.days.push(testDay);
				}*/
				thisWeek.save(function(saveErr, saveDay, saveCount) {
					//console.log(savePizza);
					res.redirect('/');
				});
			})
		}
		else {
			console.log("new week");
			//save and add to database
			new Week ({
				userID: req.user._id,
				week: req.body.week
			}).save((err,eachWeek,count) => {
				new Day ({
					week: req.body.week,
					date: req.body.date,
					breakfast: req.body.breakfast,
					lunch:  req.body.lunch,
					dinner: req.body.dinner,
					snack: req.body.snack,
					goals: req.body.goals,
					difficulty: req.body.difficulty,
					filter: req.body.filter,
					goalCompleted: false
				}).save((err,eachDay,count) => {
				//eachDay is the day submitted in the forms
				//store in weeks embedded document, days
					eachWeek.markModified('days');
					const testDay = {
						week: eachDay.week,
						date: eachDay.date,
						breakfast: eachDay.breakfast,
						lunch: eachDay.lunch,
						dinner: eachDay.dinner,
						snack: eachDay.snack,
						goals: eachDay.goals,
						difficulty:  eachDay.difficulty,
						filter: eachDay.filter,
						goalCompleted: false
					};
					/*
					if(eachWeek.days.length === 0) {
						eachWeek.days.push(testDay);
					}
					//dont save the same dates, return err message
					for(let i = 0; i < eachWeek.days.length; i++) {
						const firstDate = testDay.date;
						if(!(firstDate === eachWeek.days[i].date)){
							//if not equal push to days array
							eachWeek.days.push(testDay);
						}
						else {
							console.log("it is equal, so don't push");
						}
					
					}*/

					eachWeek.days.push(testDay);
					eachWeek.save(function(saveErr, saveDay, saveCount) {
						res.redirect('/');
					});
				})
			});
		}
	})
});

app.get("/week/:slug", (req, res) => {
    const slug = req.params.slug;
    Week.findOne({slug: slug},function(err,week) {
        User.find({},function(err,users){
            users.forEach(function(user) {
                if(week.userID.equals(user._id)) {
					foodUser = user.username;
                    res.render('week-detail',{eachWeek: week,foodUser : foodUser});
                }
            });
        })
    })
});

app.get('/filter', (req, res) => {
	let result = [];
	Day.find({},function(err,days){	
		const healthy = days.filter(day => day.filter === "healthy");
		const treat = days.filter(day => day.filter === "treat");
		if(req.query.filter === "healthy") {
			result = healthy;
		}
		else if(req.query.filter === "treat") {
			result = treat;
		}
		res.render('filter',{user: req.user,filtered: result});
	})
});


app.get('/goals-difficulty', (req, res) => {
	let result = [];
	Day.find({},function(err,days){	
		const easy = days.filter(day => day.difficulty === "easy");
		const medium= days.filter(day => day.difficulty === "medium");
		const hard = days.filter(day => day.difficulty === "hard");
		if(req.query.difficulty === "easy") {
			result = easy;
		}
		else if(req.query.difficulty === "medium") {
			result = medium;
		}
		else if(req.query.difficulty === "hard") {
			result = hard;
		}
		res.render('goals-difficulty',{user: req.user,difficulties: result});
	})
});

app.get('/logout', (req, res) => {
	req.logout();
	res.redirect('/');
});

const port = process.env.PORT || 3000;
app.listen(port, function() {
    console.log('Our app is running on http://localhost:' + port);
});
console.log('Started server on port 3000');