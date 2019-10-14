/**
 * Internal dependencies
 */
import { wpApiFetch } from './wp-api-fetch';

const defaultConnection = {
	accountId: 100,
	propertyId: 200,
	profileId: 300,
	internalWebPropertyId: 400,
	useSnippet: true,
	// ampClientIdOptIn: (bool)
};

/**
 * Activate and set up the Analytics module.
 * @param {Object} connectionOverrides Optional connection overrides to use for module set up.
 */
export async function setupAnalytics( connectionOverrides = {} ) {
	const connection = {
		...defaultConnection,
		...connectionOverrides,
	};
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
			data: connection,
		},
		parse: false,
	} );

	if ( connection.useSnippet ) {
		await wpApiFetch( {
			method: 'post',
			path: 'google-site-kit/v1/modules/analytics/data/use-snippet',
			data: {
				data: { useSnippet: true },
			},
			parse: false,
		} );
	}
}
