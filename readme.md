# Node Forever

Node Forever is a library for making a process standalone and single-instance.
It works by restarting the Node module in a detached process and propagating the
command line arguments into the standalone process. In addition, it ensures the
process remains single-instance by killing and replacing the existing instance
each time a new one is started. Once a Node Forever script has been started, the
terminal it was started from can be closed without killing the process.

## Installation

`git submodule add https://github.com/tomashubelbauer/node-forever`

## Usage

See [`test.js`](test.js). Run using `node test`.

```js
import forever from './node-forever/index.js';

void async function() {
  // Make this process standalone and single-instance and propagate the standard I/O
  if (await forever()) {
    return;
  }

  // Do the standalone single-instance process work here
}()
```

- Start the process using `node test` and test it in the browser
- Kill the terminal / IDE and continue using the web-app without interruption
- Make changes and execute `node test` to replace the existing instance

This flow allows for very easy development, where when working on the web app,
one jumps into the IDE and does the build-compile-test cycle manually. Once
ready to step away from development, the web application remains available and
online, so it can be used (as opposed to developed and tested). Once ready to
do another session of development, the web app is replaced with each issuance
of the `node .` command.

Command line arguments to the bootstrap process are transparently propagated to
the standalone process.

The app only ever goes down if it crashes, which is desired: apps should crash
fast and loud!

If you don't feel comfortable/confident that this script will not keep abandoned
processes around, rest easy. The script creates a `$PID.now` flag file for each
process so it is obvious at glance if there is a process running or not. The
flag file gets recreated if it was deleted while the process was running, so its
presence should be a reliable indicator of a process with that PID running. It
can only become stale of the process crashes.

The script deletes flag files of processes it replaces, so only current flag
file is kept around. The flag file is only touched if it was removed and needs
recreating, it is not written to continuously, so the script does not wear out
storage drives.

## Support

Node Forever uses `lsof` to find processes which have the given module file open
so it will not work on Windows. `handle` from the SysInternals suite could be
used, but it does not come out of the box with Windows, so I have not bothered.

## To-Do

### Improve detection of the prior process not yet having released the port

Right now we're using a one-second timeout, which works, but it is probably not
the best way to do it.

### Explore whether `truncate` has any benefit over `writeFile` with no content

This is used in the flag file re-creation interval.
