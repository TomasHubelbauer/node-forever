import forever from './index.js';
import http from 'http';

// Make this process standalone and single-instance and propagate the standard I/O
if (await forever()) {
  return;
}

// Wait a bit for the existing agent to die before attempting to bind the port
// TODO: Do this in a smarter way - try to bind and wait and retry on failure
await new Promise(resolve => setTimeout(resolve, 1000));

const port = process.argv[2] || 1337;
http
  .createServer((request, response) => {
    response.end(request.url);
  })
  .listen(port, () => console.log(process.pid, 'http://localhost:' + port))
  ;
