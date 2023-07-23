const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'cropped')));

const upload = multer({ dest: 'uploads/' });

app.get('/', (req, res) => {
  const croppedImage = req.query.croppedImage || null;
  res.render('index', { croppedImage });
});

app.post('/upload', upload.single('image'), (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const imagePath = req.file.path;
  const outputDir = path.join(__dirname, 'cropped');
  const outputFileName = req.file.filename + '.cropped.jpg';
  const outputFile = path.join(outputDir, outputFileName);

  // Create the 'cropped' directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  sharp(imagePath)
    .extract({ left: parseInt(req.body.x), top: parseInt(req.body.y), width: parseInt(req.body.width), height: parseInt(req.body.height) })
    .toFile(outputFile, (err, info) => {
      if (err) {
        console.error(err); // Log the error for debugging
        // Handle the error and pass it to the next middleware
        return next(err);
      }

      fs.unlink(imagePath, (unlinkErr) => {
        if (unlinkErr) {
          console.error(unlinkErr); // Log the error for debugging
          // Handle the error and pass it to the next middleware
          return next(unlinkErr);
        }

        // Redirect to the homepage with the cropped image filename as a query parameter
        res.redirect(`/?croppedImage=${encodeURIComponent(outputFileName)}`);
      });
    });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
