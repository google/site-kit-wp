/**
 * Traffic Overview key factors utility tests.
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
	KeyFactorsNoticeOptions,
	formatClicksChange,
	formatNetPairOffset,
	formatParentChannelOverrun,
	formatParentChannelShare,
	formatVisitsChange,
	formatVisitsShare,
	getChannelName,
	getKeyFactorAttributeShareText,
	getKeyFactorShareText,
	getKeyFactorsNoticeText,
	getShownKeyFactors,
	isKeyFactorNetPair,
} from './key-factors';

describe( 'formatVisitsChange', () => {
	it( 'should give a rise a plus sign and the plural unit', () => {
		expect( formatVisitsChange( 65 ) ).toBe( '+65 visits' );
	} );

	it( 'should give a drop a minus sign', () => {
		expect( formatVisitsChange( -21 ) ).toBe( '-21 visits' );
	} );

	it.each( [
		[ 1, '+1 visit' ],
		[ -1, '-1 visit' ],
	] )(
		'should use the singular unit for a change of one visit, such as %d',
		( change, expected ) => {
			expect( formatVisitsChange( change ) ).toBe( expected );
		}
	);

	it( 'should give no change no sign', () => {
		expect( formatVisitsChange( 0 ) ).toBe( '0 visits' );
	} );

	it( 'should group the digits of a large change rather than shorten it', () => {
		expect( formatVisitsChange( 12345 ) ).toBe( '+12,345 visits' );
	} );
} );

describe( 'formatClicksChange', () => {
	it( 'should give a rise a plus sign and the plural unit', () => {
		expect( formatClicksChange( 140 ) ).toBe( '+140 clicks' );
	} );

	it( 'should give a drop a minus sign', () => {
		expect( formatClicksChange( -1426 ) ).toBe( '-1,426 clicks' );
	} );

	it.each( [
		[ 1, '+1 click' ],
		[ -1, '-1 click' ],
	] )(
		'should use the singular unit for a change of one click, such as %d',
		( change, expected ) => {
			expect( formatClicksChange( change ) ).toBe( expected );
		}
	);

	it( 'should give no change no sign', () => {
		expect( formatClicksChange( 0 ) ).toBe( '0 clicks' );
	} );
} );

describe( 'formatVisitsShare', () => {
	it.each( [
		[ 45.2, '45.2% of all visits' ],
		[ 45.26, '45.3% of all visits' ],
		[ 50, '50% of all visits' ],
	] )( 'should write a share of %d as "%s"', ( visitsSharePct, text ) => {
		expect( formatVisitsShare( visitsSharePct ) ).toBe( text );
	} );
} );

describe( 'getChannelName', () => {
	it.each( [
		[ 'Paid traffic', 'Paid traffic' ],
		[ 'Cross-network ads', 'Cross-network ads' ],
		[ 'Cross-network', 'Cross-network ads' ],
		[ 'multi-platform ads', 'Cross-network ads' ],
		[ 'Uncategorized traffic', 'Uncategorized traffic' ],
		[ 'Unassigned', 'Uncategorized traffic' ],
		[ ' unassigned ', 'Uncategorized traffic' ],
	] )(
		'should name the channel the plugin or the Site Kit service names, `%s`, as "%s"',
		( label, name ) => {
			expect( getChannelName( label ) ).toBe( name );
		}
	);

	it.each( [ 'Organic Search', 'Referral', 'AI Assistant', 'Paid Search' ] )(
		'should name a channel Analytics names, `%s`, as Analytics does',
		( label ) => {
			expect( getChannelName( label ) ).toBe( label );
		}
	);
} );

describe( 'formatParentChannelShare', () => {
	it( 'should name the channel and its change after the share of it', () => {
		expect(
			formatParentChannelShare( 73.3, { label: 'Referral', change: 300 } )
		).toBe( '73.3% of Referral’s +300 visits' );
	} );

	it( 'should give the channel’s change its sign, and group its digits', () => {
		expect(
			formatParentChannelShare( 52.3, {
				label: 'Organic Social',
				change: -75732,
			} )
		).toBe( '52.3% of Organic Social’s -75,732 visits' );
	} );

	it.each( [ 99.5, 100 ] )(
		'should write a share of %d as all of the channel’s change, since it rounds to 100%%',
		( sharePct ) => {
			expect(
				formatParentChannelShare( sharePct, {
					label: 'Referral',
					change: 300,
				} )
			).toBe( 'All of Referral’s +300 visits' );
		}
	);

	it.each( [
		[
			52.3,
			'Cross-network ads',
			'52.3% of Cross-network ads’ +300 visits',
		],
		[ 100, 'Affiliates', 'All of Affiliates’ +300 visits' ],
		[ 61, 'SMS', '61% of SMS’ +300 visits' ],
	] )(
		'should give a channel whose name ends in "s" a bare apostrophe: a share of %d of %s',
		( sharePct, label, text ) => {
			expect(
				formatParentChannelShare( sharePct, { label, change: 300 } )
			).toBe( text );
		}
	);

	it( 'should name the channel as `getChannelName()` does', () => {
		expect(
			formatParentChannelShare( 64.2, {
				label: 'Unassigned',
				change: -40,
			} )
		).toBe( '64.2% of Uncategorized traffic’s -40 visits' );
		expect(
			formatParentChannelShare( 64.2, {
				label: 'Cross-network',
				change: 40,
			} )
		).toBe( '64.2% of Cross-network ads’ +40 visits' );
	} );
} );

describe( 'formatParentChannelOverrun', () => {
	it( 'should name the channel and its change, without a share', () => {
		expect(
			formatParentChannelOverrun( { label: 'Referral', change: 300 } )
		).toBe( 'More than Referral’s net change of +300 visits' );
	} );

	it( 'should give a drop its sign', () => {
		expect(
			formatParentChannelOverrun( {
				label: 'Organic Social',
				change: -1203,
			} )
		).toBe( 'More than Organic Social’s net change of -1,203 visits' );
	} );

	it( 'should give a channel whose name ends in "s" a bare apostrophe, and name it as `getChannelName()` does', () => {
		expect(
			formatParentChannelOverrun( { label: 'Cross-network', change: 30 } )
		).toBe( 'More than Cross-network ads’ net change of +30 visits' );
	} );
} );

describe( 'getKeyFactorShareText', () => {
	const parentChannel = { label: 'Referral', change: 300 };

	it( 'should give a card its share of all visits on a steady period', () => {
		expect(
			getKeyFactorShareText(
				{ sharePct: 45.2, shareBasis: 'VOLUME' },
				{ steady: true }
			)
		).toBe( '45.2% of all visits' );
	} );

	it( 'should give a card that took its channel’s place its share of the channel’s change', () => {
		expect(
			getKeyFactorShareText(
				{ sharePct: 73.3, shareBasis: 'PARENT_CHANNEL', parentChannel },
				{ steady: false }
			)
		).toBe( '73.3% of Referral’s +300 visits' );
	} );

	it.each( [
		[ 'whose share is of the site’s change', 'GROSS_CHANGE' as const ],
		[ 'without a share, on a flat period', undefined ],
	] )(
		'should name the channel a card %s took the place of, as more than the channel’s change',
		( _, shareBasis ) => {
			expect(
				getKeyFactorShareText(
					{
						sharePct: shareBasis ? 25.4 : 0,
						shareBasis,
						parentChannel,
					},
					{ steady: false }
				)
			).toBe( 'More than Referral’s net change of +300 visits' );
		}
	);

	it.each( [
		'GROSS_CHANGE' as const,
		'NET_CHANGE' as const,
		'SITE_TRAFFIC' as const,
		undefined,
	] )(
		'should give any other card no line, since its share of the site’s change has no design: %s',
		( shareBasis ) => {
			expect(
				getKeyFactorShareText(
					{ sharePct: 64.5, shareBasis },
					{ steady: false }
				)
			).toBeNull();
		}
	);
} );

describe( 'getKeyFactorAttributeShareText', () => {
	/** A channel's card that rose. */
	const RISING_CHANNEL = { kind: 'CHANNEL' as const, change: 1280 };

	/** A channel's card that fell. */
	const FALLING_CHANNEL = { kind: 'CHANNEL' as const, change: -1280 };

	it.each( [
		[ 'a share of the card’s change', 75, '75% of the change' ],
		[ 'a share with a decimal', 12.9, '12.9% of the change' ],
		[
			'a share that rounds to 100% as all of the change',
			99.5,
			'All of the change',
		],
		[ 'all of the change', 100, 'All of the change' ],
	] )( 'should write %s', ( _, sharePct, text ) => {
		expect(
			getKeyFactorAttributeShareText( RISING_CHANNEL, {
				kind: 'LANDING_PAGE',
				label: '/hello-world/',
				sharePct,
			} )
		).toBe( text );
	} );

	it.each( [
		[ 'LANDING_PAGE', '/hello-world/', 'While other pages' ],
		[ 'CAMPAIGN', 'spring-sale', 'While other campaigns' ],
		[ 'DEVICE', 'desktop', 'While other devices' ],
		[ 'USER_TYPE', 'new', 'While returning-visitor visits' ],
		[ 'USER_TYPE', 'returning', 'While new-visitor visits' ],
		[ 'TRAFFIC_CHANNEL', 'Direct', 'While other channels' ],
		[ 'REFERRING_SITE', 'news.example', 'While other sources' ],
		[ 'PLATFORM', 'YouTube', 'While other sources' ],
		[ 'ASSISTANT', 'chatgpt.com', 'While other sources' ],
	] as const )(
		'should say that the card’s other parts moved the other way for a %s `%s` that moved further than its card, rather than give it a share',
		( kind, label, text ) => {
			const attribute = { kind, label, sharePct: 0, oversized: true };

			expect(
				getKeyFactorAttributeShareText( RISING_CHANNEL, attribute )
			).toBe( `${ text } fell` );
			expect(
				getKeyFactorAttributeShareText( FALLING_CHANNEL, attribute )
			).toBe( `${ text } rose` );
		}
	);

	it.each( [
		[ 'a side of a net that moved against its card', 'DEVICE', 'mobile' ],
		[
			'the channel’s page under a referring site that took the channel’s card',
			'LANDING_PAGE',
			'/hello-world/',
		],
	] as const )(
		'should give an attribute without a share no line, such as %s',
		( _, kind, label ) => {
			expect(
				getKeyFactorAttributeShareText(
					{ kind: 'REFERRING_SITE', change: 220 },
					{ kind, label, sharePct: 0 }
				)
			).toBeNull();
		}
	);

	it.each( [
		[
			'its change as a share of the site’s search clicks',
			{ sharePct: 3.6 },
			'A change equal to 3.6% of the site’s search clicks',
		],
		[
			'a share that rounds to 0 as less than 0.1%',
			{ sharePct: 0 },
			'A change equal to less than 0.1% of the site’s search clicks',
		],
		[
			'that it moved against the other queries, after its share',
			{ sharePct: 3.6, oversized: true },
			'A change equal to 3.6% of the site’s search clicks, while other queries fell',
		],
		[
			'that it moved against the other queries, in place of a share under 0.1%',
			{ sharePct: 0, oversized: true },
			'While other queries fell',
		],
	] )( 'should give a search keyword %s', ( _, fields, text ) => {
		expect(
			getKeyFactorAttributeShareText( RISING_CHANNEL, {
				kind: 'SEARCH_KEYWORD',
				label: 'how to plant garlic',
				...fields,
			} )
		).toBe( text );
	} );

	it( 'should say that the other queries rose under a search keyword of a card that fell', () => {
		expect(
			getKeyFactorAttributeShareText( FALLING_CHANNEL, {
				kind: 'SEARCH_KEYWORD',
				label: 'how to plant garlic',
				sharePct: 3.6,
				oversized: true,
			} )
		).toBe(
			'A change equal to 3.6% of the site’s search clicks, while other queries rose'
		);
		expect(
			getKeyFactorAttributeShareText( FALLING_CHANNEL, {
				kind: 'SEARCH_KEYWORD',
				label: 'how to plant garlic',
				sharePct: 0,
				oversized: true,
			} )
		).toBe( 'While other queries rose' );
	} );

	it.each( [
		[ 'without a share', { sharePct: 0 } ],
		[
			'that moved against the other queries',
			{ sharePct: 0, oversized: true },
		],
	] )(
		'should give a search keyword %s no line when the site’s search clicks are unknown',
		( _, fields ) => {
			expect(
				getKeyFactorAttributeShareText( RISING_CHANNEL, {
					kind: 'SEARCH_KEYWORD',
					label: 'how to plant garlic',
					noSearchClicks: true,
					...fields,
				} )
			).toBeNull();
		}
	);

	it( 'should give a channel of the paid group its share of the paid channels’ movement, rather than of the group’s change', () => {
		expect(
			getKeyFactorAttributeShareText(
				{ kind: 'CHANNEL_GROUP', change: 105 },
				{
					kind: 'TRAFFIC_CHANNEL',
					label: 'Paid Search',
					sharePct: 65.6,
				}
			)
		).toBe( '65.6% of paid traffic’s movement' );
	} );

	it( 'should give a channel of the paid group without a share no line', () => {
		expect(
			getKeyFactorAttributeShareText(
				{ kind: 'CHANNEL_GROUP', change: 105 },
				{
					kind: 'TRAFFIC_CHANNEL',
					label: 'Paid Social',
					sharePct: 0,
				}
			)
		).toBeNull();
	} );

	it.each( [
		[
			'its share of the page’s change',
			{ sharePct: 62.5 },
			'62.5% of the change',
		],
		[
			'all of the change from 99.5%',
			{ sharePct: 99.5 },
			'All of the change',
		],
		[
			'that the other channels moved the other way when it moved further than the page',
			{ sharePct: 0, oversized: true },
			'While other channels fell',
		],
	] )(
		'should give a channel that brought visits to a page’s card %s',
		( _, fields, text ) => {
			expect(
				getKeyFactorAttributeShareText(
					{ kind: 'CONTENT', change: 400 },
					{ kind: 'TRAFFIC_CHANNEL', label: 'Direct', ...fields }
				)
			).toBe( text );
		}
	);

	it( 'should give a channel that brought visits to a page’s card no line without a share', () => {
		expect(
			getKeyFactorAttributeShareText(
				{ kind: 'CONTENT', change: 400 },
				{ kind: 'TRAFFIC_CHANNEL', label: 'Direct', sharePct: 0 }
			)
		).toBeNull();
	} );
} );

describe( 'isKeyFactorNetPair', () => {
	const DESKTOP = {
		kind: 'DEVICE' as const,
		current: 2643,
		previous: 1000,
		sharePct: 0,
	};
	const MOBILE = {
		kind: 'DEVICE' as const,
		current: 638,
		previous: 1000,
		sharePct: 0,
	};

	it( 'should take two attributes without a share that moved in opposite directions for a net', () => {
		expect( isKeyFactorNetPair( DESKTOP, MOBILE ) ).toBe( true );
	} );

	it( 'should take two attributes of different kinds for a net', () => {
		expect(
			isKeyFactorNetPair(
				{ ...DESKTOP, kind: 'LANDING_PAGE' },
				{ ...MOBILE, kind: 'REFERRING_SITE' }
			)
		).toBe( true );
	} );

	it.each( [
		[ 'the first has a share', { ...DESKTOP, sharePct: 82.4 }, MOBILE ],
		[ 'the second has a share', DESKTOP, { ...MOBILE, sharePct: 12.1 } ],
		[ 'they moved the same way', DESKTOP, { ...MOBILE, current: 1200 } ],
		[ 'one didn’t change', DESKTOP, { ...MOBILE, current: 1000 } ],
		[
			'one is a search keyword',
			{ ...DESKTOP, kind: 'SEARCH_KEYWORD' as const },
			MOBILE,
		],
		[
			'one is a channel',
			DESKTOP,
			{ ...MOBILE, kind: 'TRAFFIC_CHANNEL' as const },
		],
	] )( 'should not take two attributes for a net when %s', ( _, a, b ) => {
		expect( isKeyFactorNetPair( a, b ) ).toBe( false );
	} );
} );

describe( 'formatNetPairOffset', () => {
	it( 'should name the side that moved the other way, with its signed change', () => {
		expect( formatNetPairOffset( -362, 'mobile' ) ).toBe(
			'Partly offset by -362 visits from mobile'
		);
		expect( formatNetPairOffset( 12, 'Homepage' ) ).toBe(
			'Partly offset by +12 visits from Homepage'
		);
	} );

	it( 'should use the singular unit for a change of one visit', () => {
		expect( formatNetPairOffset( -1, 'facebook.com' ) ).toBe(
			'Partly offset by -1 visit from facebook.com'
		);
	} );
} );

/** A 28-day range with its key factors. */
const OPTIONS: KeyFactorsNoticeOptions = {
	noChange: false,
	daysInSelectedRange: 28,
};

describe( 'getKeyFactorsNoticeText', () => {
	it( 'should give no text when channels changed notably', () => {
		expect( getKeyFactorsNoticeText( OPTIONS ) ).toBeNull();
	} );

	it( 'should say that no channel changed notably over the previous period of the same length', () => {
		expect(
			getKeyFactorsNoticeText( { ...OPTIONS, noChange: true } )
		).toBe(
			'No channel changed notably compared with the previous 28 days.'
		);
	} );

	it( 'should name a single day in the singular', () => {
		expect(
			getKeyFactorsNoticeText( {
				...OPTIONS,
				noChange: true,
				daysInSelectedRange: 1,
			} )
		).toBe(
			'No channel changed notably compared with the previous 1 day.'
		);
	} );
} );

describe( 'getShownKeyFactors', () => {
	const LANDING_PAGE = {
		kind: 'LANDING_PAGE' as const,
		label: '/guide/',
		current: 400,
		previous: 100,
		sharePct: 75,
	};

	it( 'should leave out the only card when it has no rows', () => {
		expect( getShownKeyFactors( [ { attributes: [] } ] ) ).toEqual( [] );
	} );

	it( 'should leave out the only card when its rows have no name, as the card shows none of them', () => {
		expect(
			getShownKeyFactors( [
				{ attributes: [ { ...LANDING_PAGE, label: null } ] },
			] )
		).toEqual( [] );
	} );

	it.each( [
		[ 'the only card with a row', [ { attributes: [ LANDING_PAGE ] } ] ],
		[
			'the only card whose change was spread across many pages, which it says in place of rows',
			[ { attributes: [], spreadAcrossPages: true } ],
		],
		[
			'two cards without rows',
			[ { attributes: [] }, { attributes: [] } ],
		],
		[ 'no cards', [] ],
	] )( 'should show %s as given', ( _, keyFactors ) => {
		expect( getShownKeyFactors( keyFactors ) ).toBe( keyFactors );
	} );
} );
