import { Connection } from "../config/Database";

afterEach(async () => {
    await (await Connection).synchronize(true);
});
