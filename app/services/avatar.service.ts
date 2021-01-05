import * as AWS from 'aws-sdk';
import * as fs from 'fs';
import { nanoid } from 'nanoid';
import { PutObjectRequest } from 'aws-sdk/clients/s3';
import { ManagedUpload } from 'aws-sdk/lib/s3/managed_upload';
import User from '../models/user.model';

export class AvatarService {
    public static async updateAvatarForUser(user: User, filePath: string) {
        const path = `profilepics-test/${user.id}/${nanoid()}.jpg`;

        const params: PutObjectRequest = {
            Body: fs.createReadStream(filePath),
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: path,
        };

        const s3 = new AWS.S3();

        const sendData = await new Promise<ManagedUpload.SendData>((resolve, reject) => {
            s3.upload(params, (err: Error, data: ManagedUpload.SendData) => {
                if (err) {
                    reject(err);
                }

                resolve(data);
            });
        });

        user.avatarUrl = sendData.Location;

        await user.save();
    }
}
