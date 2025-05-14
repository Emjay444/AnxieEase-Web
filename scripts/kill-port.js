import { exec } from "child_process";

const PORT = 5173;

// Windows command to find and kill process using the port
const command =
  process.platform === "win32"
    ? `netstat -ano | findstr :${PORT} && FOR /F "tokens=5" %a in ('netstat -aon ^| findstr :${PORT}') do taskkill /F /PID %a`
    : `lsof -i :${PORT} | grep LISTEN | awk '{print $2}' | xargs kill -9`; // Unix command

exec(command, (error, stdout, stderr) => {
  if (error) {
    // If there's an error, it likely means no process was using the port
    console.log(`Port ${PORT} is already free`);
    return;
  }
  console.log(`Port ${PORT} has been freed`);
});
