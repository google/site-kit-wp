/**
 * Custom matcher for testing <amp-auto-ads> exists on a page.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Asserts the URL at the given path contains an <amp-auto-ads> tag.
 *
 * @since 1.21.0
 *
 * @param {string} path The URL path of the current site to check.
 * @return {Object} Matcher result.
 */
export async function toHaveAMPAutoAdsTag( path ) {
	const result = {};

	const page = await browser.newPage();
	await page.goto( path );

	try {
		await expect( page ).toMatchElement( 'amp-auto-ads' );
		result.pass = true;
		result.message = () =>
			`Expected ${ path } not to contain an <amp-auto-ads> tag.`;
	} catch {
		result.pass = false;
		result.message = () =>
			`Expected ${ path } to contain an <amp-auto-ads> tag.`;
	}

	await page.close();

	return result;
}
