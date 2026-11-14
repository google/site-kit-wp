/**
 * `formatVisitsChange` utility.
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
import { _n, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { numFmt } from '@/js/util';

/**
 * Formats a change in visits with its sign and unit, such as "+65 visits" or
 * "-1 visit".
 *
 * @since n.e.x.t
 *
 * @param {number} change The change in visits, negative for a drop.
 * @return {string} The change with its sign and unit.
 */
export function formatVisitsChange( change: number ): string {
	return sprintf(
		/* translators: %s: a change in visits with its sign, such as "+65" or "-21" */
		_n( '%s visit', '%s visits', Math.abs( change ), 'google-site-kit' ),
		numFmt( change, {
			style: 'decimal',
			signDisplay: 'exceptZero',
			maximumFractionDigits: 0,
		} )
	);
}
