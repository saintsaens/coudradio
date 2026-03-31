import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveProgress, loadProgress, cleanupProgress } from '../../services/channelCreationService/progressSavingService.js';
import fs from 'fs/promises';

vi.mock('fs/promises', () => ({
    default: {
        mkdir: vi.fn(),
        writeFile: vi.fn(),
        readFile: vi.fn(),
        rm: vi.fn(),
    },
}));

beforeEach(() => {
    process.env.PUBLIC_MPD_PATH = '/tmp/mpd';
});

describe('saveProgress', () => {
    it('creates the directory then writes the progress file as JSON', async () => {
        vi.mocked(fs.mkdir).mockResolvedValue(undefined);
        vi.mocked(fs.writeFile).mockResolvedValue(undefined);

        await saveProgress('lofi', 3);

        expect(fs.mkdir).toHaveBeenCalledWith('/tmp/mpd', { recursive: true });
        expect(fs.writeFile).toHaveBeenCalledWith(
            '/tmp/mpd/.lofi.progress.json',
            JSON.stringify({ lastIndex: 3 }),
            'utf-8'
        );
    });
});

describe('loadProgress', () => {
    it('reads the file and returns lastIndex', async () => {
        vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify({ lastIndex: 5 }));

        const result = await loadProgress('lofi');

        expect(fs.readFile).toHaveBeenCalledWith('/tmp/mpd/.lofi.progress.json', 'utf-8');
        expect(result).toBe(5);
    });

    it('returns -1 when the progress file does not exist', async () => {
        vi.mocked(fs.readFile).mockRejectedValue(new Error('ENOENT: no such file'));

        const result = await loadProgress('lofi');

        expect(result).toBe(-1);
    });
});

describe('cleanupProgress', () => {
    it('removes the progress file with force: true', async () => {
        vi.mocked(fs.rm).mockResolvedValue(undefined);

        await cleanupProgress('lofi');

        expect(fs.rm).toHaveBeenCalledWith('/tmp/mpd/.lofi.progress.json', { force: true });
    });
});
