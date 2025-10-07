import { defineConfig } from 'vitest/config';
// eslint-disable-next-line import/default
import react from '@vitejs/plugin-react';
import path from 'path';
import mockAssetsPlugin from './mock-assets-plugin.js';

export default defineConfig( {
	plugins: [ mockAssetsPlugin(), react() ],
	// TODO: Rename any files which use JSX to .jsx in #11442
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
			path.resolve( __dirname, './vitest-console-matchers.js' ),
		],
		transformMode: {
			web: [ /\.[jt]sx?$/ ],
		},
	},
} );
