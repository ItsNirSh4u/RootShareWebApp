import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { IUser, IUserUpdate, AuthProvider } from '@rootshare/shared-types';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(userData: {
    email: string;
    username: string;
    password?: string;
    authProvider?: AuthProvider;
    googleId?: string;
    profileImageUrl?: string;
  }): Promise<IUser> {
    const user = new this.userModel(userData);
    const savedUser = await user.save();
    return this.sanitizeUser(savedUser);
  }

  async findByGoogleId(googleId: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ googleId }).exec();
  }

  async findById(id: string): Promise<IUser | null> {
    const user = await this.userModel.findById(id).exec();
    return user ? this.sanitizeUser(user) : null;
  }

  async findByEmail(email: string): Promise<any> {
    return this.userModel.findOne({ email }).select('+password').exec();
  }

  async findByUsername(username: string): Promise<IUser | null> {
    const user = await this.userModel.findOne({ username }).exec();
    return user ? this.sanitizeUser(user) : null;
  }

  async update(id: string, updateData: IUserUpdate): Promise<IUser> {
    const user = await this.userModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.sanitizeUser(user);
  }

  async updateRefreshToken(id: string, hashedRefreshToken: string | null): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(id, { refreshToken: hashedRefreshToken })
      .exec();
  }

  async findByIdWithRefreshToken(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).select('+refreshToken').exec();
  }

  async updateProfileImage(id: string, profileImageUrl: string): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(id, { profileImageUrl })
      .exec();
  }

  sanitizeUser(user: UserDocument): IUser {
    const userObject = user.toObject();
    const { password, ...sanitized } = userObject;
    return {
      ...sanitized,
      id: user._id.toString(),
    } as IUser;
  }
}
