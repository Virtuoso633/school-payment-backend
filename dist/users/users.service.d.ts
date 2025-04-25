import { Model } from 'mongoose';
import { UserDocument } from './schemas/user.schema';
import { CreateUserDto } from '../auth/dto/create-user.dto';
export declare class UsersService {
    private userModel;
    constructor(userModel: Model<UserDocument>);
    findOneByUsername(username: string): Promise<UserDocument | undefined>;
    create(createUserDto: CreateUserDto): Promise<UserDocument>;
}
