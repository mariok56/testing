import {Platform} from 'react-native';

// Types for images from the image picker
export interface ImagePickerAsset {
  uri: string;
  width?: number;
  height?: number;
  type?: string;
  fileName?: string;
  fileSize?: number;
}

// Types for product images
export interface ProductImage {
  url: string;
  _id?: string;
}

// Types for user profile images
export interface ProfileImage {
  url: string;
}

// Helper function to format an image picker asset for form data
export const formatImageForUpload = (
  image: ImagePickerAsset,
  index: number,
) => {
  return {
    name: image.fileName || `photo_${index}_${Date.now()}.jpg`,
    type: image.type || 'image/jpeg',
    uri: Platform.OS === 'ios' ? image.uri.replace('file://', '') : image.uri,
  };
};
