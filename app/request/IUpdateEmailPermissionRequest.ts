export interface IUpdateEmailPermissionRequest {
    [key: string]: boolean;

    news: boolean;
    gameApplications: boolean;
    schedules: boolean;
    linkedAccounts: boolean;
}
