// routes/userRoutes.js
const express = require('express');
const dotenv = require('dotenv');
const { google } = require('googleapis');
const nodemailer = require('nodemailer');



// Create OAuth2 client with credentials
const oAuth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
);


// Set credentials with the refresh token
oAuth2Client.setCredentials({
    refresh_token: process.env.REFRESH_TOKEN
});

// Function to send email
async function sendEmail(to, subject, text) {
    try {
        const accessToken = await oAuth2Client.getAccessToken();

        const transporter = nodemailer.createTransport({
            service:'gmail',
            auth: {
                type: 'OAuth2',
                user: process.env.EMAIL_USER,
                clientId: process.env.CLIENT_ID,
                clientSecret: process.env.CLIENT_SECRET,
                refreshToken: process.env.REFRESH_TOKEN,
                accessToken: accessToken.token
            }
        });

        const mailOptions = {
            from: `"BlogNow" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text
        };

        await transporter.sendMail(mailOptions);
        // console.log('Email sent successfully:', result);
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

module.exports = function(db) {
  const router = express.Router();

  // Add a new user
  router.post('/storeUser', async (req, res) => {
    try {
      const { userMail, authorName, OTP, authType } = req.body;
      
      // Check if userMail is already in use
      const existingUser = await db.collection('users').findOne({ userMail });
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }

      const user = { userMail, authorName, OTP, authType };
      const result = await db.collection('users').insertOne(user);
      res.status(201).json({ _id: result.insertedId, ...user });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Fetch user details by userMail
  router.post('/fetchUser', async (req, res) => {
    try {
      const { userMail } = req.body;
      const user = await db.collection('users').findOne({ userMail });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

    // Route to send OTP to email
    router.post('/sendOTP', async (req, res) => {
        const { email, OTP } = req.body;
        try {
            // Send OTP via email
            await sendEmail(email, 'Your OTP Code', `Your OTP code is ${OTP}`);
            return res.status(200).json({ message: 'OTP sent successfully', OTP });
        } catch (err) {
            console.error('Error occurred while sending OTP:', err);
            res.status(500).json({ message: 'Server error', error: err.message });
        }
    });

    router.put('/updateAuthorName', async (req, res) => {
      try {
          const { userMail, authorName } = req.body;
          const updatedUser = await db.collection('users').findOneAndUpdate(
              { userMail },
              { $set: { authorName } },
              { returnDocument: 'after' }
          );
  
          if (!updatedUser.value) {
              return res.status(404).json({ error: "User not found" });
          }
  
          res.json(updatedUser.value);
      } catch (error) {
          res.status(500).json({ error: error.message });
      }
  });
  

  return router;
};

