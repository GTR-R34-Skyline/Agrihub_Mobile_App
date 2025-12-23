// Image compression utility
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

export const compressImage = async (uri: string): Promise<string> => {
  try {
    // Compress and resize image
    const manipulatedImage = await manipulateAsync(
      uri,
      [
        { resize: { width: 800 } }, // Resize to max width of 800px
      ],
      {
        compress: 0.5, // 50% quality
        format: SaveFormat.JPEG,
        base64: true,
      }
    );

    if (!manipulatedImage.base64) {
      throw new Error('Failed to get base64');
    }

    return manipulatedImage.base64;
  } catch (error) {
    console.error('Image compression error:', error);
    throw error;
  }
};

export const pickAndCompressImage = async (): Promise<string | null> => {
  try {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to upload images!');
      return null;
    }

    // Pick image
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true,
    });

    if (result.canceled || !result.assets[0]) {
      return null;
    }

    // Check size (max ~500KB)
    if (result.assets[0].base64) {
      const sizeInBytes = (result.assets[0].base64.length * 3) / 4;
      if (sizeInBytes > 500000) {
        // Further compress if larger than 500KB
        return await compressImage(result.assets[0].uri);
      }
      return result.assets[0].base64;
    }

    return null;
  } catch (error) {
    console.error('Pick and compress image error:', error);
    return null;
  }
};

export const getBase64ImageUri = (base64: string): string => {
  if (base64.startsWith('data:')) {
    return base64;
  }
  return `data:image/jpeg;base64,${base64}`;
};
