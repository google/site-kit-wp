/**
 * Internal dependencies
 */
import { wpApiFetch } from './wp-api-fetch';

const defaultAnalytics4Settings = {
	accountID: '100',
	propertyID: '500',
	webDataStreamID: '600',
	measurementID: 'G-700',
	useSnippet: true,
};

/**
 * Activates the Analytics module and completes the GA4 setup process.
 *
 * @since 1.104.0
 *
 * @param {Object} settingsOverrides Optional settings to override the defaults.
 */
export async function setupAnalytics4( settingsOverrides = {} ) {
	const settings = {
		...defaultAnalytics4Settings,
		...settingsOverrides,
	};
	// Activate the module.
	await wpApiFetch( {
		method: 'post',
		path: 'google-site-kit/v1/core/modules/data/activation',
		data: {
			data: { slug: 'analytics-4', active: true },
		},
	} );
	// Set placeholder connection data.
	await wpApiFetch( {
		method: 'post',
		path: 'google-site-kit/v1/modules/analytics-4/data/settings',
		data: {
			data: settings,
		},
	} );
}
