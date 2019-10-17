import { Connection } from '../app/services/connection.service';

afterEach(async () => {
    await (await Connection).synchronize(true);
});
