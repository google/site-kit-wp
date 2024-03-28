/**
 * WordPress dependencies
 */
import { createURL } from '@wordpress/e2e-test-utils';
import { fetchPageContent } from '../utils';

/**
 * Asserts the URL at the given path contains an Ads tag.
 *
 * @since n.e.x.t
 *
 * @param {(string|Object)} path The string URI or page object.
 * @return {Object} Matcher results.
 */
export async function toHaveAdsTag( path ) {
	const urlToFetch =
		'object' === typeof path ? path.url() : createURL( path );

	const html = await fetchPageContent( urlToFetch, { credentials: 'omit' } );

	const adsTagRegex = /gtag\('config', 'AW-\d+'\)/;

	// Search for the tag in the returned page HTML content.
	const hasAdsTag = adsTagRegex.test( html );

	const message = () =>
		hasAdsTag ? 'Ads tag detected' : 'Ads tag not detected';

	return { pass: hasAdsTag, message };
}
