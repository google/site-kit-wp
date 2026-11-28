/**
 * TypicalTrafficAvailabilityNotice component tests.
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
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { TypicalTrafficAvailability } from '@/js/modules/analytics-4/components/traffic-overview/utils';
import { fireEvent, render } from '@tests/js/test-utils';
import { createTestRegistry, provideSiteInfo } from '@tests/js/utils';
import TypicalTrafficAvailabilityNotice, {
	TypicalTrafficAvailabilityNoticeProps,
} from './TypicalTrafficAvailabilityNotice';

/** A 28-day range with every part, on 2025-02-05. */
const AVAILABILITY: TypicalTrafficAvailability = {
	rangeTooShort: false,
	bandAvailable: true,
	bandAvailableFrom: '2024-11-01',
	keyFactorsAvailable: true,
	keyFactorsAvailableFrom: '2024-09-01',
	insightRequestAllowed: true,
	performanceInsightAvailable: true,
	lastYearAvailable: false,
	rangeTooLong: false,
	lowTraffic: false,
};

/** The same range of a site with low traffic, which has no band and no key factors. */
const LOW_TRAFFIC: TypicalTrafficAvailability = {
	...AVAILABILITY,
	bandAvailable: false,
	keyFactorsAvailable: false,
	insightRequestAllowed: false,
	performanceInsightAvailable: false,
	lowTraffic: true,
};

/**
 * Renders the notice with `2025-02-05` as today, and the last 28 days, or the
 * given custom date range, selected.
 *
 * @since n.e.x.t
 *
 * @param {Object} props                 The notice's props.
 * @param {Object} [customRange]         Optional. A custom date range to select.
 * @param {string} customRange.startDate The range's first day, as `YYYY-MM-DD`.
 * @param {string} customRange.endDate   The range's last day, as `YYYY-MM-DD`.
 * @return {Object} The render result.
 */
function renderNotice(
	props: TypicalTrafficAvailabilityNoticeProps,
	customRange?: { startDate: string; endDate: string }
) {
	const registry = createTestRegistry();
	provideSiteInfo( registry );
	registry.dispatch( CORE_USER ).setReferenceDate( '2025-02-05' );

	if ( customRange ) {
		registry
			.dispatch( CORE_USER )
			.setDateRangeSelection( { type: 'custom', ...customRange } );
	}

	return render( <TypicalTrafficAvailabilityNotice { ...props } />, {
		registry,
	} );
}

describe( 'TypicalTrafficAvailabilityNotice', () => {
	it( 'should say when the key factors and the typical traffic range will show, in one notice, while both wait', () => {
		const { container } = renderNotice( {
			availability: {
				...AVAILABILITY,
				bandAvailable: false,
				bandAvailableFrom: '2025-04-02',
				keyFactorsAvailable: false,
				keyFactorsAvailableFrom: '2025-02-06',
			},
		} );

		const notices = container.querySelectorAll( '.googlesitekit-notice' );

		expect( notices ).toHaveLength( 1 );
		expect( notices[ 0 ] ).toHaveClass(
			'googlesitekit-traffic-overview__availability-notice'
		);
		expect( notices[ 0 ] ).toHaveTextContent(
			'We’re still learning what’s usual for your site. Check back on February 7, 2025 to see your biggest traffic shifts, and on April 3, 2025 to see your typical traffic range.'
		);
	} );

	it( 'should ask for a date range that ends later, rather than say when to check back, for a range that ends in the past', () => {
		// The range never gains the history it lacks, though both days are
		// still ahead.
		const { container } = renderNotice(
			{
				availability: {
					...AVAILABILITY,
					bandAvailable: false,
					bandAvailableFrom: '2025-04-02',
					keyFactorsAvailable: false,
					keyFactorsAvailableFrom: '2025-02-06',
				},
			},
			{ startDate: '2024-12-24', endDate: '2025-01-20' }
		);

		const notices = container.querySelectorAll( '.googlesitekit-notice' );

		expect( notices ).toHaveLength( 1 );
		expect( notices[ 0 ] ).toHaveTextContent(
			'There isn’t enough traffic history for these dates. Select a date range that ends on or after February 6, 2025 to see your biggest traffic shifts, and on or after April 2, 2025 to see your typical traffic range.'
		);
	} );

	it( 'should say what range the insight needs for a range too long for it, with the insights', () => {
		const { getByText } = renderNotice( {
			availability: { ...AVAILABILITY, rangeTooLong: true },
			insightsEnabled: true,
		} );

		expect(
			getByText(
				'Select a date range of up to 364 days to see insights about your traffic.'
			)
		).toBeInTheDocument();
	} );

	it( 'should warn that the site has too little traffic, with a link to learn more and a button to acknowledge it, for a site with low traffic', () => {
		const { container, getByRole } = renderNotice( {
			availability: LOW_TRAFFIC,
			insightsEnabled: true,
		} );

		const notices = container.querySelectorAll( '.googlesitekit-notice' );

		expect( notices ).toHaveLength( 1 );
		expect( notices[ 0 ] ).toHaveClass(
			'googlesitekit-notice--warning',
			'googlesitekit-traffic-overview__low-traffic-notice'
		);
		expect( notices[ 0 ] ).not.toHaveClass(
			'googlesitekit-traffic-overview__availability-notice'
		);
		expect( notices[ 0 ] ).toHaveTextContent(
			'There isn’t enough traffic data right now to show a reliable typical range or traffic shifts. These insights will come back once your site gets more regular visits. Learn more'
		);
		expect( getByRole( 'link', { name: /Learn more/ } ) ).toHaveAttribute(
			'href',
			'https://sitekit.withgoogle.com/support/?doc=typical-traffic-low-traffic'
		);
		expect( getByRole( 'button', { name: 'Got it' } ) ).toBeInTheDocument();
	} );

	it( 'should keep the warning on the page when its button is clicked, since the button has no action yet', () => {
		const { container, getByRole } = renderNotice( {
			availability: LOW_TRAFFIC,
		} );

		fireEvent.click( getByRole( 'button', { name: 'Got it' } ) );

		expect(
			container.querySelector(
				'.googlesitekit-traffic-overview__low-traffic-notice'
			)
		).toBeInTheDocument();
	} );

	it.each( [
		[ 'when the range has every part', { availability: AVAILABILITY } ],
		[
			'for a range too long for the insight without the insights',
			{ availability: { ...AVAILABILITY, rangeTooLong: true } },
		],
		[
			'while the panel’s figures load',
			{
				availability: {
					...AVAILABILITY,
					bandAvailable: false,
					bandAvailableFrom: '2025-04-02',
				},
				loaded: false,
			},
		],
		[
			'for a site with low traffic while the panel’s figures load',
			{ availability: LOW_TRAFFIC, loaded: false },
		],
	] )( 'should render nothing %s', ( _, props ) => {
		const { container } = renderNotice( props );

		expect( container ).toBeEmptyDOMElement();
	} );
} );
