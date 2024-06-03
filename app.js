const { hashSync } = require('bcrypt');
const express = require('express');
const app = express();
const bodyParser = require('body-parser')
const { UserModel, DoctorModel ,AppointmentModel } = require('./config/database');
const session = require('express-session')
const MongoStore = require('connect-mongo');
const passport = require('passport');


app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({ mongoUrl: 'mongodb+srv://ayaan:abcd@cluster0.idzcx6c.mongodb.net/Vihaan', collectionName: "sessions" }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24
    }
}))

require('./config/passport');
require('./config/passport-google');


app.use(passport.initialize())
app.use(passport.session())

app.get('/',(req,res)=>{
    res.render("index")
})

app.get('/login', (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect("dashboard",{ user : req.user })
    } else {
        res.render("login")
    }
})

app.get('/register', (req, res) => {
    res.render('register')
})

app.get('/register-doctor', (req, res) => {
    res.render('register-doctor')
})

app.post('/login', passport.authenticate('local', { successRedirect: 'dashboard' }))

app.post('/register', (req, res) => {
    
    let user = new UserModel({
        username: req.body.username,
        password: hashSync(req.body.password, 10)
    })

    user.save().then(user => console.log(user));

    res.send({ success: true })
})

app.post('/registerdoctor', (req, res) => {
    
    let user = new DoctorModel({
        username: req.body.username,
        name: req.body.name,
        department: req.body.department,
        password: hashSync(req.body.password, 10)
    })

    user.save().then(user => console.log(user));

    res.send({ success: true })
})

app.get('/logout', (req, res) => {
    req.logout()
    res.redirect('/login')
})



app.get('/auth/google',
    passport.authenticate('google',{scope: ["email", "profile"]}));

app.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        
        res.redirect('/');
    });

    app.get("/doctors", async (req, res) => {
        try {
            // Query all doctors from the database
            const doctors = await DoctorModel.find({});
    
            // Render the "doctor" view and pass the retrieved doctors data to the view
            res.render("doctor", { doctors: doctors });
        } catch (err) {
            // Handle any errors that occur during the process
            console.error(err);
            // Optionally, send an error response to the client
            res.status(500).send("An error occurred while fetching doctors.");
        }
    });
    

app.get("/appointment",(req,res)=>{
    if (req.isAuthenticated()) {
        const doctorUsername=req.query.variableName;
        res.render("appointment",{ user : req.user, doctorUsername: doctorUsername })
    } else {
        res.render("login")
    }
})

app.get("/dashboard", async (req, res) => {
    try {
        const user = req.user.username; 
        const appointmentDetails = await AppointmentModel.find({ patient: req.user.username });
        const doctorDetails= await DoctorModel.find({});
        res.render("dashboard", { user: req.user, appt: appointmentDetails, doctors: doctorDetails }); // Render the "dashboard" view with user and appointment details
    } catch (err) {
        console.error(err); 
        res.status(500).send("Internal Server Error"); 
    }
});



app.post('/appointment', async (req, res) => {
    try {
        
       

        let appointment = new AppointmentModel({
            patient: req.user.username,
            doctor: req.body.variableName,
            date: req.body.date,
            time: req.body.time,
            roomId: req.body.name
        });

        const savedAppointment = await appointment.save();
    
        res.status(201).json(savedAppointment);
    } catch (error) {
        console.error("Error saving appointment:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});




app.listen(1000, (req, res) => {
    console.log("Listening to port 1000");
})