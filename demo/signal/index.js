const HEARTBEAT = 5000;

const handler = signal => {
    console.log(`received ${signal}`);
    console.log("stopping...");
    process.exit(0);
};

process.on("SIGTERM", handler);
process.on("SIGINT", handler);

const ping = (flag = false) => {
    console.log(flag ? "pong" : "ping");
    setTimeout(() => {
        ping(!flag);
    }, HEARTBEAT);
};

ping();
