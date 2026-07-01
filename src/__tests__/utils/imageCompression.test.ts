const mockPlatform = { OS: 'ios' as string };
const mockManipulate = jest.fn();
const mockResize = jest.fn();
const mockRenderAsync = jest.fn();
const mockSaveAsync = jest.fn();

jest.mock('react-native', () => ({ Platform: mockPlatform }));
jest.mock('expo-image-manipulator', () => ({
  ImageManipulator: { manipulate: (uri: string) => mockManipulate(uri) },
  SaveFormat: { JPEG: 'jpeg' },
}));

// eslint-disable-next-line import/first -- import must follow jest.mock setup above
import { compressImage } from '@/utils/imageCompression';

describe('compressImage', () => {
  beforeEach(() => {
    mockPlatform.OS = 'ios';
    jest.clearAllMocks();
    const context = { resize: mockResize, renderAsync: mockRenderAsync };
    mockResize.mockReturnValue(context);
    mockManipulate.mockReturnValue(context);
    mockRenderAsync.mockResolvedValue({ saveAsync: mockSaveAsync });
    mockSaveAsync.mockResolvedValue({ uri: 'file://compressed.jpg' });
  });

  it('returns the re-encoded URI and saves as JPEG with default quality', async () => {
    const result = await compressImage('file://original.jpg', { width: 800, height: 600 });
    expect(result).toBe('file://compressed.jpg');
    expect(mockSaveAsync).toHaveBeenCalledWith({ compress: 0.6, format: 'jpeg' });
  });

  it('does not resize when the longest edge is within the cap', async () => {
    await compressImage('file://small.jpg', { width: 800, height: 600 });
    expect(mockResize).not.toHaveBeenCalled();
  });

  it('caps the width for a landscape image over the limit', async () => {
    await compressImage('file://big.jpg', { width: 3200, height: 2400 });
    expect(mockResize).toHaveBeenCalledWith({ width: 1600 });
  });

  it('caps the height for a portrait image over the limit', async () => {
    await compressImage('file://tall.jpg', { width: 2400, height: 3200 });
    expect(mockResize).toHaveBeenCalledWith({ height: 1600 });
  });

  it('skips resizing when source dimensions are unknown', async () => {
    await compressImage('file://unknown.jpg');
    expect(mockResize).not.toHaveBeenCalled();
    expect(mockSaveAsync).toHaveBeenCalled();
  });

  it('fails open and returns the original URI when manipulation throws', async () => {
    mockSaveAsync.mockRejectedValueOnce(new Error('native failure'));
    const result = await compressImage('file://original.jpg', { width: 3200, height: 2400 });
    expect(result).toBe('file://original.jpg');
  });

  it('is a no-op on web', async () => {
    mockPlatform.OS = 'web';
    const result = await compressImage('blob://x', { width: 4000, height: 4000 });
    expect(result).toBe('blob://x');
    expect(mockManipulate).not.toHaveBeenCalled();
  });
});
