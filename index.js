const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 3000;
const app = express();

// middlewire
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wqecfea.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const usersCollection = client.db("globalDB").collection("usersCollection");
    const classCollection = client.db("globalDB").collection("classCollection");
    const selectClassCollection = client.db("globalDB").collection("selectClassCollection");

    app.post("/users", async (req, res) => {
      const newUser = req.body;
      //   find the user in database
      const user = await usersCollection.findOne({ email: newUser.email });
      if (user) {
        res.send({ error: true, message: "user already exist " });
        return;
      }
      const result = await usersCollection.insertOne(newUser);
      console.log("got new user", req.body);
      res.send(result);
    });

    // api to get the user role by user email
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;

      if (email) {
        const query = { email: email };
        const user = await usersCollection.findOne(query);
        const role = user?.role;
        res.send({ role: role });
      }
    });

    // api to get all the users
    app.get("/users", async (req, res) => {
      const query = req.query.role;

      console.log(query);
      if (query) {
        const users = await usersCollection.find({ role: query }).toArray();
        res.send(users);
        return;
      }

      const users = await usersCollection.find({}).toArray();
      res.send(users);
    });

    // api to update the user role
    app.put("/users/:id", async (req, res) => {
      const id = req.params.id;
      const role = req.body.role;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: role,
        },
      };
      const result = await usersCollection.updateOne(query, updateDoc);

      res.send(result);
    });

    // api to save class information
    app.post("/class", async (req, res) => {
      const newClass = req.body;
      const result = await classCollection.insertOne(newClass);
      console.log("got new class", req.body);
      res.send(result);
    });

    // api to get all class information
    app.get("/class", async (req, res) => {
      const status = req.query.status;
      const query = {};
      if (status) {
        const classes = await classCollection.find({ status: status }).toArray();
        res.send(classes);
        return;
      }

      const classes = await classCollection.find(query).toArray();
      res.send(classes);
    });

    app.get("/classes/:email", async (req, res) => {
      const email = req.params.email;
      const query = { instructorEmail: email };
      const classes = await classCollection.find(query).toArray();
      res.send(classes);
    });

    app.get("/class/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await classCollection.findOne(query);
      res.send(result);
    });

    // api to update class information by id
    app.put("/class/:id", async (req, res) => {
      const id = req.params.id;
      const updateClass = req.body;
      console.log(updateClass);
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          ...updateClass,
        },
      };
      const result = await classCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    // api to save selected class data
    app.post("/selectClass", async (req, res) => {
      const newClass = req.body;
      const query = {
        userEmail: newClass.userEmail,
        classId: newClass.classId,
      };
      const selectedClass = await selectClassCollection.findOne(query);
      if (selectedClass) {
        res.send({ error: true, message: "class already added " });
        return;
      }
      const result = await selectClassCollection.insertOne(newClass);
      console.log("got new class", req.body);
      res.send(result);
    });

    // api to get all selected class data
    app.get("/selectClass", async (req, res) => {
      const query = req.query.email;
      if (query) {
        const selectedClass = await selectClassCollection.find({ userEmail: query }).toArray();
        res.send(selectedClass);
        return;
      }
    });

    // api to delete selected class data
    app.delete("/selectClass/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await selectClassCollection.deleteOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("hello world");
});

app.listen(port, () => {
  console.log(`listening to port ${port}`);
});
