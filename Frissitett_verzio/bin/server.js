import app from "../app.mjs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Szerver fut a ${port}-es porton`);
});