const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const session = require('express-session');
const MongoClient = require('mongodb').MongoClient;


const app = express();
const pdf = require('html-pdf');
const fs = require('fs');
app.set('view engine', 'ejs');
const port = 4700;

app.use(session({
  secret: 'your-secret-key',
  resave: true,
  saveUninitialized: true,
  expires: 60 * 60 * 24 // 1 day
}));

app.use(express.static('public'));

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.json());
// Connect to MongoDB
mongoose
  .connect('mongodb+srv://PriyaM:20090808@project.wnklnxs.mongodb.net/test0', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });

  function isAuthenticated(req, res, next) {
    const allowedRoutes = ['/edctn.html', '/exp.html', '/skill.html' , '/education/add', '/experience/add',
    '/skill/add'];

  if (req.session.user && req.session.user.email) {
    // User is authenticated, proceed to the next middleware or route handler
    next();
  } else {
    // User is not authenticated, redirect to the login page
    res.redirect('/login');
  }
}


// Create a schema for the User collection
const userSchema = new mongoose.Schema({
  email: { type: String, required: true },
  password: { type: String, required: true },
});

// Create the User model based on the userSchema
const User = mongoose.model('User', userSchema);

// Create a schema for the form data
const formDataSchema = new mongoose.Schema({
  name: String,
  email: String,
  dob: String,
  phoneno: String,
  program: String,
  course: String,
  password: String,
  gender: String,
  address1: String,
  address2: String,
  address3: String,
  usn: String,
});

// Create a model for the form data
const FormData = mongoose.model('FormData', formDataSchema);

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the "public" directory
app.use(express.static('public'));

// Route for the profile page
app.get('/profile', async (req, res) => {
  try {
    // Check if the user is logged in (has a session)
    if (!req.session.user || !req.session.user.email) {
      // Redirect to the login page if the user is not logged in
      return res.redirect('/login');
    }

    const userEmail = req.session.user.email;

    // Find the user's data using the email
    const formData = await FormData.findOne({ email: userEmail }).lean();

    if (!formData) {
      // Handle the case where the user's data is not found in the database
      return res.status(404).send('User data not found.');
    }

    res.render('profile', { formData });
  } catch (error) {
    console.error('Error retrieving form data:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Route for rendering the profile page without login check
app.get('/view-profile', async (req, res) => {
  try {
    // Check if the user is logged in (has a session)
    if (req.session.user && req.session.user.email) {
      const userEmail = req.session.user.email;

      // Find the user's data using the email
      const formData = await FormData.findOne({ email: userEmail }).lean();

      if (!formData) {
        // Handle the case where the user's data is not found in the database
        return res.status(404).send('User data not found.');
      }

      return res.render('profile', { formData });
    }

    // If user is not logged in, redirect to the login page
    return res.redirect('/login');
  } catch (error) {
    console.error('Error retrieving form data:', error);
    res.status(500).send('Internal Server Error');
  }
});


// Route for the form submission
app.post('/submit', async (req, res) => {
  const { name, email, dob, phoneno, program, course, password, gender, address1, address2, address3, usn } = req.body;

  try {
    // Create a new form data document
    const newFormData = new FormData({
      name,
      email,
      dob,
      phoneno,
      program,
      course,
      password,
      gender,
      address1,
      address2,
      address3,
      usn
    });

    // Save the form data to the database
    await newFormData.save();

    res.redirect('edctn.html'); // Redirect to profile page after successful form submission
  } catch (error) {
    console.error('Error saving form data:', error);
    res.send(`
      <script>
        alert("An error occurred while saving the form data. Please try again.");
        window.history.back();
      </script>
    `);
  }
});



// Route for the sign-up page
app.get('/signup', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Route for the sign-up form submission
app.post('/signup', async (req, res) => {
  const { name, email, dob, phoneno, program, course, password, gender, address1, address2, address3, usn } = req.body;

  try {
    // Create a new form data document
    const newFormData = new FormData({
      name,
      email,
      dob,
      phoneno,
      program,
      course,
      password,
      gender,
      address1,
      address2,
      address3,
      usn
      
    });

    console.log('Session before saving:', req.session);
    req.session.user = { email };
    console.log('Session after saving:', req.session);
    

    // Save the form data to the database
    await newFormData.save();

    res.redirect('edctn.html'); // Redirect to the login page after successful sign-up
  } catch (error) {
    console.error('Error saving form data:', error);
    res.send(`
      <script>
        alert("An error occurred while saving the form data. Please try again.");
        window.history.back();
      </script>
    `);
  }
});

// Route for the edctn.html page (accessible without authentication)
app.get('/edctn.html', (req, res) => {
  const userEmail = req.session.user.email;
  res.sendFile(__dirname + '/public/edctn.html');
});

// Route for the exp.html page
app.get('/exp.html', (req, res) => {
  const userEmail = req.session.user.email;
  res.sendFile(__dirname + '/public/exp.html');
});

// Route for the skill.html page
app.get('/skill.html', (req, res) => {
  const userEmail = req.session.user.email;
  res.sendFile(__dirname + '/public/skill.html');
});

// Route for the login page
app.get('/login', (req, res) => {
  res.render('login', { error: null, email: '', password: '' });
});

// Route for the login form submission
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find the user with the matching email and password
    const foundUser = await FormData.findOne({ email, password }).lean();

    if (foundUser) {
      req.session.user = { email: foundUser.email }; // Set the email in the session
      res.render('profile', { formData: foundUser });
      console.log('Session data set:', req.session.user); // Add this line for debugging
    } else {
      res.render('login', { error: 'Invalid email or password', email, password });
    }
  } catch (error) {
    console.error('Error retrieving user data:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Route for logout
app.get('/logout', (req, res) => {
  // Perform logout actions if necessary

  // Redirect to the login page after logout
  res.redirect('/login');
});

// Route for updating the profile fields
app.post('/update-profile', isAuthenticated, async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.email) {
      res.status(401).send('Unauthorized');
      return;
    }

    const { email } = req.session.user;

    // Get the updated form data from the POST request
    const { name, dob, phoneno, program, course } = req.body;

    // Update the user's data in the database
    await FormData.findOneAndUpdate(
      { email },
      { $set: { name, dob, phoneno, program, course } },
      { new: true }
    );

    // Redirect to the updated profile page
    res.redirect('/public/edit.html');
  } catch (error) {
    console.error('Error updating form data:', error);
    res.status(500).send('Internal Server Error: ' + error.message);
  }
});


app.get('/edprof', isAuthenticated, async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.email) {
      res.status(401).send('Unauthorized');
      return;
    }

    const { email } = req.session.user;
    const formData = await FormData.findOne({ email }).lean();

    if (formData) {
      // Define the course names for UG and PG programs
      const courses = {
        UG: [
          "Artificial Intelligence and Data Science",
          "Artificial Intelligence and Machine Learning",
          "Biotechnology Engineering",
          "Civil Engineering",
          "Computer and Communication Engineering",
          "Computer Science Engineering",
          "Electronics and Communication Engineering",
          "Electrical and Electronics Engineering",
          "Information Science Engineering",
          "Mechanical Engineering",
          "Robotics and Artificial Intelligence"
        ],
        PG: [
          "Construction Technology",
          "Computer Science Engineering",
          "Cyber Security",
          "Electric Vehicle Technology",
          "Structural Engineering",
          "Machine Design",
          "VLSI and Embedded System",
          "MCA"
        ]
      };

      res.render('edprof', { formData, courses });
    } else {
      res.status(404).send('Profile not found');
    }
  } catch (error) {
    console.error('Error retrieving form data:', error);
    res.status(500).send('Internal Server Error: ' + error.message);
  }
});

const educationSchema = new mongoose.Schema({
  userId: String,
  tenSchool: String,
  tenPercentage: String,
  twSchool: String,
  twPercentage: String,
  degreeUniversity: String,
  degreeCgpa: String
});

// Create the Education model
const Education = mongoose.model('Education', educationSchema);

app.post('/education/add', async (req, res) => {
  try {
    const userEmail = req.session.user.email;
    const { tenSchool, tenPercentage, twSchool, twPercentage, degreeUniversity, degreeCgpa } = req.body;
    const education = new Education({
      userId: userEmail,
      tenSchool,
      tenPercentage,
      twSchool,
      twPercentage,
      degreeUniversity,
      degreeCgpa
    });

    // Save the education data to the MongoDB database
    await education.save();

    // Log the education data saved with the email
    console.log('Education data saved for user:', userEmail, education);

    res.redirect('/exp.html'); // Redirect to exp.html after successful form submission
  } catch (error) {
    console.error('Error saving education data:', error);
    res.send(`
      <script>
        alert("An error occurred while saving the education data. Please try again.");
        window.history.back();
      </script>
    `);
  }
});


app.get('/education/view', isAuthenticated, async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.email) {
      res.status(401).send('Unauthorized');
      return;
    }

    const userEmail = req.session.user.email;
        console.log('User email:', userEmail);
    const educationData = await Education.find({ userId: req.session.user.email }).lean(); // Debugging line
    console.log('Education data:', educationData);

    // Render the 'education.ejs' page and pass the educationData to display on the page
    res.render('education', { educationData });
  } catch (error) {
    console.error('Error retrieving education data:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Route to view and edit education data
app.get('/education/edit', isAuthenticated, async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.email) {
      res.status(401).send('Unauthorized');
      return;
    }

    // Fetch education data for the logged-in user
    const userEmail = req.session.user.email;
    const educationData = await Education.findOne({ userId: userEmail }).lean();

    if (educationData) {
      // Render the 'education-edit.ejs' page and pass the educationData for editing
      res.render('ededu', { educationData });
    } else {
      // Handle the case where education data is not found
      res.status(404).send('Education data not found');
    }
  } catch (error) {
    console.error('Error retrieving education data:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Route for updating education data
app.post('/education/update', isAuthenticated, async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.email) {
      res.status(401).send('Unauthorized');
      return;
    }

    const { email } = req.session.user;

    // Get the updated education data from the POST request
    const { tenSchool, tenPercentage, twSchool, twPercentage, degreeUniversity, degreeCgpa } = req.body;

    // Update the user's education data in the database based on their userId
    const updatedEducation = await Education.findOneAndUpdate(
      { userId: email }, // Use userId instead of email
      { $set: { tenSchool, tenPercentage, twSchool, twPercentage, degreeUniversity, degreeCgpa } },
      { new: true }
    );

    if (!updatedEducation) {
      // Handle the case where no education data was found for the user
      res.status(404).send('Education data not found');
      return;
    }

    // Redirect to the updated education page (you can change the route as needed)
    res.redirect('/public/edit.html');
  } catch (error) {
    console.error('Error updating education data:', error);
    res.status(500).send('Internal Server Error: ' + error.message);
  }
});

app.get('/ededu', isAuthenticated, async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.email) {
      res.status(401).send('Unauthorized');
      return;
    }

    const { email } = req.session.user;
    console.log('User email:', req.session.user.email);
    const educationData = await Education.findOne({ email }).lean();
    console.log('Education data:', educationData);

    if (educationData) {
      // Render the 'ededu.ejs' page and pass the educationData to display in the page
      res.render('ededu', { educationData });
    } else {
      res.status(404).send('Education data not found');
    }
  } catch (error) {
    console.error('Error retrieving education data:', error);
    res.status(500).send('Internal Server Error: ' + error.message);
  }
});


const experienceSchema = new mongoose.Schema({
  userId: String,
  experiences: [
    {
      company: String,
      position: String,
      startDate: Date,
      endDate: Date
    }
  ]
});

const Experience = mongoose.model('Experience', experienceSchema);

// Route to add experiences
app.post('/experience-add', async (req, res) => {
  try {
    const userEmail = req.session.user.email;
    const { experiences } = req.body;

    const experienceObjects = experiences.map(experience => ({
      company: experience.company,
      position: experience.position,
      startDate: experience.startDate,
      endDate: experience.endDate
    }));

    const newExperience = new Experience({ userId: userEmail, experiences: experienceObjects });

    await newExperience.save();

    console.log('Experience data saved for user:', userEmail, newExperience);

    res.redirect('/skill.html'); 
  } catch (error) {
    console.error('Error saving experience data:', error);
    res.status(500).json({ error: "An error occurred while saving the experience data. Please try again." });
  }
});

app.get('/workexp', async (req, res) => {
  try {
    // Check if the user is logged in
    if (!req.session.user || !req.session.user.email) {
      return res.redirect('/login');
    }

    const userEmail = req.session.user.email;

    const experienceData = await Experience.findOne({ userId: userEmail }).lean();

    res.render('work', { experienceData }); // Render 'work.html' template
  } catch (error) {
    console.error('Error retrieving work experience data:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Route to update a specific experience
app.post('/experience/update', isAuthenticated, async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.email) {
      res.status(401).send('Unauthorized');
      return;
    }

    const { email } = req.session.user;
    const { company, position, startDate, endDate, expId } = req.body; // Include expId in the request body

    await Experience.findOneAndUpdate(
      { userId: email, 'experiences._id': expId }, // Use expId to filter the experience to update
      {
        $set: {
          'experiences.$.company': company,
          'experiences.$.position': position,
          'experiences.$.startDate': startDate,
          'experiences.$.endDate': endDate,
        },
      },
      { new: true }
    );

    res.redirect('/public/edit.html');
  } catch (error) {
    console.error('Error updating experience data:', error);
    res.status(500).send('Internal Server Error: ' + error.message);
  }
});

app.get('/workexp/edit', isAuthenticated, async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.email) {
      res.status(401).send('Unauthorized');
      return;
    }

    // Fetch work experience data for the logged-in user
    const userEmail = req.session.user.email;
    const experienceData = await Experience.findOne({ userId: userEmail }).lean();

    if (experienceData) {
      // Render the 'edexp.ejs' page and pass the experienceData for editing
      res.render('edexp', { experienceData }); // Render 'edexp.html' template
    } else {
      // Handle the case where work experience data is not found
      res.status(404).send('Work experience data not found');
    }
  } catch (error) {
    console.error('Error retrieving work experience data:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Route for updating work exp data
app.post('/workexp/update', isAuthenticated, async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.email) {
      res.status(401).send('Unauthorized');
      return;
    }

    const { email } = req.session.user;

    // Get the updated work experience data from the POST request
    const { company, position, startDate, endDate } = req.body;

    // Update the user's work experience data in the database based on their userId
    const updatedExperience = await Experience.findOneAndUpdate(
      { userId: email }, // Use userId instead of email
      { $set: { company, position, startDate, endDate } },
      { new: true }
    );

    if (!updatedExperience) {
      // Handle the case where no work experience data was found for the user
      res.status(404).send('Work experience data not found');
      return;
    }

    // Redirect to the updated work experience page (you can change the route as needed)
    res.redirect('/workexp/view');
  } catch (error) {
    console.error('Error updating work experience data:', error);
    res.status(500).send('Internal Server Error: ' + error.message);
  }
});


const skillSchema = new mongoose.Schema({
  userId: String,
  name: [String],
});

const Skill = mongoose.model('Skill', skillSchema);

module.exports = Skill;

app.post("/skill/add", async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.email) {
      res.status(401).send('Unauthorized');
      return;
    }

    const { email } = req.session.user;
    const { skills } = req.body; 

    let userSkills = await Skill.findOne({ userId: email });

    if (!userSkills) {
      userSkills = new Skill({ userId: email, name: [] });
    }

    userSkills.name = userSkills.name.concat(skills);

    await userSkills.save();

    console.log('Skill data saved for user:', email, userSkills);

        res.json({ success: true });
      } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ success: false, message: error.message });
      }
    });



// Route to display all skills from the database
app.get('/skill/view', async (req, res) => {
  try {
    const userEmail = req.session.user.email;
       // Fetch skills data for the logged-in user
       const skillsData = await Skill.find({ userId: userEmail }).lean();

      console.log('Skills fetched successfully:', skillsData);
      // Render the 'skill.ejs' page and pass the skillsData to display in the page
      res.render('skill', { skillsData });
  } catch (error) {
      console.error('Error retrieving skill data:', error);
      res.status(500).send('Internal Server Error');
  }
});

app.get("/edskill", async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.email) {
      res.status(401).send('Unauthorized');
      return;
    }

    const { email } = req.session.user;

    // Find the user's skill document by email
    const userSkills = await Skill.findOne({ userId: email });

    if (!userSkills) {
      // Handle the case where the user's skills document doesn't exist
      // You can create an empty skills document here if needed
      res.status(404).send('Skills not found');
      return;
    }

    // Render the 'edskill.ejs' template with the user's skills for editing
    res.render('edskill', { skillsData: userSkills }); // Pass userSkills to the template
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
});


app.post('/skill/update', isAuthenticated, async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.email) {
      res.status(401).send('Unauthorized');
      return;
    }

    const { email } = req.session.user;

    // Get the updated skills data from the POST request
    const { skill } = req.body;

    // Update the user's skills data in the database using 'userId' as the filter
    await Skill.findOneAndUpdate(
      { userId: email }, // Use 'userId' to filter
      { $set: { name: skill } }, // Use $set to replace the existing skills with the new ones
      { new: true }
    );

    // Redirect to the updated skill page
    res.redirect('/public/edit.html'); // Adjust the redirection as needed
  } catch (error) {
    console.error('Error updating skills data:', error);
    res.status(500).send('Internal Server Error: ' + error.message);
  }
});

// Route for serving the edit.html file
app.get('/public/edit.html', (req, res) => {
  res.sendFile(__dirname + '/public/edit.html');
});
 
    app.get('/resume', isAuthenticated, async (req, res) => {
     try {
    if (!req.session.user || !req.session.user.email) {
      res.status(401).send('Unauthorized');
      return;
    }

    const userEmail = req.session.user.email;
        const experienceData = await Experience.findOne({ userId: userEmail }).lean();

        if (experienceData && experienceData.experiences) {
          // Ensure experienceData is an array of experiences
          const experiences = experienceData.experiences;
    
          // Fetch data for other resume sections (profile, education, skills)
          const formData = await FormData.findOne({ email: userEmail }).lean();
          const educationData = await Education.find({ userId: userEmail }).lean();
          const skillsData = await Skill.find({ userId: userEmail }).lean();
    
          // Render the 'resume.ejs' template with all the data
          res.render('resume', { formData, educationData, experienceData, skillsData });
        } else {
          res.status(404).send('Experience data not found');
        }
      } catch (error) {
        console.error('Error retrieving resume data:', error);
        res.status(500).send('Internal Server Error');
      }
    });


app.get('/resume/pdf', isAuthenticated, (req, res) => {
      try {
        // Read the content of your resume.ejs file
        const resumeHtml = fs.readFileSync('views/resume.ejs', 'utf8');
        
        // Options for PDF generation (you can customize these)
        const pdfOptions = { format: 'Letter' };
    
        // Generate the PDF
        pdf.create(resumeHtml, pdfOptions).toStream((err, stream) => {
          if (err) {
            console.error('Error generating PDF:', err);
            res.status(500).send('Internal Server Error');
            return;
          }
    
          // Set the response headers for PDF download
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', 'attachment; filename=resume.pdf');
    
          // Pipe the PDF stream to the response
          stream.pipe(res);
        });
      } catch (error) {
        console.error('Error reading resume.ejs file:', error);
        res.status(500).send('Internal Server Error');
      }
    });
    

// Start the server
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

