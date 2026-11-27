/**
 * Traffic Overview `getKeyFactorRows` utility tests.
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
import { NamedKeyFactorAttribute, getKeyFactorRows } from './getKeyFactorRows';

const REFERENCE_SITE_URL = 'https://example.com';

/**
 * Gets the name and the line of each row of a card.
 *
 * @since n.e.x.t
 *
 * @param {Object} card       The card, with `kind` and `change`.
 * @param {Array}  attributes The card's attributes.
 * @return {Array} One `[ name, shareText ]` pair per row.
 */
function getRowTexts(
	card: Parameters< typeof getKeyFactorRows >[ 0 ],
	attributes: NamedKeyFactorAttribute[]
) {
	return getKeyFactorRows( card, attributes, REFERENCE_SITE_URL ).map(
		( { name, shareText } ) => [ name, shareText ]
	);
}

describe( 'getKeyFactorRows', () => {
	it( 'should list each attribute with its name and its line', () => {
		expect(
			getRowTexts( { kind: 'CHANNEL', change: 365 }, [
				{
					kind: 'LANDING_PAGE',
					label: '/how-to-plant-garlic/',
					title: 'How to plant garlic',
					current: 300,
					previous: 40,
					sharePct: 71.2,
				},
				{
					kind: 'REFERRING_SITE',
					label: 'facebook.com',
					current: 92,
					previous: 60,
					sharePct: 8.8,
				},
			] )
		).toEqual( [
			[ 'How to plant garlic', '71.2% of the change' ],
			[ 'facebook.com', '8.8% of the change' ],
		] );
	} );

	it( 'should list the two sides of a net as one row, whose line names the second side and its change', () => {
		const rows = getKeyFactorRows(
			{ kind: 'CHANNEL', change: 1280 },
			[
				{
					kind: 'DEVICE',
					label: 'desktop',
					current: 2643,
					previous: 1000,
					sharePct: 0,
					oversized: true,
				},
				{
					kind: 'DEVICE',
					label: 'mobile',
					current: 638,
					previous: 1000,
					sharePct: 0,
				},
			],
			REFERENCE_SITE_URL
		);

		expect( rows ).toHaveLength( 1 );
		expect( rows[ 0 ] ).toMatchObject( {
			attribute: { label: 'desktop' },
			name: 'desktop',
			shareText: 'Partly offset by -362 visits from mobile',
		} );
	} );

	it( 'should name the second side of a net as its row would, such as "Homepage" for the site’s homepage', () => {
		expect(
			getRowTexts( { kind: 'CHANNEL', change: -50 }, [
				{
					kind: 'LANDING_PAGE',
					label: '/how-to-plant-garlic/',
					title: 'How to plant garlic',
					current: 40,
					previous: 102,
					sharePct: 0,
					oversized: true,
				},
				{
					kind: 'LANDING_PAGE',
					label: '/',
					current: 62,
					previous: 50,
					sharePct: 0,
				},
			] )
		).toEqual( [
			[
				'How to plant garlic',
				'Partly offset by +12 visits from Homepage',
			],
		] );
	} );

	it( 'should list a lone attribute larger than its card with the wording of its kind', () => {
		expect(
			getRowTexts( { kind: 'CHANNEL', change: 57 }, [
				{
					kind: 'LANDING_PAGE',
					label: '/',
					current: 161,
					previous: 100,
					sharePct: 0,
					oversized: true,
				},
			] )
		).toEqual( [ [ 'Homepage', 'While other pages fell' ] ] );
	} );

	it.each( [
		[
			'a search keyword',
			{
				kind: 'SEARCH_KEYWORD' as const,
				label: 'how to plant garlic',
				current: 310,
				previous: 90,
				sharePct: 0,
				oversized: true,
			},
		],
		[
			'a channel',
			{
				kind: 'TRAFFIC_CHANNEL' as const,
				label: 'Direct',
				current: 310,
				previous: 90,
				sharePct: 0,
			},
		],
	] )(
		'should not take %s for a side of a net',
		( _, attribute: NamedKeyFactorAttribute ) => {
			const rows = getKeyFactorRows(
				{ kind: 'CHANNEL', change: 100 },
				[
					attribute,
					{
						kind: 'DEVICE',
						label: 'mobile',
						current: 50,
						previous: 80,
						sharePct: 0,
					},
				],
				REFERENCE_SITE_URL
			);

			expect( rows ).toHaveLength( 2 );
			expect( rows[ 1 ].shareText ).toBeNull();
		}
	);

	it( 'should take a net only from adjacent attributes, and list the attribute before it on its own', () => {
		expect(
			getRowTexts( { kind: 'CHANNEL', change: 100 }, [
				{
					kind: 'SEARCH_KEYWORD',
					label: 'how to plant garlic',
					current: 30,
					previous: 10,
					sharePct: 1.2,
				},
				{
					kind: 'REFERRING_SITE',
					label: 'news.example',
					current: 150,
					previous: 10,
					sharePct: 0,
					oversized: true,
				},
				{
					kind: 'REFERRING_SITE',
					label: 'facebook.com',
					current: 20,
					previous: 60,
					sharePct: 0,
				},
			] )
		).toEqual( [
			[
				'how to plant garlic',
				'A change equal to 1.2% of the site’s search clicks',
			],
			[ 'news.example', 'Partly offset by -40 visits from facebook.com' ],
		] );
	} );

	it( 'should name the channels of a page’s card as `getChannelName()` does, with their shares of the page’s change', () => {
		expect(
			getRowTexts( { kind: 'CONTENT', change: 400 }, [
				{
					kind: 'TRAFFIC_CHANNEL',
					label: 'Cross-network ads',
					current: 260,
					previous: 10,
					sharePct: 62.5,
				},
				{
					kind: 'TRAFFIC_CHANNEL',
					label: 'Unassigned',
					current: 160,
					previous: 10,
					sharePct: 37.5,
				},
			] )
		).toEqual( [
			[ 'Cross-network ads', '62.5% of the change' ],
			[ 'Uncategorized traffic', '37.5% of the change' ],
		] );
	} );
} );
