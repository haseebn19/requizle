/**
 * Tests for mediaStorage utility
 * Tests IndexedDB operations using fake-indexeddb
 */
import {describe, it, expect, beforeEach} from 'vitest';
import {
    storeMedia,
    getMedia,
    deleteMedia,
    getAllMediaIds,
    clearAllMedia,
    isIndexedDBMedia,
    extractMediaId,
    createMediaRef
} from './mediaStorage';

// Mock IndexedDB with fake-indexeddb
import 'fake-indexeddb/auto';

describe('mediaStorage', () => {
    beforeEach(async () => {
        // Clear all data before each test
        await clearAllMedia();
    });

    describe('storeMedia', () => {
        it('should store media and return an id', async () => {
            const dataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
            const filename = 'test.png';

            const id = await storeMedia(dataUri, filename);

            expect(id).toMatch(/^media-\d+-[a-z0-9]+$/);
        });

        it('should store media with correct metadata', async () => {
            const dataUri = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';
            const filename = 'photo.jpg';

            const id = await storeMedia(dataUri, filename);
            const entry = await getMedia(id);

            expect(entry).not.toBeNull();
            expect(entry?.filename).toBe('photo.jpg');
            expect(entry?.mimeType).toBe('image/jpeg');
            expect(entry?.data).toBe(dataUri);
            expect(entry?.size).toBe(dataUri.length);
            expect(entry?.createdAt).toBeLessThanOrEqual(Date.now());
        });

        it('should extract mime type from data URI', async () => {
            const videoUri = 'data:video/mp4;base64,AAAAHGZ0eXBpc29t';
            const id = await storeMedia(videoUri, 'video.mp4');
            const entry = await getMedia(id);

            expect(entry?.mimeType).toBe('video/mp4');
        });

        it('should use fallback mime type for unknown format', async () => {
            const unknownUri = 'data:;base64,SGVsbG8=';
            const id = await storeMedia(unknownUri, 'unknown.bin');
            const entry = await getMedia(id);

            expect(entry?.mimeType).toBe('application/octet-stream');
        });
    });

    describe('getMedia', () => {
        it('should retrieve stored media by id', async () => {
            const dataUri = 'data:image/png;base64,test123';
            const id = await storeMedia(dataUri, 'test.png');

            const entry = await getMedia(id);

            expect(entry).not.toBeNull();
            expect(entry?.id).toBe(id);
            expect(entry?.data).toBe(dataUri);
        });

        it('should return null for non-existent id', async () => {
            const entry = await getMedia('non-existent-id');

            expect(entry).toBeNull();
        });
    });

    describe('deleteMedia', () => {
        it('should delete media by id', async () => {
            const id = await storeMedia('data:image/png;base64,test', 'test.png');

            await deleteMedia(id);

            const entry = await getMedia(id);
            expect(entry).toBeNull();
        });

        it('should not throw when deleting non-existent id', async () => {
            await expect(deleteMedia('non-existent')).resolves.not.toThrow();
        });
    });

    describe('getAllMediaIds', () => {
        it('should return empty array when no media stored', async () => {
            const ids = await getAllMediaIds();

            expect(ids).toEqual([]);
        });

        it('should return all stored media ids', async () => {
            const id1 = await storeMedia('data:image/png;base64,a', 'a.png');
            const id2 = await storeMedia('data:image/png;base64,b', 'b.png');
            const id3 = await storeMedia('data:video/mp4;base64,c', 'c.mp4');

            const ids = await getAllMediaIds();

            expect(ids).toHaveLength(3);
            expect(ids).toContain(id1);
            expect(ids).toContain(id2);
            expect(ids).toContain(id3);
        });
    });

    describe('clearAllMedia', () => {
        it('should remove all stored media', async () => {
            await storeMedia('data:image/png;base64,a', 'a.png');
            await storeMedia('data:image/png;base64,b', 'b.png');

            await clearAllMedia();

            const ids = await getAllMediaIds();
            expect(ids).toEqual([]);
        });
    });

    describe('helper functions', () => {
        describe('isIndexedDBMedia', () => {
            it('should return true for idb: references', () => {
                expect(isIndexedDBMedia('idb:media-123')).toBe(true);
                expect(isIndexedDBMedia('idb:anything')).toBe(true);
            });

            it('should return false for other references', () => {
                expect(isIndexedDBMedia('https://example.com/image.png')).toBe(false);
                expect(isIndexedDBMedia('data:image/png;base64,test')).toBe(false);
                expect(isIndexedDBMedia('file.png')).toBe(false);
                expect(isIndexedDBMedia('')).toBe(false);
            });
        });

        describe('extractMediaId', () => {
            it('should extract id from idb: reference', () => {
                expect(extractMediaId('idb:media-123-abc')).toBe('media-123-abc');
                expect(extractMediaId('idb:test')).toBe('test');
            });

            it('should handle edge cases', () => {
                expect(extractMediaId('idb:')).toBe('');
                expect(extractMediaId('not-idb')).toBe('not-idb');
            });
        });

        describe('createMediaRef', () => {
            it('should create idb: reference from id', () => {
                expect(createMediaRef('media-123')).toBe('idb:media-123');
                expect(createMediaRef('test')).toBe('idb:test');
            });
        });

        describe('round-trip', () => {
            it('should create and extract media ref correctly', () => {
                const id = 'media-12345-abcdef';
                const ref = createMediaRef(id);
                const extracted = extractMediaId(ref);

                expect(extracted).toBe(id);
                expect(isIndexedDBMedia(ref)).toBe(true);
            });
        });
    });
});
