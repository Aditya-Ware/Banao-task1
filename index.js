const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const path = require('path')
const dotenv = require("dotenv");

require('dotenv').config({ path: 'new.env' });
 
const app = express();

// Connect to MongoDB
async function connectToDatabase() {
   try {
       await mongoose.connect(process.env.MONGO_CONNECT);
       console.log("Database connected");
   } catch (error) {
       console.error("Error connecting to the database:", error);
       process.exit(1); 
   }
}


connectToDatabase();
app.set('views', path.join(__dirname, './')); 
// model and schema
const User = mongoose.model('User', {
 email: String,
 username: String,
 password: String,
});



app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.set('view engine', 'ejs');

app.get('/', (req,res)=>{
 res.render('demo.ejs')
})

//  registration
app.post('/', async (req, res) => {
 try {
    const { email, username, password } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(409).json({ message: 'Login successful' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // user created
    const newUser = new User({ email, username, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'User profile created' });
 } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Sorry for inconvienece please try again !' });
 }
});

//  login
app.post('/login', async (req, res) => {
 try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Please check entered details' });
    }

    
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Please check entered details' });
    }

    res.status(200).json({ message: 'Login successful' });
 } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Sorry for inconvienece please try again !' });
 }
});

app.get('/forget-password',(req,res)=>{
 res.render('forgot.ejs')
})

// Forget password
app.post('/forget-password', async (req, res) => {
 const { email } = req.body;

 
 const user = await User.findOne({ email });

 if (!user) {
    return res.send('Email not found');
 } else {
   
    res.redirect(`/update?email=${encodeURIComponent(email)}`);
 }
});

// reset password 
app.get('/update', (req, res) => {
 
 const email = req.query.email;

 
 res.render('reset.ejs', { email });
});

// password update
app.post('/update', async (req, res) => {
 const email = req.body.email;
 const newPassword = req.body.newPassword;

 // Update the password in the database
 await User.updateOne({ email }, { $set: { password: newPassword } });

 res.send('Password updated successfully');
});

const PORT = process.env.PORT ;
app.listen(PORT, () => {
 console.log(`Server started on port ${PORT}`);
});
