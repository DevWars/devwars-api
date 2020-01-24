export default class ApiError extends Error {
    // The optional API code for sending back to the client (default: 500)
    public code: number;

    // If the error message should be logged and also logged down to disk.
    public log: boolean;

    // If the error stack should also be logged with the error message.
    public logStack: boolean;

    /**
     * Creates a new instance of the API error object. This is to be thrown when used with asyncErrorHandler.
     *
     * @param error.code The optional API code for sending back to the client (default: 500)
     * @param error.error The optional API error message, interchangeable with error.message (this takes lead).
     * @param error.message The optional API error message, interchangeable with error.error (ignored if error set.)
     * @param error.log If the error message should be logged and also logged down to disk.
     * @param error.logStack If the error stack should also be logged with the error message.
     */
    public constructor(error: { code?: number; error?: string; message?: string; log?: boolean; logStack?: boolean }) {
        super(error.error || error.message);

        this.code = error.code || 500;
        this.message = error.error || error.message || undefined;
        this.logStack = error.logStack || false;
        this.log = error.log || false;
    }

    /**
     * Simple override of string to ensure stack is logged if specified overwise default.
     */
    public toString(): string {
        return this.logStack ? this.stack : super.toString();
    }
}
