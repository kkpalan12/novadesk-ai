import bcrypt from "bcrypt";
import { UserRepository } from "../repositories/user.repository";
import { IUser } from "../interfaces/user.interface";

export class AuthService {

    private userRepository: UserRepository;

    constructor() {
        this.userRepository = new UserRepository();
    }

    async register(userData: Partial<IUser>) {

    const existingUser =
        await this.userRepository.findByEmail(userData.email!);

    if (existingUser) {
        throw new Error("Email already exists");
    }

    const hashedPassword =
        await bcrypt.hash(userData.password!,10);

    const user =
        await this.userRepository.create({

            ...userData,

            password: hashedPassword

        });

    const userObject = user.toObject();

    delete userObject.password;
    delete userObject.refreshToken;

    return userObject;

}

}