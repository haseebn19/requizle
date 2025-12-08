/// <reference types="vitest" />
import {defineConfig} from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/test/setup.ts',
        css: true,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'text-summary', 'html', 'json-summary'],
            exclude: [
                'node_modules/**',
                'src/test/**',
                '**/*.test.{ts,tsx}',
                '**/*.d.ts',
                'src/main.tsx',
                'src/vite-env.d.ts',
                '*.config.{js,ts}',
            ],
            reportsDirectory: './coverage',
        },
    },
});
