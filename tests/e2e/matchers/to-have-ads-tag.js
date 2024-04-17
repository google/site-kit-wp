/**
 * Matcher functions for Ads tags.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
 * WordPress dependencies
 */
import { createURL } from '@wordpress/e2e-test-utils';
import { fetchPageContent } from '../utils';

/**
 * Asserts the URL at the given path contains an Ads web tag.
 *
 * @since 1.125.0
 *
 * @param {(string|Object)} path The string URI or page object.
 * @return {Object} Matcher results.
 */
export async function toHaveAdsTag( path ) {
	const urlToFetch =
		'object' === typeof path ? path.url() : createURL( path );

	const html = await fetchPageContent( urlToFetch, { credentials: 'omit' } );

	const adsTagRegex = /\("config",\s*"AW-+\d+"\)/;

	// Search for the tag in the returned page HTML content.
	const hasAdsTag = adsTagRegex.test( html );

	const message = () =>
		hasAdsTag ? 'Ads tag detected' : 'Ads tag not detected';

	return { pass: hasAdsTag, message };
}
