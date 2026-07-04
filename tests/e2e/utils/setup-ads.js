/**
 * Internal dependencies
 */
import { MODULE_SLUG_ADS } from '../../../assets/js/modules/ads/constants';
import { wpApiFetch } from './wp-api-fetch';

const defaultAdsSettings = {
	adsConversionID: 'AW-12345',
};

/**
 * Activates the Ads module and completes the setup process.
 *
 * @since 1.125.0
 *
 * @param {Object} settingsOverrides Optional settings to override the defaults.
 */
export async function setupAds( settingsOverrides = {} ) {
	const settings = {
		...defaultAdsSettings,
		...settingsOverrides,
	};
	// Activate the module.
	await wpApiFetch( {
		method: 'post',
		path: 'google-site-kit/v1/core/modules/data/activation',
		data: {
			data: { slug: MODULE_SLUG_ADS, active: true },
		},
	} );
	// Set placeholder connection data.
	await wpApiFetch( {
		method: 'post',
		path: 'google-site-kit/v1/modules/ads/data/settings',
		data: {
			data: settings,
		},
	} );
}
