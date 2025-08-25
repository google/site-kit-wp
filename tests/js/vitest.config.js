import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig( {
	plugins: [ react() ],
	// TODO: Rename any files which use JSX to .jsx.
	// This is a temporary workaround to allow JSX in .js files but this adds overhead
	// as every js file is interpreted as a JSX file evn if it doesn't contain JSX.
	esbuild: {
		include: /\.js$/,
		exclude: [],
		loader: 'jsx',
	},
	resolve: {
		alias: [
			{
				find: /^googlesitekit-(.+)$/,
				replacement: path.resolve(
					__dirname,
					'../../assets/js/googlesitekit-$1.js'
				),
			},
			{
				find: '@',
				replacement: path.resolve( __dirname, '../../assets' ),
			},
		],
	},
	define: {
		'import.meta.vitest': 'undefined',
	},
	test: {
		globals: true,
		environment: 'jsdom',
		coverage: {
			reporter: [ 'text', 'json', 'html' ],
		},
		root: '../../',
		setupFiles: [
			path.resolve( __dirname, './setup-globals.js' ),
			path.resolve( __dirname, './vitest-localstorage-mock.js' ),
			path.resolve( __dirname, './setup-before-after.js' ),
		],
		// TODO: jest matchers are not compatible with Vitest, so we need to find replacements for these.
		// setupFilesAfterEnv: [ path.resolve( __dirname, './jest-matchers.js' ) ],
		transformMode: {
			web: [ /\.[jt]sx?$/ ],
		},
	},
} );
