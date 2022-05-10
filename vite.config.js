// vite.config.js
import path from 'path';
import { defineConfig } from 'vite';
import inject from '@rollup/plugin-inject';
import { viteExternalsPlugin } from 'vite-plugin-externals';
import react from '@vitejs/plugin-react';

export default defineConfig( {
	build: {
		rollupOptions: {
			input: {
				////////// Basic Modules //////////
				'googlesitekit-i18n': './assets/js/googlesitekit-i18n.js',
				// Analytics advanced tracking script to be injected in the frontend.
				'analytics-advanced-tracking':
					'./assets/js/analytics-advanced-tracking.js',
				////////// Module Entry Points //////////
				'googlesitekit-api': './assets/js/googlesitekit-api.js',
				'googlesitekit-data': './assets/js/googlesitekit-data.js',
				'googlesitekit-datastore-site':
					'./assets/js/googlesitekit-datastore-site.js',
				'googlesitekit-datastore-user':
					'./assets/js/googlesitekit-datastore-user.js',
				'googlesitekit-datastore-forms':
					'./assets/js/googlesitekit-datastore-forms.js',
				'googlesitekit-datastore-location':
					'./assets/js/googlesitekit-datastore-location.js',
				'googlesitekit-datastore-ui':
					'./assets/js/googlesitekit-datastore-ui.js',
				'googlesitekit-modules': './assets/js/googlesitekit-modules.js',
				'googlesitekit-widgets': './assets/js/googlesitekit-widgets.js',
				'googlesitekit-modules-adsense':
					'./assets/js/googlesitekit-modules-adsense.js',
				'googlesitekit-modules-analytics':
					'./assets/js/googlesitekit-modules-analytics.js',
				'googlesitekit-modules-analytics-4':
					'./assets/js/googlesitekit-modules-analytics-4.js',
				'googlesitekit-modules-idea-hub':
					'./assets/js/googlesitekit-modules-idea-hub.js',
				'googlesitekit-modules-optimize':
					'./assets/js/googlesitekit-modules-optimize.js',
				'googlesitekit-modules-pagespeed-insights':
					'assets/js/googlesitekit-modules-pagespeed-insights.js',
				'googlesitekit-modules-search-console':
					'./assets/js/googlesitekit-modules-search-console.js',
				'googlesitekit-modules-subscribe-with-google':
					'./assets/js/googlesitekit-modules-subscribe-with-google.js',
				'googlesitekit-modules-tagmanager':
					'./assets/js/googlesitekit-modules-tagmanager.js',
				'googlesitekit-user-input':
					'./assets/js/googlesitekit-user-input.jsx',
				'googlesitekit-idea-hub-post-list':
					'./assets/js/googlesitekit-idea-hub-post-list.jsx',
				'googlesitekit-polyfills':
					'./assets/js/googlesitekit-polyfills.js',
				// Old Modules
				'googlesitekit-activation':
					'./assets/js/googlesitekit-activation.jsx',
				'googlesitekit-adminbar':
					'./assets/js/googlesitekit-adminbar.jsx',
				'googlesitekit-settings':
					'./assets/js/googlesitekit-settings.jsx',
				'googlesitekit-dashboard':
					'./assets/js/googlesitekit-dashboard.jsx',
				'googlesitekit-dashboard-details':
					'./assets/js/googlesitekit-dashboard-details.jsx',
				'googlesitekit-dashboard-splash':
					'./assets/js/googlesitekit-dashboard-splash.jsx',
				'googlesitekit-wp-dashboard':
					'./assets/js/googlesitekit-wp-dashboard.jsx',
				'googlesitekit-base': './assets/js/googlesitekit-base.js',
				'googlesitekit-module': './assets/js/googlesitekit-module.jsx',
			},
			external: {
				'googlesitekit-api': [ 'googlesitekit', 'api' ],
				'googlesitekit-data': [ 'googlesitekit', 'data' ],
				'googlesitekit-modules': [ 'googlesitekit', 'modules' ],
				'googlesitekit-widgets': [ 'googlesitekit', 'widgets' ],
				'@wordpress/i18n': [ 'googlesitekit', 'i18n' ],
			},
			output: {
				entryFileNames: 'assets/js/[name]-[hash].js',
				chunkFileNames: 'assets/js/[name]-[hash].js',
			},
			plugins: [
				inject( {
					React: [ '@wordpress/element', '*' ],
				} ),
				viteExternalsPlugin( {
					'googlesitekit-api': [ 'googlesitekit', 'api' ],
					'googlesitekit-data': [ 'googlesitekit', 'data' ],
					'googlesitekit-modules': [ 'googlesitekit', 'modules' ],
					'googlesitekit-widgets': [ 'googlesitekit', 'widgets' ],
					'@wordpress/i18n': [ 'googlesitekit', 'i18n' ],
				} ),
				react(),
			],
		},
		emptyOutDir: true,
	},
	resolve: {
		alias: {
			'@wordpress/api-fetch__non-shim': require.resolve(
				'@wordpress/api-fetch'
			),
			'@wordpress/api-fetch$': path.resolve(
				'assets/js/api-fetch-shim.js'
			),
			'@wordpress/i18n__non-shim': require.resolve( '@wordpress/i18n' ),
		},
	},
} );
