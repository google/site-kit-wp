/**
 * Internal dependencies
 */
import { wpApiFetch } from './wp-api-fetch';

const defaultSettings = {
	accountID: 100,
	propertyID: 200,
	profileID: 300,
	internalWebPropertyID: 400,
	useSnippet: true,
};

/**
 * Activate and set up the Analytics module.
 * @param {Object} settingsOverrides Optional settings to override the defaults.
 */
export async function setupAnalytics( settingsOverrides = {} ) {
	const settings = {
		...defaultSettings,
		...settingsOverrides,
	};
	// Activate the module.
	await wpApiFetch( {
		method: 'post',
		path: 'google-site-kit/v1/core/modules/data/activation',
		data: {
			data: { slug: 'analytics', active: true },
		},
	} );
	// Set dummy connection data.
	await wpApiFetch( {
		method: 'post',
		path: 'google-site-kit/v1/modules/analytics/data/settings',
		data: {
			data: settings,
		},
		parse: false,
	} );
}
