/**
 * Internal dependencies
 */
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '../../../assets/js/modules/reader-revenue-manager/constants';
import { wpApiFetch } from './wp-api-fetch';

const defaultReaderRevenueManagerSettings = {
	publicationID: 'test-publication-id',
	publicationOnboardingState: 'ONBOARDING_COMPLETE',
	snippetMode: 'sitewide',
	postTypes: [],
	productID: 'test-product-id',
	productIDs: [ 'test-product-id' ],
	paymentOption: 'test-payment-option',
};

/**
 * Activates the Reader Revenue Manager module and completes the setup process.
 *
 * @since 1.125.0
 *
 * @param {Object} settingsOverrides Optional settings to override the defaults.
 */
export async function setupReaderRevenueManager( settingsOverrides = {} ) {
	const settings = {
		...defaultReaderRevenueManagerSettings,
		...settingsOverrides,
	};
	// Activate the module.
	await wpApiFetch( {
		method: 'post',
		path: 'google-site-kit/v1/core/modules/data/activation',
		data: {
			data: { slug: MODULE_SLUG_READER_REVENUE_MANAGER, active: true },
		},
	} );
	// Set placeholder connection data.
	await wpApiFetch( {
		method: 'post',
		path: 'google-site-kit/v1/modules/reader-revenue-manager/data/settings',
		data: {
			data: settings,
		},
	} );
}
