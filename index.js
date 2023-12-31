const express = require("express");
const app = express();
const fs = require("fs");
const multer = require('multer');


// SET STORAGE
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'videos')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + ".mp4")
    }
});

const upload = multer({storage: storage});


app.get("/", function (req, res) {
    res.sendFile(__dirname + '/index.html');
})
app.get("/demo", function (req, res) {
    res.sendFile(__dirname + '/demo-stream-video.html');
})
app.post("/upload-video", upload.single('video'), (req, res, next) => {
    const video = req.file
    if (!video) {
        const error = new Error('Please upload a file')
        error.httpStatusCode = 400
        return next(error)
    }
    res.send(video.filename)
})

app.get("/video/:id", function (req, res) {
    // Ensure there is a range given for the video
    const videoFile = "videos/" + req.params.id
    console.log(videoFile)
    const range = req.headers.range;
    if (!range) {
        res.status(400).send("Requires Range header");
    }

    // get video stats (about 61MB)
    const videoPath = videoFile;
    const videoSize = fs.statSync(videoFile).size;

    // Parse Range
    // Example: "bytes=32324-"
    const CHUNK_SIZE = 10 ** 6; // 1MB
    const start = Number(range.replace(/\D/g, ""));
    const end = Math.min(start + CHUNK_SIZE, videoSize - 1);

    // Create headers
    const contentLength = end - start + 1;
    const headers = {
        "Content-Range": `bytes ${start}-${end}/${videoSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": contentLength,
        "Content-Type": "video/mp4",
    };

    // HTTP Status 206 for Partial Content
    res.writeHead(206, headers);

    // create video read stream for this particular chunk
    const videoStream = fs.createReadStream(videoPath, {start, end});

    // Stream the video chunk to the client
    videoStream.pipe(res);
});
app.listen(8000, function () {
    console.log("Listening on port 8000!");
});
