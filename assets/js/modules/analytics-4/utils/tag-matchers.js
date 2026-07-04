/**
 * Tag matching patterns.
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
 * Returns GA4 tag matchers.
 *
 * @since 1.35.0
 *
 * @return {Array.<RegExp>} Array of RegExp objects.
 */
export function getTagMatchers() {
	const tagMatchers = [
		/__gaTracker\s*\(\s*['|"]create['|"]\s*,\s*['|"](G-[a-zA-Z0-9]+)['|"], ?['|"]auto['|"]\s*\)/i,
		/_gaq\.push\s*\(\s*\[\s*['|"][^_]*_setAccount['|"]\s*,\s*['|"](G-[a-zA-Z0-9]+)['|"]\s*],?\s*\)/i,
		/<amp-analytics\s+[^>]*type="gtag"[^>]*>[^<]*<script\s+type="application\/json">[^<]*"gtag_id"\s*:\s*"(G-[a-zA-Z0-9]+)"/i,
		/<amp-analytics\s+[^>]*type="googleanalytics"[^>]*>[^<]*<script\s+type="application\/json">[^<]*"account"\s*:\s*"(G-[a-zA-Z0-9]+)"/i,
	];

	for ( const subdomain of [ '', 'www\\.' ] ) {
		tagMatchers.push(
			new RegExp(
				`<script\\s+[^>]*src=['|"]https?://${ subdomain }googletagmanager\\.com/gtag/js\\?id=(G-[a-zA-Z0-9]+)['|"][^>]*></script>`,
				'i'
			),
			new RegExp(
				`<script\\s+[^>]*src=['|"]https?://${ subdomain }googletagmanager\\.com/gtag/js\\?id=(G-[a-zA-Z0-9]+)['|"][^/]*/>`,
				'i'
			)
		);
	}

	for ( const func of [ '__gaTracker', 'ga', 'gtag' ] ) {
		tagMatchers.push(
			new RegExp(
				`${ func }\\s*\\(\\s*['|"]create['|"]\\s*,\\s*['|"](G-[a-zA-Z0-9]+)['|"],\\s*['|"]auto['|"]\\s*\\)`,
				'i'
			),
			new RegExp(
				`${ func }\\s*\\(\\s*['|"]config['|"]\\s*,\\s*['|"](G-[a-zA-Z0-9]+)['|"]\\s*\\)`,
				'i'
			)
		);
	}

	return tagMatchers;
}

export default getTagMatchers();
