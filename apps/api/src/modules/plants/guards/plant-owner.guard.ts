import {
  Injectable,
  CanActivate,
  ExecutionContext,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Plant, PlantDocument } from '../schemas/plant.schema';

@Injectable()
export class PlantOwnerGuard implements CanActivate {
  constructor(@InjectModel(Plant.name) private plantModel: Model<PlantDocument>) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const plantId = request.params.id;
    const userId = request.user?.id;

    if (!userId) {
      throw new ForbiddenException('User not authenticated');
    }

    const plant = await this.plantModel.findById(plantId).exec();

    if (!plant) {
      throw new NotFoundException(`Plant with ID "${plantId}" not found`);
    }

    const plantUserId = plant.userId.toString();
    if (plantUserId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to modify this plant',
      );
    }

    request.plant = plant;

    return true;
  }
}
