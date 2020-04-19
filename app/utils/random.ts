import { randomBytes } from 'crypto';

export const randomString = (length: number): string => {
    const allChars = 'abcdefghijklmnopqrstuvwzyz0123456789'.split('');
    let final = '';

    for (let i = 0; i < length; i++) {
        final += allChars[Math.floor(Math.random() * allChars.length)];
    }

    return final;
};

/**
 * Generates a randomized base64 string from the crypto random bits listings. Designed for use in
 * generating randomized values for verification tokens and more.
 * @param numberOfBits The number of bits to use in the generation progress.
 */
export const randomCryptoString = (numberOfBits = 256): string => {
    return randomBytes(numberOfBits).toString('base64');
};
