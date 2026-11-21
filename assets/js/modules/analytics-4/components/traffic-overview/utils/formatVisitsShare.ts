/**
 * Traffic Overview `formatVisitsShare` utility.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { numFmt } from '@/js/util';

/**
 * Formats a key factor's share of the site's visits, such as "45.2% of all
 * visits", which a card shows on a steady period.
 *
 * @since n.e.x.t
 *
 * @param {number} visitsSharePct The share of the site's visits, in percent, such as `45.2`.
 * @return {string} The share, with one decimal at most.
 */
export function formatVisitsShare( visitsSharePct: number ): string {
	return sprintf(
		/* translators: %s: the share of the site's visits that a channel brought, such as "45.2%" */
		__( '%s of all visits', 'google-site-kit' ),
		numFmt( visitsSharePct / 100, {
			style: 'percent',
			maximumFractionDigits: 1,
		} )
	);
}
