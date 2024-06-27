const express = require('express');
const redis = require('redis');
const kue = require('kue');
const { promisify } = require('util');

const app = express();
const client = redis.createClient();
const queue = kue.createQueue();

const reserveSeat = promisify(client.set).bind(client);
const getCurrentAvailableSeats = promisify(client.get).bind(client);
const reserveSeatJob = 'reserve_seat';

let reservationEnabled = true;
const initialAvailableSeats = 50;
let numberOfAvailableSeats = initialAvailableSeats;

// Set the initial number of available seats to 50
reserveSeat('available_seats', initialAvailableSeats);

// Middleware to set response header to JSON
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
});

// Route to get the number of available seats
app.get('/available_seats', async (req, res) => {
  const response = { numberOfAvailableSeats: numberOfAvailableSeats.toString() };
  res.json(response);
});

// Route to reserve a seat
app.get('/reserve_seat', (req, res) => {
  if (!reservationEnabled) {
    res.json({ status: 'Reservation are blocked' });
    return;
  }

  const job = queue.create(reserveSeatJob).save();
  job.on('complete', () => {
    console.log(`Seat reservation job ${job.id} completed`);
  });
  job.on('failed', (err) => {
    console.log(`Seat reservation job ${job.id} failed: ${err}`);
  });

  res.json({ status: 'Reservation in process' });
});

// Route to process the queue and decrease the number of available seats
app.get('/process', async (req, res) => {
  res.json({ status: 'Queue processing' });

  const availableSeats = await getCurrentAvailableSeats('available_seats');
  const newAvailableSeats = parseInt(availableSeats, 10) - 1;

  if (newAvailableSeats >= 0) {
    await Promise.all([
      reserveSeat('available_seats', newAvailableSeats),
      reserveSeat(reserveSeatJob, newAvailableSeats === 0 ? false : true),
    ]);
  } else {
    const error = new Error('Not enough seats available');
    queue.create(reserveSeatJob).failed().error(error);
  }
});

// Start the server
app.listen(1245, () => {
  console.log('Server listening on port 1245');
});
