export interface UpdateEmailPermissionRequest {
    [key: string]: boolean;

    news: boolean;
    gameApplications: boolean;
    schedules: boolean;
    linkedAccounts: boolean;
}
