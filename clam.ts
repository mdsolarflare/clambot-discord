import { Application } from "express";
import * as Discord from "discord.js";

// https://docs.npmjs.com/

const app = new Application();

// Set up routes for your application
app.get("/", (req, res) => {
  // Handle requests to the root URL ("/")
});

app.post("/messages", (req, res) => {
  // Handle messages from Discord and respond accordingly
});

// Start listening for incoming connections
app.listen(3000);

console.log("Server started on port 3000");