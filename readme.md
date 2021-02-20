# Node Self-Detach

This Node script demonstrates a mechanism for starting processes that in-effect
self-detach from the terminal they were started from, so that the terminal can
be closed without killing the process.

**Please, let me know if there is a better way to do this!** Something like
`process.detach()` would be nice.

In addition, this script ensures that only a single instance of the detached
process ever runs at one time. It uses `lsof` to do this, so it will only work
on macOS or Linux.

This makes it suitable to use the mechanism for local development of web-based
applications. The flow I have in mind goes like this:

- Start the process using `node .` and test it in the browser
- Kill the terminal / IDE and continue using the web-app without interruption
- Make changes and execute `node .` to replace the existing instance

This flow allows for very easy development, where when working on the web app,
once jumps into the IDE and does the build-compile-test cycle manually. Once
ready to step away from development, the web application remains available and
online, so it can be used (as opposed to developed and tested). Once again ready
to jump into the development, the web app is replaced with each issuance of the
`node .` command.

The app only ever goes down if it crashes, which is desired: apps should crash
fast and loud!

If you don't feel comfortable/confident that this script will not keep abandoned
processes around, rest easy. The script creates a `$PID.now` flag file for each
process so it is obvious at glance if there is a process running or not. The
flag file gets recreated if it was deleted while the process was running, so its
presence should be a reliable indicator of a process with that PID running.

The script deletes flag files or processes it replaces, so only current flag
files are kept around. The flag file is only touched if it was removed and needs
recreating, it is not written to continuously, so the script does not wear out
storage drives.
