/**
 * Internal dependencies
 */
import { wpApiFetch } from './wp-api-fetch';

const defaultSettings = {
	ownerID: 0,
	accountID: 100,
	propertyID: 200,
	webDataStreamID: 300,
	measurementID: 400,
	useSnippet: true,
	googleTagID: '',
	googleTagAccountID: '',
	googleTagContainerID: '',
};

/**
 * Activates the Analytics-4 module and complete the setup process.
 *
 * @since n.e.x.t
 *
 * @param {Object} settingsOverrides Optional settings to override the defaults.
 */
export async function setupAnalytics4( settingsOverrides = {} ) {
	const settings = {
		...defaultSettings,
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
