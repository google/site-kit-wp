/**
 * Traffic Overview `getKeyFactorAttributeName` utility.
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
 * Internal dependencies
 */
import { getChannelName } from '@/js/modules/analytics-4/components/traffic-overview/utils';
import { BenchmarkingKeyFactorAttribute } from '@/js/modules/analytics-4/utils/benchmarking/types';
import { getLandingPageLabel } from './getLandingPageLabel';

/**
 * Gets the name an attribute of a key factor card shows for its value.
 *
 * A landing page shows the page's title when the response has one, and
 * otherwise "Homepage" for the site's homepage or the page's path. Either way,
 * it links to the page by its path. A traffic channel shows its name as
 * `getChannelName()` gives it. Any other attribute shows its value as the
 * response has it.
 *
 * @since n.e.x.t
 *
 * @param {Object} attribute          The attribute.
 * @param {string} attribute.kind     The attribute's kind, such as `LANDING_PAGE`.
 * @param {string} attribute.label    The attribute's value, such as a page path.
 * @param {string} [attribute.title]  Optional. The page's title, for a landing page.
 * @param {string} [referenceSiteURL] Optional. The site's URL, which a landing page's path is resolved against.
 * @return {string} The name to show.
 */
export function getKeyFactorAttributeName(
	{
		kind,
		label,
		title,
	}: Pick< BenchmarkingKeyFactorAttribute, 'kind' | 'title' > & {
		label: string;
	},
	referenceSiteURL?: string
): string {
	switch ( kind ) {
		case 'LANDING_PAGE':
			return title || getLandingPageLabel( label, referenceSiteURL );
		case 'TRAFFIC_CHANNEL':
			return getChannelName( label );
		default:
			return label;
	}
}
