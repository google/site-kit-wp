/**
 * WordPress dependencies
 */
import { createURL } from '@wordpress/e2e-test-utils';

/**
 * Asserts the URL at the given path contains an AdSense tag.
 *
 * @since 1.10.0
 *
 * @param {string} path The URL path of the current site to check.
 * @return {Object} Matcher result.
 */
export async function toHaveAdSenseTag( path ) {
	const result = {};

	const page = await browser.newPage();
	await page.goto( createURL( path ) );

	try {
		await expect( page ).toMatchElement(
			'script[src*="//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client="]'
		);
		result.pass = true;
		result.message = () =>
			`Expected ${ path } not to contain an Adsense tag.`;
	} catch {
		result.pass = false;
		result.message = () => `Expected ${ path } to contain an Adsense tag.`;
	}

	await page.close();

	return result;
}
