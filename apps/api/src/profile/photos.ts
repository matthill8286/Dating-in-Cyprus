import { isEuAzureRegion } from '../region';

export type StoredPhoto = {
  photoId: string;
  url: string;
  contentType: string;
};

export interface PhotoStore {
  put(input: { bytes: Buffer; contentType: string }): Promise<StoredPhoto>;
  get(photoId: string): Promise<StoredPhoto | null>;
}

export class MemoryPhotoStore implements PhotoStore {
  private readonly byId = new Map<string, StoredPhoto>();

  constructor(private readonly region: string) {
    if (!isEuAzureRegion(region)) {
      throw new Error('PHOTO_STORE_REGION must be an EU Azure region');
    }
  }

  async put(input: { bytes: Buffer; contentType: string }): Promise<StoredPhoto> {
    const photoId = crypto.randomUUID();
    const stored: StoredPhoto = {
      photoId,
      contentType: input.contentType,
      url: `https://photos.${this.region}.blob.core.windows.net/profiles/${photoId}`,
    };
    this.byId.set(photoId, stored);
    return stored;
  }

  async get(photoId: string): Promise<StoredPhoto | null> {
    return this.byId.get(photoId) ?? null;
  }
}
