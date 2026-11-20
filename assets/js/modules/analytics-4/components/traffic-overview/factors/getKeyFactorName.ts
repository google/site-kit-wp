/**
 * Traffic Overview `getKeyFactorName` utility.
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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { BenchmarkingKeyFactorKind } from '@/js/modules/analytics-4/utils/benchmarking/types';
import { getLandingPageLabel } from './getLandingPageLabel';

/**
 * Gets the name a key factor card shows.
 *
 * A landing page's card names the site's homepage "Homepage", as its landing
 * page attributes do. The group of the paid channels has a name of the
 * plugin's, rather than one Analytics reports, so it is translated. Any other
 * card shows its label as the response has it.
 *
 * The dashboard's card and the PDF export name a card the same way.
 *
 * @since n.e.x.t
 *
 * @param {string} kind               The driver's kind, such as `CONTENT` for a landing page.
 * @param {string} label              The driver's name, such as `Referral`, or the landing page's path.
 * @param {string} [referenceSiteURL] Optional. The site's URL, which a landing page's path is resolved against.
 * @return {string} The card's name.
 */
export function getKeyFactorName(
	kind: BenchmarkingKeyFactorKind,
	label: string,
	referenceSiteURL?: string
): string {
	if ( kind === 'CONTENT' ) {
		return getLandingPageLabel( label, referenceSiteURL );
	}

	if ( kind === 'CHANNEL_GROUP' ) {
		return __( 'Paid traffic', 'google-site-kit' );
	}

	return label;
}
