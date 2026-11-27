/**
 * Traffic Overview `getKeyFactorRows` utility.
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
import {
	KeyFactorAttributeCard,
	formatNetPairOffset,
	getKeyFactorAttributeShareText,
	isKeyFactorNetPair,
} from '@/js/modules/analytics-4/components/traffic-overview/utils';
import { BenchmarkingKeyFactorAttribute } from '@/js/modules/analytics-4/utils/benchmarking/types';
import { getKeyFactorAttributeName } from './getKeyFactorAttributeName';

/** An attribute of a key factor card that has a value to name. */
export type NamedKeyFactorAttribute = BenchmarkingKeyFactorAttribute & {
	label: string;
};

/** A row a key factor card lists under "Top changes". */
export interface KeyFactorRow {
	/** The attribute the row shows. */
	attribute: NamedKeyFactorAttribute;
	/** The name the row shows for the attribute's value, as `getKeyFactorAttributeName()` gives it. */
	name: string;
	/**
	 * The line under the row's change: what the change is a share of, as
	 * `getKeyFactorAttributeShareText()` gives it, or, on the first side of a
	 * net, the second side that partly offset it. Null when the row shows its
	 * change alone.
	 */
	shareText: string | null;
}

/**
 * Gets the rows a key factor card lists, one for each attribute, except that
 * the two sides of a net are one row, as the Site Kit service connects them on
 * one line: the first side, whose line names the second side and its change,
 * such as "Partly offset by -362 visits from mobile".
 *
 * @since n.e.x.t
 *
 * @param {Object} card               The card.
 * @param {string} card.kind          The card's kind, such as `CHANNEL`.
 * @param {number} card.change        The card's change in visits, negative for a drop.
 * @param {Array}  attributes         The card's attributes that have a value, in the order to list them.
 * @param {string} [referenceSiteURL] Optional. The site's URL, which a landing page's path is resolved against.
 * @return {Array<Object>} The rows, in the order to list them.
 */
export function getKeyFactorRows(
	card: KeyFactorAttributeCard,
	attributes: NamedKeyFactorAttribute[],
	referenceSiteURL?: string
): KeyFactorRow[] {
	const rows: KeyFactorRow[] = [];

	// A plain loop, since the second side of a net is skipped.
	for ( let index = 0; index < attributes.length; index++ ) {
		const attribute = attributes[ index ];
		const next = attributes[ index + 1 ];
		const name = getKeyFactorAttributeName( attribute, referenceSiteURL );

		if ( next && isKeyFactorNetPair( attribute, next ) ) {
			rows.push( {
				attribute,
				name,
				shareText: formatNetPairOffset(
					next.current - next.previous,
					getKeyFactorAttributeName( next, referenceSiteURL )
				),
			} );

			// The first side's line names the second side, so it isn't
			// listed on its own.
			index++;
		} else {
			rows.push( {
				attribute,
				name,
				shareText: getKeyFactorAttributeShareText( card, attribute ),
			} );
		}
	}

	return rows;
}
