import { Connection } from '../app/services/Connection.service';

afterEach(async () => {
    await (await Connection).synchronize(true);
});
