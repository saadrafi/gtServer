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
      const users = await usersCollection.find({}).toArray();
      res.send(users);
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
