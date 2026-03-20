import { app } from "./server/app";

export default {
  fetch: app.fetch.bind(app)
};

export { app };
