export class ApiError extends Error{

    status :number;
    constructor (message: string, status:number){
        super();
        this.status = status;
    }
}