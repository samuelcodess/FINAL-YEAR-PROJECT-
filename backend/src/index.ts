import "dotenv/config";

import { app } from "./app";
import { env } from "./config/env";
import { startReminderScheduler } from "./services/reminderSchedulerService";

app.listen(env.port, () => {
  console.log(`Employee performance backend listening on port ${env.port}`);
  startReminderScheduler();
});
