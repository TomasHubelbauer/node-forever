import child_process from 'child_process';
import fs from 'fs';
import http from 'http';

// Kill the process on an unhandled promise rejection and unhandled exception
process.on('unhandledRejection', error => { throw error; });
process.on('uncaughtException', error => { throw error; })

// Fork off an agent process and serve as a standard I/O passthrough until exit
if (process.send === undefined) {
  // Propagage bootstrap process command line arguments to the agent process
  child_process.fork(process.argv[1], process.argv.slice(2), { detached: true });
}

// Run as an agent once the bootstrap process has forked the current process off
else {
  // Recreate the flag file continuously to signal liveness without a terminal
  setInterval(
    () => {
      const flagFileName = process.pid + '.now';

      // Check whether a flag file for this agent process already exists or not
      fs.access(flagFileName, (error) => {
        if (error) {
          if (error.code !== 'ENOENT') {
            throw error;
          }

          // Create the flag file or bring down the process if not possible
          fs.writeFile(flagFileName, '', (error) => { if (error) { throw error; } });
        }
      });
    },
    1000
  );

  // Execute `lsof $PWD` to maybe identify an existing agent to kill and replace
  child_process.exec(`lsof ${process.cwd()}`, (error, stdout, stderr) => {
    // Raise the error thrown while attempting to execute `lsof` to kill self
    if (error) {
      throw error;
    }

    // Treat standard error content as an error, too, since it is not expected
    if (stderr) {
      throw new Error(stderr);
    }

    // Match `lsof` output: command pid user fd type device size/off node name
    const regex = /^node\s+(?<pid>\d+)\s+\w+\s+\w+\s+DIR\s+\d+,\d+\s+\d+\s+\d+\s+(\/.+)+?$/m;

    // Parse the `lsof $PWD` output to find the process ID of an existing agent
    const match = regex.exec(stdout);
    if (match) {
      // Kill the existing agent process to be replaced by the current process
      process.kill(match.groups.pid);

      // Delete the flag file for the existing agent process to signal deadness
      fs.unlink(match.groups.pid + '.now', (error) => { if (error && error.code !== 'ENOENT') { throw error; } });
    }

    // Wait a bit for the existing agent to die before attempting to bind the port
    // TODO: Do this in a smarter way - try to bind and wait and retry on failure
    setTimeout(
      () => {
        const port = process.argv[2] || 1337;
        http
          .createServer((request, response) => {
            response.end(request.url);
          })
          .listen(port, () => console.log(process.pid, 'http://localhost:' + port))
          ;
      },
      1000
    );
  });
}
