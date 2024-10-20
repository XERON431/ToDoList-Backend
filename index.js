const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const User = require('./User');
const router = express.Router();
const { authenticateToken } = require('./middlewares/auth');

const jwt = require('jsonwebtoken');


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch((error) => console.error('Error connecting to MongoDB:', error));

// Define the Task schema
const taskSchema = new mongoose.Schema({
    text: { type: String, required: true },
    completed: { type: Boolean, default: false },
    startTime: { type: Date },  // New field for start time
    endTime: { type: Date },    // New field for end time
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to User model
  });

const Task = mongoose.model('Task', taskSchema);

// Routes
app.get('/tasks', authenticateToken, async (req, res) => {
    try {
      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      res.json(user.tasks); // Return the user's tasks
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/tasks', authenticateToken, async (req, res) => {
    const { text, startTime, endTime } = req.body;

    // Ensure req.user is populated by the authenticateToken middleware
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    // Create a new task object
    const newTask = {
        text,
        completed: false,
        startTime,
        endTime,
    };

    try {
        // Push the new task into the user's tasks array
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $push: { tasks: newTask } }, // Add the new task to the tasks array
            { new: true } // Return the updated user document
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Instead of returning the entire tasks array, return the new task
        res.status(201).json({ message: 'Task added successfully', task: newTask });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

  

app.put('/tasks/:id', async (req, res) => {
  try {
    const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedTask);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.delete('/tasks/:taskId', authenticateToken, async (req, res) => {
    const { taskId } = req.params;
    console.log("deleted")

    // Ensure req.user is populated by the authenticateToken middleware
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    console.log("odkocodck")

    const user = await User.findById(req.user._id); // First, find the user

if (user) {
    // Find the index of the task with the given taskId
    const taskIndex = user.tasks.findIndex(task => task._id.toString() === taskId);

    if (taskIndex > -1) {
        // Remove the task from the user's tasks array
        const removedTask = user.tasks[taskIndex]; // Get the task to return if needed
        user.tasks.splice(taskIndex, 1); // Remove the task

        // Save the updated user document
        await user.save();
        
        // You can return the removed task or the updated user document
        res.json({ message: 'Task deleted', removedTask });
    } else {
        res.status(404).json({ message: 'Task not found' });
    }
} else {
    res.status(404).json({ message: 'User not found' });
}

});


app.post('/register', async (req, res) => {
    console.log("registwr api")
    try {
      const user = new User(req.body);
      console.log("user");
      await user.save();
      console.log("Save", user);
      const token = user.generateAuthToken();
      console.log("Token");
      res.send({ token, user: { id: user._id, username: user.username } });
      console.log("Sending");
    //   res.status(201).send({ token });
    } catch (error) {
      res.status(400).send(error);
    }
  });

  app.post('/login', async (req, res) => {
    console.log("hey")
    try {
      const user = await User.findOne({ username: req.body.username });
      console.log("heyy 2");
      if (!user || !(await user.comparePassword(req.body.password))) {
        return res.status(400).send('Invalid credentials');
      }
      console.log("heyy 3" , user);
      const token = user.generateAuthToken();
      console.log("heyy 4");
      res.send({ token, user: { id: user._id, username: user.username } });
    } catch (error) {
      res.status(400).send(error);
    }
  });
  

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


//hikokok
//kko
