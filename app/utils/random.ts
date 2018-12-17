export const randomString = (length: number): string => {
    const allChars = "abcdefghijklmnopqrstuvwzyz0123456789".split("");
    let final = "";

    for (let i = 0; i < length; i++) {
        final += allChars[Math.floor(Math.random() * allChars.length)];
    }

    return final;
};
