import { hash, compare } from "bcrypt";

export class PasswordService {
    hashPassword = async(password: string) => {
        const salt = 10
        return await hash (password, salt);
    }

    comparePassword = async (plainPassword: string, hashedPassword: string) => {
        return await compare(plainPassword, hashedPassword);
    }
}