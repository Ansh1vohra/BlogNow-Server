const express = require('express');
const { ObjectId } = require('mongodb');

module.exports = function(db) {
  const router = express.Router();

  // Create a new blog post
  router.post('/', async (req, res) => {
    try {
      const blogPost = req.body;
      const result = await db.collection('blogs').insertOne(blogPost);
      res.status(201).json({ _id: result.insertedId, ...blogPost });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get all blog posts
  router.get('/', async (req, res) => {
    try {
      const blogs = await db.collection('blogs').find().sort({ _id: -1 }).toArray();
      res.json(blogs);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get a single blog by ID
  router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const blog = await db.collection('blogs').findOne({ _id: new ObjectId(id) });
      if (blog) {
        res.json(blog);
      } else {
        res.status(404).json({ error: 'Blog not found' });
      }
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.get('/blogsByUser/:userMail', async (req, res) => {
      try {
          const { userMail } = req.params;
          const blogs = await db.collection('blogs').find({ userMail }).toArray();
          res.json(blogs);
      } catch (error) {
          res.status(500).json({ error: error.message });
      }
  });

  router.get('/blogsByAuthor/:authorName', async (req, res) => {
    try {
        const authorName = decodeURIComponent(req.params.authorName);
        console.log('Decoded Author Name:', authorName);

        // Find the user by authorName (case-insensitive)
        const user = await db.collection('Users').findOne({
            authorName: { $regex: new RegExp(authorName, 'i') }
        });

        if (!user) {
            console.error('No user found for authorName:', authorName);
            return res.status(404).json({ error: 'Author not found' });
        }

        console.log('User Found:', user);

        // Fetch blogs by userMail
        const blogs = await db.collection('blogs').find({ userMail: user.userMail }).toArray();
        console.log('Blogs Found:', blogs);

        res.json(blogs);
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});


  



  return router;
};
