import { defineConfig } from 'vitest/config';

export default defineConfig( {
	test: {
		globals: true,
		environment: 'jsdom',
		coverage: {
			reporter: [ 'text', 'json', 'html' ],
		},
		root: '../../',
		esbuild: {
			loader: 'jsx',
			include: /assets\/js\/.*\.(js|jsx|ts|tsx)$/,
			exclude: /node_modules/,
		},
	},
} );
