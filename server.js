// importing
import express from 'express';
import mongoose from 'mongoose';
import Messages from './dbMessages.js';
import Pusher from 'pusher';
import cors from 'cors';

// app config 
const app = express();
const port = process.env.PORT || 9000;

//using pusher for realtime messages
const pusher = new Pusher({
    appId: "",
    key: "",
    secret: "",
    cluster: "ap2",
    useTLS: true
});
// middleware 
app.use(express.json());
app.use(cors());

// db config zLQBh3n7Cxsgssiy
const connection_url = '';

mongoose.connect(connection_url, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;

db.once("open", () => {
    console.log("db connected");

    const msgCollection = db.collection('messaagecontents');
    const changeStream = msgCollection.watch();

    changeStream.on("change", (change) => {
        console.log(change);

        if (change.operationType === 'insert') {
            const messageDetails = change.fullDocument;
            pusher.trigger('messages', 'inserted',
                {
                    name: messageDetails.name,
                    message: messageDetails.message,
                    timestamp:messageDetails.timestamp,
                    received:messageDetails.received,
                });
        }else{
            console.log("error trigger pusher");
        }
    });
});



// api routes 
app.get('/', (req, res) => res.status(200).send('hello sir how are u'));

app.get('/messages/sync', (req, res) => {
    Messages.find((err, data) => {
        if (err) {
            res.status(500).send(err)
        } else {
            res.status(200).send(data)
        }
    })
})

app.post('/messages/new', (req, res) => {
    const dbMessage = req.body
    Messages.create(dbMessage, (err, data) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(201).send(data)
        }
    })

})

// listen
app.listen(port, () => console.log(`listen local host ${port}`));

