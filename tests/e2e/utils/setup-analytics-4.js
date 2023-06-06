/**
 * Internal dependencies
 */
import { wpApiFetch } from './wp-api-fetch';

const defaultSettings = {
	ownerID: 0,
	accountID: '123456',
	propertyID: '200000',
	webDataStreamID: '300000',
	measurementID: 'G-1A2BCD346E',
	useSnippet: true,
	googleTagAccountID: '123456',
	googleTagContainerID: '321654',
	googleTagID: 'GT-123456',
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
