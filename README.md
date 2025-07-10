# Meeting Room Booker App

A simple and efficient web application for booking meeting rooms in an office environment. Built with a focus on user experience, streamlined scheduling, and capacity management.

## Features

- Book rooms for up to 1 hour  
- Limit of 15 people per room  
- Real-time booking validations  
- Clean and responsive UI  
- Backend built with Node.js and MySQL  

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript  
- **Backend:** Node.js, Express.js  
- **Database:** MySQL (via Aiven)  
- **Deployment:** Render  

## Live Demo

Check out the live app here:  
[https://meetingroom-h45h.onrender.com](https://meetingroom-h45h.onrender.com)

## Getting Started (Local Setup)

1. **Clone the repo**  
   ```bash
   git clone https://github.com/shravandevadiga123/MeetingRoom.git
   cd MeetingRoom

2. **Navigate to backend**
   ```bash
   cd backend

3. **Install backend dependencies**
   ```bash
   npm install

4. **Create a `.env` file**  
   In the `/backend` folder, create a `.env` file and add the following:

   ```env
   SECRET_KEY=your_secret_key_here
   DB_HOST=your_db_host_url
   DB_PORT=your_db_port
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_NAME=your_db_name
   DB_CA_CERT=your_cert_data_or_path

5. **Start the server**
   ```bash
   npm start

