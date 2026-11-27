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
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getChannelName } from '@/js/modules/analytics-4/components/traffic-overview/utils';
import {
	BenchmarkingKeyFactor,
	BenchmarkingKeyFactorKind,
} from '@/js/modules/analytics-4/utils/benchmarking/types';
import { getLandingPageLabel } from './getLandingPageLabel';

/**
 * Gets the name of the driver behind a key factor card's change.
 *
 * @since n.e.x.t
 *
 * @param {string} kind               The driver's kind, such as `CONTENT` for a landing page.
 * @param {string} label              The driver's name, such as `Referral`, or the landing page's path.
 * @param {string} [referenceSiteURL] Optional. The site's URL, which a landing page's path is resolved against.
 * @return {string} The driver's name.
 */
function getDriverName(
	kind: BenchmarkingKeyFactorKind,
	label: string,
	referenceSiteURL?: string
): string {
	switch ( kind ) {
		case 'CONTENT':
			return getLandingPageLabel( label, referenceSiteURL );
		case 'CHANNEL':
			return getChannelName( label );
		case 'CHANNEL_GROUP':
			return __( 'Paid traffic', 'google-site-kit' );
		default:
			return label;
	}
}

/**
 * Gets the name a key factor card shows.
 *
 * A landing page's card names the site's homepage "Homepage", as its landing
 * page attributes do. A channel's card shows the channel's name as
 * `getChannelName()` gives it, which translates the names of the plugin and
 * the Site Kit service, and the group of the paid channels is always "Paid
 * traffic". Any other card shows its label as the response has it.
 *
 * After a page that brought visits from several channels took a card of its
 * own, a channel's card, or the paid channels', is for the channel's other
 * pages, and reads "Direct (other pages)", for example.
 *
 * The dashboard's card and the PDF export name a card the same way.
 *
 * @since n.e.x.t
 *
 * @param {Object}  keyFactor              The card.
 * @param {string}  keyFactor.kind         The driver's kind, such as `CONTENT` for a landing page.
 * @param {string}  keyFactor.label        The driver's name, such as `Referral`, or the landing page's path.
 * @param {boolean} [keyFactor.otherPages] Optional. Whether the card is for its channel's other pages.
 * @param {string}  [referenceSiteURL]     Optional. The site's URL, which a landing page's path is resolved against.
 * @return {string} The card's name.
 */
export function getKeyFactorName(
	{
		kind,
		label,
		otherPages = false,
	}: Pick< BenchmarkingKeyFactor, 'kind' | 'otherPages' > & { label: string },
	referenceSiteURL?: string
): string {
	const name = getDriverName( kind, label, referenceSiteURL );

	if ( ! otherPages ) {
		return name;
	}

	return sprintf(
		/* translators: %s: the name of a traffic channel, such as "Direct", whose card is for its pages other than a page that took a card of its own */
		__( '%s (other pages)', 'google-site-kit' ),
		name
	);
}
