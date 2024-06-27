// Node Redis Client and basic operations
import * as redis from 'redis';

const client = redis.createClient();

// Event handler for successful connection
client.on('connect', () => {
  console.log('Redis client connected to the server');
});

// Event handler for connection errors
client.on('error', (err) => {
  console.log(`Redis client not connected to the server: ${err.message}`);
});

// Function to set a new school value in Redis
function setNewSchool(schoolName, value) {
    client.set(schoolName, value, redis.print);
  }
  
  // Function to display the value for a given school key
  function displaySchoolValue(schoolName) {
    client.get(schoolName, (err, res) => {
      console.log(res);
    });
  }
  
  // Call the functions
  displaySchoolValue('Holberton');
  setNewSchool('HolbertonSanFrancisco', '100');
  displaySchoolValue('HolbertonSanFrancisco');
  