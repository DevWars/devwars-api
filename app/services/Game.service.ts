export default class GameService {

    public static async all() {
        return [
            {
                name: "Zen Garden",
            },
            {
                name: "Classic",
            },
            {
                name: "Blitz",
            },
        ];
    }
}
