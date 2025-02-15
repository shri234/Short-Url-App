const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const UAParser = require("ua-parser-js");
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database Connection
mongoose
  .connect("mongodb+srv://sri:shri0406@cluster0.57rqq.mongodb.net/UrlManagement", { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("Database connection error:", err));

// Item Schema and Model
const UrlsSchema = new mongoose.Schema({
  longUrl: { type: String, required: true },
  customShortUrl: { type: String},
  topic: { type: String },
  shortUrl: { type: String},
  totalClicks:{type:Number},
  totalUniqueUsers:{type:Number},
  osType:{type:[]},
  deviceType:{type:[]},
  createdAt:{type:Date,default:Date.now()}
});

const UserSchema = new mongoose.Schema({
    userId: { type: String },
    emailId: { type: String, required:true},
    createdAt:{type:Date,default:Date.now()}
  });

const Urls = mongoose.model("Urls", UrlsSchema);
const User = mongoose.model("User", UserSchema);

// Routes
app.post("/user/login",async(req,res)=>{
    try {
        const newUser = new User(req.body);
        const savedUser = await newUser.save();
        res.status(201).json(savedUser);
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
})

// Create a new item
app.post("/api/shorten", async (req, res) => {
  try {
    let newUrl;
    if(req.body.customShortUrl == undefined){
        req.body.shortUrl = generateShortUrl(req.body.longUrl)
    }
    newUrl = new Urls(req.body);
    const savedUrl = await newUrl.save();
    res.status(201).json(savedUrl);
  } catch (err) {
    console.log(err)
    res.status(400).json({ error: err.message });
  }
});


function generateShortUrl(longUrl) {
    const shortUrls = new Map();
    const shortUrl = Math.random().toString(36).substring(2, 8); // Random string
    shortUrls.set(shortUrl, longUrl); // Store mapping
    return `https://short.ly/${shortUrl}`;
  }

 // Replace with your actual database logic

  // Route to handle short URL redirects
  app.get("/api/shorten", async (req, res) => {
    try {
        const shortUrl = req.query.shortUrl;
        if (!shortUrl) {
            return res.status(400).send({ error: "Short URL is required." });
        }

        const userAgent = req.headers["user-agent"];
        const parser = new UAParser(userAgent);
        const deviceInfo = parser.getResult();

        console.log("Device Info:", deviceInfo);

        // Extract relevant information
        const deviceType = deviceInfo.device.type || "desktop";
        const osType = deviceInfo.os.name || "unknown";

        // Find the corresponding long URL in the database
        const urlData = await Urls.findOne({ shortUrl });
        if (!urlData) {
            return res.status(404).send({ error: "Short URL not found." });
        }

        // Update click data (optional: you can add a clicks array to your schema to log these details)
        urlData.deviceType.push({
            deviceName:deviceType,
            uniqueClicks:1,
            uniqueUsers:1
        });
        urlData.osType.push({
            osName:osType,
            uniqueClicks:1,
            uniqueUsers:1
        });
        await urlData.save();

        // Redirect to the original long URL
        res.redirect(urlData.longUrl);
    } catch (error) {
        console.error("Error handling short URL click:", error);
        res.status(500).send({ error: "An error occurred." });
    }
});

// Get a single item by ID
app.get("/api/shortUrls", async (req, res) => {
  try {
    const Urlss = await Urls.find({},{shortUrl:1,topic:1});
    if (!Urlss) return res.status(404).json({ error: "Short Urls not found" });
    res.status(200).json(Urlss);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update an item by ID
app.put("/items/:id", async (req, res) => {
  try {
    const updatedItem = await Item.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updatedItem) return res.status(404).json({ error: "Item not found" });
    res.status(200).json(updatedItem);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete an item by ID
app.delete("/items/:id", async (req, res) => {
  try {
    const deletedItem = await Item.findByIdAndDelete(req.params.id);
    if (!deletedItem) return res.status(404).json({ error: "Item not found" });
    res.status(200).json({ message: "Item deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
