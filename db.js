//draft of data model
const mongoose = require('mongoose');
const URLSlugs = require('mongoose-url-slugs');
const passportLocalMongoose = require('passport-local-mongoose');
//each day with the meals and goals
const daySchema = new mongoose.Schema({
    //first day of week monday
    week: String,
    date: String,
    breakfast: String,
    lunch:  String,
    dinner: String,
    snack: String,
    goals: String, //list of daily exercise or water goals
    filter: String,
    difficulty: String,
    goalCompleted: Boolean
});

//week
const weekSchema = new mongoose.Schema({
    userID:  { type: mongoose.Schema.Types.ObjectId, ref: 'userSchema' },
    week: String,
    //start_date: String, //should begin on a Monday
    //end_date: String, //should end on a Sunday
    days: [daySchema]
});

//user
const userSchema = new mongoose.Schema({
    username: String,
    password: String
});

weekSchema.plugin(URLSlugs('week'));
userSchema.plugin(passportLocalMongoose);

mongoose.model("User", userSchema);
mongoose.model("Week", weekSchema);
mongoose.model("Day", daySchema);

//process.env.MONGODB_URI for deployed site on heroku
const uristring = process.env.MONGODB_URI || 'mongodb://localhost/final';
mongoose.connect(uristring);