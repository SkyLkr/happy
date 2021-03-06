import { Request, Response } from 'express';
import * as Yup from 'yup';

import { Orphanage } from '../models/Orphanage';

import orphanageView from '../views/orphanages_view';

export default {
  async index(request: Request, response: Response) {
    const orphanages = await Orphanage.find({ relations: ['images'] });

    return response.json(orphanageView.renderMany(orphanages));
  },

  async show(request: Request, response: Response) {
    const { id } = request.params;

    const orphanage = await Orphanage.findOne(id, { relations: ['images'] });

    if (orphanage === undefined) {
      return response.status(404).send();
    }

    return response.json(orphanageView.render(orphanage));
  },

  async create(request: Request, response: Response) {
    const {
      name,
      latitude,
      longitude,
      about,
      instructions,
      opening_hours,
      open_on_weekends,
    } = request.body;

    const requestImages = request.files as Express.Multer.File[];

    const images = requestImages.map(requestImage => ({
      path: requestImage.filename,
    }));

    const orphanageData = {
      name,
      latitude,
      longitude,
      about,
      instructions,
      opening_hours,
      open_on_weekends: open_on_weekends === 'true',
      images,
    };

    const schema = Yup.object().shape({
      name: Yup.string().required(),
      latitude: Yup.number().required(),
      longitude: Yup.number().required(),
      about: Yup.string().required().max(300),
      instructions: Yup.string().required(),
      opening_hours: Yup.string().required(),
      open_on_weekends: Yup.boolean().required(),
      images: Yup.array(
        Yup.object().shape({
          path: Yup.string().required(),
        }),
      ),
    });

    await schema.validate(orphanageData, { abortEarly: false });

    const orphanage = Orphanage.create(orphanageData);

    await orphanage.save();

    return response.status(201).json(orphanage);
  },
};
