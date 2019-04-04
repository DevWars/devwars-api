export interface ICreateGameScheduleRequest {
    startTime: Date, 
    mode: string, 
    title: string, 
    objectives: object
}

export interface IUpdateGameScheduleRequest {
    startTime: Date, 
    title: string, 
    objectives: object
}