require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

// Connect to and initialize MongoDB
const { MongoClient } = require('mongodb');
const client = new MongoClient(process.env.MONGODB_URL)
const db = client.db('urlshortener')
const urls = db.collection('urls');

const dns = require('dns');

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

// POST request to urlshortener
app.post('/api/shorturl', (req, res) => {
  let url = req.body.url;
  if (url.endsWith('/')) {
    url = url.slice(0,url.length - 1);
  };
  let hostname;
  try {
    hostname = new URL(url).hostname
  } catch(err) {
    if (err instanceof TypeError){
      hostname = 'Invalid'
    };
  };
  dns.lookup(hostname, async (err, address, _family) => {
    if (address) {
      if (err) throw err;
      let shorturl = await urls.findOne({ url });
      if (!shorturl) {
        shorturl = await urls.countDocuments({});
        const urlDoc = {
          url,
          short_url: shorturl
        };
        const insertUrlResult = await urls.insertOne(urlDoc);
      } else {
        shorturl = shorturl.short_url;
      };
      res.json({
        original_url: url,
        short_url: shorturl
      });
    } else {
      res.json({
        error: "Invalid URL"
      });
    };
  });
});

app.get('/api/shorturl/:shorturl', async (req, res) => {
  const shorturl = req.params.shorturl;
  const urlDoc = await urls.findOne({ short_url: parseInt(shorturl) })
  res.redirect(urlDoc.url)
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
