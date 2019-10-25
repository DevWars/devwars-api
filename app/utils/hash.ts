import * as bcrypt from 'bcrypt';

const NUM_ROUNDS = 12;

export async function hash(input: string): Promise<string> {
    return bcrypt.hash(input, NUM_ROUNDS);
}
