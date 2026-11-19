/**
 * KeyFactors tests.
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
import { KEY_FACTORS_DAILY_CHANGE_THRESHOLD } from '@/js/modules/analytics-4/components/traffic-overview/constants';
import { BenchmarkingKeyFactor } from '@/js/modules/analytics-4/utils/benchmarking/types';
import {
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from '@tests/js/test-utils';
import { createTestRegistry, provideSiteInfo } from '@tests/js/utils';
import KeyFactors, { KeyFactorsProps } from './KeyFactors';

const REFERENCE_SITE_URL = 'https://example.com';

// The visits of each card below changed by more than the threshold a day over
// 28 days, so each card shows, even on its own.
const REFERRAL: BenchmarkingKeyFactor = {
	kind: 'CHANNEL',
	label: 'Referral',
	current: 545,
	previous: 180,
	sharePct: 52.4,
	attributes: [
		{
			kind: 'LANDING_PAGE',
			label: '/ice-cream-is-good-for-your-health/',
			current: 46,
			previous: 30,
			sharePct: 12.9,
		},
		{
			kind: 'REFERRING_SITE',
			label: 'facebook.com',
			current: 92,
			previous: 60,
			sharePct: 25.8,
		},
	],
};

const ORGANIC_SEARCH: BenchmarkingKeyFactor = {
	kind: 'CHANNEL',
	label: 'Organic Search',
	current: 100,
	previous: 400,
	sharePct: 100,
	attributes: [
		{
			kind: 'SEARCH_KEYWORD',
			label: 'healthy ice cream types',
			current: 17,
			previous: 20,
			sharePct: 14.3,
		},
	],
};

const HOMEPAGE: BenchmarkingKeyFactor = {
	kind: 'CONTENT',
	label: '/',
	current: 610,
	previous: 220,
	sharePct: 41.3,
	attributes: [
		{
			kind: 'TRAFFIC_CHANNEL',
			label: 'Direct',
			current: 180,
			previous: 110,
			sharePct: 32.1,
		},
	],
};

const INSIGHT =
	'Referral traffic from **substack.com** is up most, mainly to **“Ice cream is good for your health”**';

/**
 * The change in visits over 28 days at which a card's change reaches the
 * threshold a day.
 */
const THRESHOLD_CHANGE = KEY_FACTORS_DAILY_CHANGE_THRESHOLD * 28;

/**
 * The cards of `REFERRAL` and `ORGANIC_SEARCH`, whose visits changed by one
 * visit each over 28 days, far below the threshold a day: traffic was steady.
 */
const STEADY_KEY_FACTORS: BenchmarkingKeyFactor[] = [
	{ ...REFERRAL, current: REFERRAL.previous + 1 },
	{ ...ORGANIC_SEARCH, current: ORGANIC_SEARCH.previous - 1 },
];

/**
 * Renders the section with the cards of `REFERRAL` and `ORGANIC_SEARCH` and
 * the site's URL, over 28 days, unless the props say otherwise. The registry
 * has the site info, whose admin URL a landing page's link is built on.
 *
 * @since n.e.x.t
 *
 * @param {Object} [props] Optional. The props to render the section with in place of the defaults.
 * @return {Object} The render result.
 */
function renderKeyFactors( props: Partial< KeyFactorsProps > = {} ) {
	const registry = createTestRegistry();
	provideSiteInfo( registry );

	return render(
		<KeyFactors
			keyFactors={ [ REFERRAL, ORGANIC_SEARCH ] }
			daysInSelectedRange={ 28 }
			referenceSiteURL={ REFERENCE_SITE_URL }
			{ ...props }
		/>,
		{ registry }
	);
}

describe( 'KeyFactors', () => {
	it.each( [
		[ 28, 'Biggest channel shifts vs. the previous 28 days' ],
		[ 1, 'Biggest channel shifts vs. the previous 1 day' ],
	] )(
		'should name the section after the %d days of the selected date range',
		( daysInSelectedRange, heading ) => {
			const { getByRole } = renderKeyFactors( { daysInSelectedRange } );

			expect(
				getByRole( 'heading', { level: 3, name: heading } )
			).toBeInTheDocument();
			expect(
				getByRole( 'region', { name: heading } )
			).toBeInTheDocument();
		}
	);

	it( 'should show the tooltip text and a "Learn more" link to `#` when the info icon is hovered', async () => {
		const { getByRole } = renderKeyFactors();

		fireEvent.mouseOver(
			getByRole( 'button', {
				name: /Shows what changed most compared with the previous period/,
			} )
		);

		// The popup renders outside the section, at the end of the document.
		await waitFor( () => {
			expect(
				document.querySelector( '.googlesitekit-info-tooltip__content' )
			).toHaveTextContent(
				'Shows what changed most compared with the previous period. Learn more'
			);
		} );

		const learnMoreLink = screen.getByRole( 'link', {
			name: 'Learn more (opens in a new tab)',
		} );

		expect( learnMoreLink ).toHaveAttribute( 'href', '#' );
		expect( learnMoreLink ).toHaveAttribute( 'target', '_blank' );
	} );

	it( 'should render a card for each key factor, named after its driver, with the change in its visits', () => {
		const { getByRole } = renderKeyFactors();

		const referral = getByRole( 'region', { name: 'Referral' } );
		const organicSearch = getByRole( 'region', {
			name: 'Organic Search',
		} );

		expect(
			within( referral ).getByRole( 'heading', { level: 4 } )
		).toHaveTextContent( 'Referral' );
		expect( within( referral ).getByText( '+365 visits' ) ).toHaveClass(
			'googlesitekit-traffic-overview__key-factor-change-badge'
		);
		expect(
			within( organicSearch ).getByText( '-300 visits' )
		).toHaveClass(
			'googlesitekit-traffic-overview__key-factor-change-badge'
		);
	} );

	it( 'should name the card of the site’s homepage "Homepage" in place of its path, `/`', () => {
		const { getByRole, queryByText } = renderKeyFactors( {
			keyFactors: [ HOMEPAGE ],
		} );

		const homepage = getByRole( 'region', { name: 'Homepage' } );

		expect(
			within( homepage ).getByRole( 'heading', {
				level: 4,
				name: 'Homepage',
			} )
		).toBeInTheDocument();
		expect(
			within( homepage ).getByText( 'Top changes within Homepage' )
		).toBeInTheDocument();
		expect( queryByText( '/' ) ).not.toBeInTheDocument();
	} );

	it( 'should name the card of any other landing page by its path', () => {
		const { getByRole } = renderKeyFactors( {
			keyFactors: [
				{ ...HOMEPAGE, label: '/ice-cream-is-good-for-your-health/' },
			],
		} );

		expect(
			getByRole( 'heading', {
				level: 4,
				name: '/ice-cream-is-good-for-your-health/',
			} )
		).toBeInTheDocument();
	} );

	it( 'should name the card of a driver that is not a landing page as the response does, even when that name is `/`', () => {
		const { getByRole } = renderKeyFactors( {
			keyFactors: [
				{
					...ORGANIC_SEARCH,
					kind: 'SEARCH_KEYWORD',
					label: '/',
					attributes: [],
				},
			],
		} );

		expect(
			getByRole( 'heading', { level: 4, name: '/' } )
		).toBeInTheDocument();
	} );

	it( 'should render the cards in the order the key factors are given', () => {
		const { getAllByRole } = renderKeyFactors( {
			keyFactors: [ ORGANIC_SEARCH, REFERRAL ],
		} );

		expect(
			getAllByRole( 'heading', { level: 4 } ).map(
				( heading ) => heading.textContent
			)
		).toEqual( [ 'Organic Search', 'Referral' ] );
	} );

	it( 'should mark the badge of a driver whose visits dropped as negative, and only that badge', () => {
		const { getByText } = renderKeyFactors();

		expect( getByText( '-300 visits' ) ).toHaveClass(
			'googlesitekit-traffic-overview__key-factor-change-badge--negative'
		);
		expect( getByText( '+365 visits' ) ).not.toHaveClass(
			'googlesitekit-traffic-overview__key-factor-change-badge--negative'
		);
	} );

	it( 'should list the attributes of a card under "Top changes within", each with the title of its kind, its value and the change in its visits', () => {
		const { getByRole } = renderKeyFactors();

		const referral = getByRole( 'region', { name: 'Referral' } );
		const attributes = Array.from(
			referral.querySelectorAll(
				'.googlesitekit-traffic-overview__key-factor-attribute'
			)
		);

		expect(
			within( referral ).getByText( 'Top changes within Referral' )
		).toBeInTheDocument();
		// The testing library gives `dt` no role, so the pairs are read by tag.
		expect(
			attributes.map( ( attribute ) => [
				attribute.querySelector( 'dt' )?.textContent,
				attribute.querySelector( 'dd' )?.textContent,
			] )
		).toEqual( [
			[ 'Landing page', '/ice-cream-is-good-for-your-health/+16 visits' ],
			[ 'Referring site', 'facebook.com+32 visits' ],
		] );
	} );

	it( 'should link a landing page to the entity dashboard of that page on the site, in the same tab', () => {
		const { getByRole } = renderKeyFactors();

		const link = getByRole( 'link', {
			name: '/ice-cream-is-good-for-your-health/',
		} );

		expect( link ).toHaveAttribute(
			'href',
			'http://example.com/wp-admin/admin.php?page=googlesitekit-dashboard&permaLink=https%3A%2F%2Fexample.com%2Fice-cream-is-good-for-your-health%2F'
		);
		expect( link ).not.toHaveAttribute( 'target' );
	} );

	it( 'should name a landing page that is the site’s homepage "Homepage", and link it to the homepage’s entity dashboard', () => {
		const { getByRole, queryByText } = renderKeyFactors( {
			keyFactors: [
				{
					...REFERRAL,
					attributes: [ { ...REFERRAL.attributes[ 0 ], label: '/' } ],
				},
			],
		} );

		expect( getByRole( 'link', { name: 'Homepage' } ) ).toHaveAttribute(
			'href',
			'http://example.com/wp-admin/admin.php?page=googlesitekit-dashboard&permaLink=https%3A%2F%2Fexample.com%2F'
		);
		expect( queryByText( '/' ) ).not.toBeInTheDocument();
	} );

	it( 'should name the homepage of a site that lives under a folder "Homepage", as a card and as a landing page', () => {
		const { getByRole } = renderKeyFactors( {
			referenceSiteURL: 'https://example.com/blog',
			keyFactors: [
				{ ...HOMEPAGE, label: '/blog/' },
				{
					...REFERRAL,
					attributes: [
						{ ...REFERRAL.attributes[ 0 ], label: '/blog/' },
					],
				},
			],
		} );

		expect(
			getByRole( 'heading', { level: 4, name: 'Homepage' } )
		).toBeInTheDocument();
		expect( getByRole( 'link', { name: 'Homepage' } ) ).toHaveAttribute(
			'href',
			'http://example.com/wp-admin/admin.php?page=googlesitekit-dashboard&permaLink=https%3A%2F%2Fexample.com%2Fblog%2F'
		);
	} );

	it( 'should not link a value that is not a landing page', () => {
		const { getByText, queryByRole } = renderKeyFactors();

		expect( getByText( 'facebook.com' ) ).toBeInTheDocument();
		expect(
			queryByRole( 'link', { name: /facebook\.com/ } )
		).not.toBeInTheDocument();
	} );

	it( 'should not link a landing page when the site’s URL is unknown', () => {
		const { getByText, queryByRole } = renderKeyFactors( {
			referenceSiteURL: undefined,
		} );

		expect(
			getByText( '/ice-cream-is-good-for-your-health/' )
		).toBeInTheDocument();
		expect(
			queryByRole( 'link', {
				name: /ice-cream-is-good-for-your-health/,
			} )
		).not.toBeInTheDocument();
	} );

	it( 'should leave out "Top changes within" when a card has no attributes', () => {
		const { getByRole, queryByText } = renderKeyFactors( {
			keyFactors: [ { ...REFERRAL, attributes: [] } ],
		} );

		expect(
			getByRole( 'region', { name: 'Referral' } )
		).toBeInTheDocument();
		expect(
			queryByText( 'Top changes within Referral' )
		).not.toBeInTheDocument();
	} );

	it( 'should leave out a card and an attribute that have no name', () => {
		const { getAllByRole, queryByText } = renderKeyFactors( {
			keyFactors: [
				{
					...REFERRAL,
					attributes: [
						{ ...REFERRAL.attributes[ 0 ], label: null },
						REFERRAL.attributes[ 1 ],
					],
				},
				{ ...ORGANIC_SEARCH, label: null },
			],
		} );

		expect(
			getAllByRole( 'heading', { level: 4 } ).map(
				( heading ) => heading.textContent
			)
		).toEqual( [ 'Referral' ] );
		expect( queryByText( 'Landing page' ) ).not.toBeInTheDocument();
		expect( queryByText( 'Referring site' ) ).toBeInTheDocument();
	} );

	it( 'should render the insight above the cards, with the names it highlights in bold and marked as generated by AI', () => {
		const { container, getByText } = renderKeyFactors( {
			insight: INSIGHT,
		} );

		const notice = container.querySelector(
			'.googlesitekit-traffic-overview__key-factors-insight'
		);

		expect( notice ).toHaveTextContent(
			'AI-generatedReferral traffic from substack.com is up most, mainly to “Ice cream is good for your health”'
		);
		expect( getByText( 'substack.com' ).tagName ).toBe( 'STRONG' );
		expect(
			getByText( '“Ice cream is good for your health”' ).tagName
		).toBe( 'STRONG' );
		// The notice comes before the cards in reading order.
		expect(
			notice?.compareDocumentPosition(
				container.querySelector(
					'.googlesitekit-traffic-overview__key-factors-cards'
				) as Node
			)
		).toBe( Node.DOCUMENT_POSITION_FOLLOWING );
	} );

	it( 'should render no insight notice when there is no insight', () => {
		const { container } = renderKeyFactors();

		expect(
			container.querySelector(
				'.googlesitekit-traffic-overview__key-factors-insight'
			)
		).not.toBeInTheDocument();
	} );

	it( 'should render "No channel changed notably…" in place of the cards when there are no key factors and no insight', () => {
		const { container, getByText, queryByRole } = renderKeyFactors( {
			keyFactors: [],
		} );

		expect(
			getByText(
				'No channel changed notably compared with the previous 28 days'
			)
		).toBeInTheDocument();
		expect(
			queryByRole( 'heading', { level: 4 } )
		).not.toBeInTheDocument();
		expect(
			container.querySelector(
				'.googlesitekit-traffic-overview__key-factors'
			)
		).toHaveClass(
			'googlesitekit-traffic-overview__key-factors--no-change'
		);
	} );

	it( 'should render the insight in place of "No channel changed notably…" when there are no key factors', () => {
		const { container, queryByText, queryByRole } = renderKeyFactors( {
			keyFactors: [],
			insight: INSIGHT,
		} );

		expect(
			container.querySelector(
				'.googlesitekit-traffic-overview__key-factors-insight'
			)
		).toHaveTextContent( 'Referral traffic from substack.com is up most' );
		expect(
			queryByText(
				'No channel changed notably compared with the previous 28 days'
			)
		).not.toBeInTheDocument();
		expect(
			queryByRole( 'heading', { level: 4 } )
		).not.toBeInTheDocument();
		// The section keeps the spacing it has without cards.
		expect(
			container.querySelector(
				'.googlesitekit-traffic-overview__key-factors'
			)
		).toHaveClass(
			'googlesitekit-traffic-overview__key-factors--no-change'
		);
	} );

	it( 'should render "No channel changed notably…" in place of the cards when every card’s visits changed by less than the threshold a day', () => {
		const { container, getByText, queryByRole } = renderKeyFactors( {
			keyFactors: STEADY_KEY_FACTORS,
		} );

		expect(
			getByText(
				'No channel changed notably compared with the previous 28 days'
			)
		).toBeInTheDocument();
		expect(
			queryByRole( 'heading', { level: 4 } )
		).not.toBeInTheDocument();
		// The section keeps the spacing it has without cards.
		expect(
			container.querySelector(
				'.googlesitekit-traffic-overview__key-factors'
			)
		).toHaveClass(
			'googlesitekit-traffic-overview__key-factors--no-change'
		);
	} );

	it.each( [
		[ 'grew', THRESHOLD_CHANGE ],
		[ 'dropped', -THRESHOLD_CHANGE ],
	] )(
		'should render the cards, and no "No channel changed notably…", when one card’s visits %s by the threshold a day',
		( _, change ) => {
			const { container, getAllByRole, queryByText } = renderKeyFactors( {
				keyFactors: [
					STEADY_KEY_FACTORS[ 0 ],
					{
						...ORGANIC_SEARCH,
						current: ORGANIC_SEARCH.previous + change,
					},
				],
			} );

			expect(
				getAllByRole( 'heading', { level: 4 } ).map(
					( heading ) => heading.textContent
				)
			).toEqual( [ 'Referral', 'Organic Search' ] );
			expect(
				queryByText(
					'No channel changed notably compared with the previous 28 days'
				)
			).not.toBeInTheDocument();
			expect(
				container.querySelector(
					'.googlesitekit-traffic-overview__key-factors'
				)
			).not.toHaveClass(
				'googlesitekit-traffic-overview__key-factors--no-change'
			);
		}
	);

	it( 'should judge a card’s change a day over the days of the selected date range', () => {
		const keyFactors = [
			{ ...REFERRAL, current: REFERRAL.previous + THRESHOLD_CHANGE },
		];

		const { getByRole, getByText, queryByRole, rerender } =
			renderKeyFactors( { keyFactors } );

		// Over 28 days, the change reaches the threshold a day.
		expect(
			getByRole( 'heading', { level: 4, name: 'Referral' } )
		).toBeInTheDocument();

		rerender(
			<KeyFactors
				keyFactors={ keyFactors }
				daysInSelectedRange={ 29 }
				referenceSiteURL={ REFERENCE_SITE_URL }
			/>
		);

		// Spread over one more day, the same change is below it.
		expect(
			getByText(
				'No channel changed notably compared with the previous 29 days'
			)
		).toBeInTheDocument();
		expect(
			queryByRole( 'heading', { level: 4 } )
		).not.toBeInTheDocument();
	} );

	it.each( [
		[ 'the insight', { insight: INSIGHT } ],
		[ 'the placeholder of the insight', { insightLoading: true } ],
	] )(
		'should render "No channel changed notably…" in place of %s when every card’s visits changed by less than the threshold a day',
		( _, props ) => {
			const { container, getByText } = renderKeyFactors( {
				keyFactors: STEADY_KEY_FACTORS,
				...props,
			} );

			expect(
				getByText(
					'No channel changed notably compared with the previous 28 days'
				)
			).toBeInTheDocument();
			expect(
				container.querySelector(
					'.googlesitekit-traffic-overview__key-factors-insight'
				)
			).not.toBeInTheDocument();
		}
	);

	it( 'should render the placeholder cards, and no "No channel changed notably…", while the key factors load, though their visits changed by less than the threshold a day', () => {
		const { container, queryByText } = renderKeyFactors( {
			keyFactors: STEADY_KEY_FACTORS,
			loaded: false,
		} );

		expect(
			queryByText(
				'No channel changed notably compared with the previous 28 days'
			)
		).not.toBeInTheDocument();
		expect(
			container.querySelectorAll(
				'.googlesitekit-traffic-overview__key-factor--loading'
			)
		).toHaveLength( 3 );
	} );

	it( 'should keep the same polite live region from the placeholder of the insight to the insight, so a screen reader reads the insight out once it arrives', () => {
		const { container, rerender } = renderKeyFactors( {
			insightLoading: true,
		} );

		const liveRegion = container.querySelector(
			'.googlesitekit-traffic-overview__key-factors-insight'
		);

		expect( liveRegion ).toHaveAttribute( 'aria-live', 'polite' );

		rerender(
			<KeyFactors
				keyFactors={ [ REFERRAL, ORGANIC_SEARCH ] }
				daysInSelectedRange={ 28 }
				referenceSiteURL={ REFERENCE_SITE_URL }
				insight={ INSIGHT }
			/>
		);

		// A live region announces a change to its content, not a region that
		// replaces it, so the insight arrives in the same element.
		expect(
			container.querySelector(
				'.googlesitekit-traffic-overview__key-factors-insight'
			)
		).toBe( liveRegion );
		expect( liveRegion ).toHaveAttribute( 'aria-live', 'polite' );
		expect( liveRegion ).toHaveTextContent(
			'Referral traffic from substack.com is up most'
		);
	} );

	it( 'should render a placeholder for the insight above the cards while the insight loads', () => {
		const { container } = renderKeyFactors( { insightLoading: true } );

		const placeholder = container.querySelector(
			'.googlesitekit-traffic-overview__key-factors-insight .googlesitekit-preview-block'
		);

		expect( placeholder ).toBeInTheDocument();
		expect(
			container.querySelector(
				'.googlesitekit-traffic-overview__insight-notice-content'
			)
		).not.toBeInTheDocument();
		expect(
			placeholder?.compareDocumentPosition(
				container.querySelector(
					'.googlesitekit-traffic-overview__key-factors-cards'
				) as Node
			)
		).toBe( Node.DOCUMENT_POSITION_FOLLOWING );
	} );

	it( 'should render a placeholder for the insight, and no "No channel changed notably…", while the insight loads without key factors', () => {
		const { container, queryByText } = renderKeyFactors( {
			keyFactors: [],
			insightLoading: true,
		} );

		expect(
			container.querySelector(
				'.googlesitekit-traffic-overview__key-factors-insight .googlesitekit-preview-block'
			)
		).toBeInTheDocument();
		expect(
			queryByText(
				'No channel changed notably compared with the previous 28 days'
			)
		).not.toBeInTheDocument();
	} );

	it( 'should render three placeholder cards under the heading, in place of the cards, while the key factors load', () => {
		const { container, getByRole, queryByRole } = renderKeyFactors( {
			loaded: false,
		} );

		expect(
			getByRole( 'heading', {
				level: 3,
				name: 'Biggest channel shifts vs. the previous 28 days',
			} )
		).toBeInTheDocument();
		expect(
			container.querySelectorAll(
				'.googlesitekit-traffic-overview__key-factor--loading'
			)
		).toHaveLength( 3 );
		expect(
			container.querySelectorAll(
				'.googlesitekit-traffic-overview__key-factor--loading .googlesitekit-preview-block'
			)
		).toHaveLength( 15 );
		expect(
			queryByRole( 'heading', { level: 4 } )
		).not.toBeInTheDocument();
	} );

	it( 'should render no "No channel changed notably…" while the key factors load, though there are none yet', () => {
		const { container, queryByText } = renderKeyFactors( {
			keyFactors: [],
			loaded: false,
		} );

		expect(
			queryByText(
				'No channel changed notably compared with the previous 28 days'
			)
		).not.toBeInTheDocument();
		expect(
			container.querySelectorAll(
				'.googlesitekit-traffic-overview__key-factor--loading'
			)
		).toHaveLength( 3 );
	} );

	it( 'should render the insight above the placeholder cards while the key factors load', () => {
		const { container } = renderKeyFactors( {
			keyFactors: [],
			loaded: false,
			insight: INSIGHT,
		} );

		const notice = container.querySelector(
			'.googlesitekit-traffic-overview__key-factors-insight'
		);

		expect( notice ).toHaveTextContent(
			'Referral traffic from substack.com is up most'
		);
		expect(
			notice?.compareDocumentPosition(
				container.querySelector(
					'.googlesitekit-traffic-overview__key-factor--loading'
				) as Node
			)
		).toBe( Node.DOCUMENT_POSITION_FOLLOWING );
	} );

	it( 'should replace the placeholder cards with the cards once the key factors arrive', () => {
		const { container, getAllByRole, rerender } = renderKeyFactors( {
			loaded: false,
		} );

		rerender(
			<KeyFactors
				keyFactors={ [ REFERRAL, ORGANIC_SEARCH ] }
				daysInSelectedRange={ 28 }
				referenceSiteURL={ REFERENCE_SITE_URL }
				loaded
			/>
		);

		expect(
			container.querySelector(
				'.googlesitekit-traffic-overview__key-factor--loading'
			)
		).not.toBeInTheDocument();
		expect(
			getAllByRole( 'heading', { level: 4 } ).map(
				( heading ) => heading.textContent
			)
		).toEqual( [ 'Referral', 'Organic Search' ] );
	} );
} );
