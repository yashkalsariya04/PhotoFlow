
import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async onApplicationBootstrap() {
    await this.seedAdmin();
  }

  async seedAdmin() {
    const adminEmail = 'yashkalsaria040@gmail.com';
    
    try {
      const existingUser = await this.userModel.findOne({ email: adminEmail });
      
      if (existingUser) {
        if (existingUser.role !== 'admin') {
          console.log(`Updating user ${adminEmail} to admin role...`);
          existingUser.role = 'admin';
          await existingUser.save();
        } else {
            console.log(`Admin user ${adminEmail} already exists and has correct role.`);
        }
      } else {
        console.log(`Creating admin user ${adminEmail}...`);
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash('password', saltRounds);

        const newUser = new this.userModel({
          name: 'Admin User',
          email: adminEmail,
          passwordHash,
          role: 'admin',
          designation: 'Administrator',
          location: 'Headquarters',
        });

        await newUser.save();
        console.log('✅ Admin user created successfully');
      }
    } catch (error) {
      console.error('❌ Error seeding admin:', error);
    }
  }
}
