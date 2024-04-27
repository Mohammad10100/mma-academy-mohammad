const express = require("express");
const path = require("path");
const app = express();
let alert = require('alert');
// const popup = require('popups');
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const AWS = require('aws-sdk');
const multer = require('multer');
const port = 80;
const s3endpoint = "https://mma-profiles.s3.amazonaws.com/";

// MySQL connection
const connection = mysql.createConnection({
    host: "mma-contacts.cbgk06cc449y.us-east-1.rds.amazonaws.com",
    user: "admin",
    password: "password",
    database: "password",
});


connection.connect((err) => {
    if (err) {
        console.error("Error connecting to MySQL database:", err);
        return;
    }
    console.log("Connected to MySQL database!");
});

// AWS S3 configuration
const s3 = new AWS.S3({
    accessKeyId: "AKIAXYKJXE7VUK4XVR62",
    secretAccessKey: "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",
});

const upload = multer({ dest: "uploads/" });


//modeling the schema
var Contact = mongoose.model('Contact', contactSchema);


// EXPRESS SPECIFIC STUFFS
app.use('/static', express.static('static'))// For serving static files
app.use(express.urlencoded());


// PUG SPECIFIC STUFFS
app.set('view engine', 'pug');// Set the template engine as pug
app.set('views', path.join(__dirname, 'views'));// Set the views directory

// Our pug demo endpoint
app.get("/home", (req, res) => {
    const params = {};
    res.status(200).render("home.pug", params);
})
app.get("/contact", (req, res) => {
    const params = {};
    res.status(200).render("contact.pug", params);
})
app.post("/contact", upload.single("file"), (req, res) => {
    const { name, age, phone, email, address } = req.body;
    const file = req.file;


    // Generate pre-signed URL for S3 upload
    const s3Params = {
        Key: file.originalname,
        ContentType: file.mimetype,
        ACL: "public-read", // Allow public access to the uploaded file
        Expires: 3600, // URL expires in 1 hour (adjust as needed)
    };

    s3.getSignedUrl("putObject", s3Params, (err, url) => {
        if (err) {
            console.error("Error generating pre-signed URL:", err);
            res.status(400).send("Failure: Error generating pre-signed URL");
            return;
        }

        // Construct the URL using your bucket URL and the key (filename)
        const fileUrl = `${s3endpoint}/${file.originalname}`;

        console.log("File uploaded to S3 successfully:", fileUrl);

        // Insert data into MySQL
        const query = "INSERT INTO contacts (name, age, phone, email, address, file_url) VALUES (?, ?, ?, ?, ?, ?)";
        connection.query(query, [name, age, phone, email, address, url], (err, result) => {
            if (err) {
                console.error("Error inserting data into MySQL:", err);
                res.status(400).send("Failure: The data has not been stored");
                return;
            }
            console.log("Data inserted into MySQL successfully:", result);
            res.status(200).send("Success: The form has been submitted");
        });
    });
})



app.listen(port, () => {
    console.log(`The application started successfully on port ${port}`);
});
