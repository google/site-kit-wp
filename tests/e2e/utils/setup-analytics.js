/**
 * Internal dependencies
 */
import { wpApiFetch } from './wp-api-fetch';

const defaultConnection = {
	accountId: 100,
	propertyId: 200,
	profileId: 300,
	internalWebPropertyId: 400,
};

/**
 * Activate and set up the Analytics module.
 * @param {Object} config Optional configuration to use for module set up.
 */
export async function setupAnalytics( config = { connection: defaultConnection } ) {
	// Activate the module.
	await wpApiFetch( {
		method: 'post',
		path: 'google-site-kit/v1/modules/analytics',
		data: { active: true },
	} );
	// Set dummy connection data.
	await wpApiFetch( {
		method: 'post',
		path: 'google-site-kit/v1/modules/analytics/data/connection',
		data: {
			data: config.connection,
		},
		parse: false,
	} );
}
