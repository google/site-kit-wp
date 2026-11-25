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
	formatParentChannelShare,
	formatVisitsChange,
	formatVisitsShare,
	getKeyFactorAttributeShareText,
	getKeyFactorShareText,
	getKeyFactorsNoticeText,
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
} );

describe( 'getKeyFactorShareText', () => {
	const parentChannel = { label: 'Referral', change: 300 };

	it( 'should give a card its share of all visits on a steady period', () => {
		expect(
			getKeyFactorShareText( { sharePct: 45.2 }, { steady: true } )
		).toBe( '45.2% of all visits' );
	} );

	it( 'should give a card that took its channel’s place its share of the channel’s change', () => {
		expect(
			getKeyFactorShareText(
				{ sharePct: 73.3, parentChannel },
				{ steady: false }
			)
		).toBe( '73.3% of Referral’s +300 visits' );
	} );

	it( 'should give any other card no line, since its change is shown alone', () => {
		expect(
			getKeyFactorShareText( { sharePct: 64.5 }, { steady: false } )
		).toBeNull();
	} );
} );

describe( 'getKeyFactorAttributeShareText', () => {
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
			getKeyFactorAttributeShareText( 'CHANNEL', {
				kind: 'LANDING_PAGE',
				sharePct,
			} )
		).toBe( text );
	} );

	it( 'should say that an attribute that moved further than its card is more than the channel’s net change, rather than give it a share', () => {
		expect(
			getKeyFactorAttributeShareText( 'CHANNEL', {
				kind: 'DEVICE',
				sharePct: 0,
				oversized: true,
			} )
		).toBe( 'More than the channel’s net change' );
	} );

	it( 'should give an attribute without a share no line, as the side of a net that moved against its card', () => {
		expect(
			getKeyFactorAttributeShareText( 'CHANNEL', {
				kind: 'DEVICE',
				sharePct: 0,
			} )
		).toBeNull();
	} );

	it.each( [
		[
			'its change as a share of the site’s search clicks',
			3.6,
			'A change equal to 3.6% of the site’s search clicks',
		],
		[
			'a share that rounds to 0 as less than 0.1%',
			0,
			'A change equal to less than 0.1% of the site’s search clicks',
		],
	] )( 'should give a search keyword %s', ( _, sharePct, text ) => {
		expect(
			getKeyFactorAttributeShareText( 'CHANNEL', {
				kind: 'SEARCH_KEYWORD',
				sharePct,
			} )
		).toBe( text );
	} );

	it( 'should give a channel of the paid group its share of the paid channels’ movement, rather than of the group’s change', () => {
		expect(
			getKeyFactorAttributeShareText( 'CHANNEL_GROUP', {
				kind: 'TRAFFIC_CHANNEL',
				sharePct: 65.6,
			} )
		).toBe( '65.6% of paid traffic’s movement' );
	} );

	it( 'should give a channel of the paid group without a share no line', () => {
		expect(
			getKeyFactorAttributeShareText( 'CHANNEL_GROUP', {
				kind: 'TRAFFIC_CHANNEL',
				sharePct: 0,
			} )
		).toBeNull();
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
			'No channel changed notably compared with the previous 28 days'
		);
	} );

	it( 'should name a single day in the singular', () => {
		expect(
			getKeyFactorsNoticeText( {
				...OPTIONS,
				noChange: true,
				daysInSelectedRange: 1,
			} )
		).toBe( 'No channel changed notably compared with the previous 1 day' );
	} );
} );
