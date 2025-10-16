import cron from "node-cron";

export const reminderSchedule = () => {
    cron.schedule( "*/5 * * * * *", () => {
        // scheduler
        console.log("running a task every 5 seconds");
    });
}