# -CCAPDEV-MCO

Description:
    A web application built using **Node.js**, **Express**, and **MongoDB** for managing posts, comments, and user interactions. This project is designed to showcase features like user authentication, post creation, following different user profiles, and voting functionality.

Features
- **User Authentication**: Register, login, and manage user profiles.
- **Post Management**: Create, edit, and delete posts.
- **Follower/Following Feature**: Follow other user profiles.
- **Voting System**: Like and dislike posts and comments.
- **Popular Tags**: Display tags based on their usage frequency.
- **Responsive Design**: Optimized for both desktop and mobile devices.

Technologies Used
- **Backend**: Node.js, Express.js
- **Frontend**: Handlebars.js (Express Handlebars)
- **Database**: MongoDB (Mongoose ODM)
- **Session Management**: Express-Session, MongoDB Session Store
- **Password Hashing**: Argon2

Steps
1. Clone the Repository 
    git clone https://github.com/NarutoJJFF/-CCAPDEV-MCO.git
    cd -CCAPDEV-MCO

2. Install Dependencies
    npm install -y

3. Set Up Environment Variables
    Create a .env file in the root directory and add the following:
        PORT=3000
        MONGO_URI=your-mongodb-connection-string
        SESSION_SECRET=your-session-secret

4. Start the Mongoose Server
    npm i express express-handlebars body-parser mongoose

5. Run the Application
    node app.js

6. Access the Application
    Open your browswer and navigate to: http://localhost:3000