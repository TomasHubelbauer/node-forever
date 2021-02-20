import child_process from 'child_process';
import util from 'util';
import fs from 'fs';

export default async function forever(flag = true) {
  // Fork off an agent process and serve as a standard I/O passthrough until exit
  if (process.send === undefined) {
    // Propagage bootstrap process command line arguments to the agent process
    child_process.fork(process.argv[1], process.argv.slice(2), { detached: true });
    return true;
  }

  if (flag) {
    // Recreate the flag file continuously to signal liveness without a terminal
    setInterval(
      async () => {
        const flagFileName = process.pid + '.now';

        // Check whether a flag file for this agent process already exists or not
        try {
          await fs.promises.access(flagFileName);
          // Ignore as the flag file is correctly already existant
        }
        catch (error) {
          if (error.code !== 'ENOENT') {
            throw error;
          }

          // Create the flag file or bring down the process if not possible
          // TODO: Explorer using `fs.truncate` here instead - any benefit?
          await fs.promises.writeFile(flagFileName, '');
        }
      },
      1000
    );
  }

  // Execute `lsof $PWD` to maybe identify an existing agent to kill and replace
  try {
    const { stdout, stderr } = await util.promisify(child_process.exec)(`lsof ${process.cwd()}`);

    // Treat standard error content as an error since it is not expected
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
      try {
        await fs.promises.unlink(match.groups.pid + '.now');
      }
      catch (error) {
        // Throw only if the file failed to be deleted, not if it didn't exist
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
    }
  }
  catch (error) {
    // Raise the error thrown while attempting to execute `lsof` to kill self
    throw error;
  }
}
