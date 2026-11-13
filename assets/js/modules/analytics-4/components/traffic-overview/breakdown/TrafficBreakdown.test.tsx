/**
 * Traffic Overview breakdown tests.
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
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { createBreakdownValues } from '@/js/modules/analytics-4/components/traffic-overview/test-utils';
import { TrafficBreakdownValue } from '@/js/modules/analytics-4/components/traffic-overview/utils/getBreakdownRows';
import * as tracking from '@/js/util/tracking';
import { createTestRegistry, fireEvent, render } from '@tests/js/test-utils';
import { provideSiteInfo } from '@tests/js/utils';
import TrafficBreakdown from './TrafficBreakdown';

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );

const CHANNELS = createBreakdownValues( [
	[ 'Organic Search', 1200 ],
	[ 'Direct', 600 ],
	[ 'Paid Search', 400 ],
] );
const LOCATIONS = createBreakdownValues( [
	[ 'United States', 800 ],
	[ 'Germany', 200 ],
] );
const DEVICES = createBreakdownValues( [
	[ 'desktop', 700 ],
	[ 'mobile', 300 ],
] );

/** Rounded one by one, these shares would add up to 99%, with "Others" at 0%. */
const LONG_TAIL_CHANNELS = createBreakdownValues( [
	[ 'Direct', 4630 ],
	[ 'Organic Search', 3040 ],
	[ 'Organic Social', 1560 ],
	[ 'Referral', 730 ],
	[ 'Paid Search', 25 ],
	[ 'Email', 15 ],
] );

/**
 * Ten values: collapsed, four of them fill the column and "Others" adds up
 * the rest; expanded, eight fill it and "Others" adds up the last two.
 */
const MANY_CHANNELS = createBreakdownValues( [
	[ 'Direct', 1000 ],
	[ 'Organic Search', 900 ],
	[ 'Referral', 800 ],
	[ 'Display', 700 ],
	[ 'Organic Video', 600 ],
	[ 'Organic Social', 500 ],
	[ 'Paid Search', 400 ],
	[ 'Email', 300 ],
	[ 'Unassigned', 200 ],
	[ 'Affiliates', 100 ],
] );

describe( 'TrafficBreakdown', () => {
	let registry: WPDataRegistry;

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );
		mockTrackEvent.mockClear();
	} );

	function renderBreakdown(
		values: Record< string, TrafficBreakdownValue[] | undefined >
	) {
		return render( <TrafficBreakdown values={ values } />, { registry } );
	}

	function getRowLabels( column: Element ) {
		return Array.from(
			column.querySelectorAll(
				'.googlesitekit-traffic-overview__breakdown-row-label'
			)
		).map( ( label ) => label.textContent );
	}

	it( 'renders the section heading above the three column headings, in the catalog order', () => {
		const { getAllByRole } = renderBreakdown( {
			channels: CHANNELS,
			locations: LOCATIONS,
			devices: DEVICES,
		} );

		expect(
			getAllByRole( 'heading' ).map( ( heading ) => heading.textContent )
		).toEqual( [
			'Traffic breakdown',
			'Visits by channels',
			'Visits by locations',
			'Visits by devices',
		] );
	} );

	it( 'names the section region after its own heading', () => {
		const { getAllByRole } = renderBreakdown( {
			channels: CHANNELS,
			locations: LOCATIONS,
			devices: DEVICES,
		} );

		expect(
			getAllByRole( 'region', { name: 'Traffic breakdown' } )
		).toHaveLength( 1 );
	} );

	it( 'names each column region after its own heading', () => {
		const { getAllByRole } = renderBreakdown( {
			channels: CHANNELS,
			locations: LOCATIONS,
			devices: DEVICES,
		} );

		expect(
			getAllByRole( 'region', { name: 'Visits by channels' } )
		).toHaveLength( 1 );
		expect(
			getAllByRole( 'region', { name: 'Visits by locations' } )
		).toHaveLength( 1 );
		expect(
			getAllByRole( 'region', { name: 'Visits by devices' } )
		).toHaveLength( 1 );
	} );

	it( 'marks each column with its own dimension, so only the devices column capitalizes its labels', () => {
		const { container } = renderBreakdown( {
			channels: CHANNELS,
			locations: LOCATIONS,
			devices: DEVICES,
		} );

		const columns = container.querySelectorAll(
			'.googlesitekit-traffic-overview__breakdown-column'
		);

		expect( columns[ 0 ] ).toHaveClass(
			'googlesitekit-traffic-overview__breakdown-column--channels'
		);
		expect( columns[ 1 ] ).toHaveClass(
			'googlesitekit-traffic-overview__breakdown-column--locations'
		);
		expect( columns[ 2 ] ).toHaveClass(
			'googlesitekit-traffic-overview__breakdown-column--devices'
		);
	} );

	it( 'reads each row as its label then its share', () => {
		const { getByRole } = renderBreakdown( {
			channels: CHANNELS,
			locations: LOCATIONS,
			devices: DEVICES,
		} );

		const channels = getByRole( 'region', {
			name: 'Visits by channels',
		} );
		const rows = Array.from(
			channels.querySelectorAll(
				'.googlesitekit-traffic-overview__breakdown-row'
			)
		).map( ( row ) => row.textContent );

		// The shares of 2200, as the acceptance criteria spell them out.
		expect( rows ).toEqual( [
			'Organic Search55%',
			'Direct27%',
			'Paid Search18%',
		] );
	} );

	it( 'shows a row that gets no whole percent as "<1%", and the shares add up to 100%', () => {
		const { getByRole } = renderBreakdown( {
			channels: LONG_TAIL_CHANNELS,
			locations: LOCATIONS,
			devices: DEVICES,
		} );

		const channels = getByRole( 'region', {
			name: 'Visits by channels',
		} );
		const rows = Array.from(
			channels.querySelectorAll(
				'.googlesitekit-traffic-overview__breakdown-row'
			)
		).map( ( row ) => row.textContent );

		// 46%, 31%, 16%, and 7% add up to 100%, and "Others" gets no whole
		// percent, so it shows "<1%".
		expect( rows ).toEqual( [
			'Direct46%',
			'Organic Search31%',
			'Organic Social16%',
			'Referral7%',
			'Others<1%',
		] );
	} );

	it( 'shows the zero data message for a column with no rows, and the other two keep their rows', () => {
		const { getByRole, getByText } = renderBreakdown( {
			channels: CHANNELS,
			locations: createBreakdownValues( [] ),
			devices: DEVICES,
		} );

		const locations = getByRole( 'region', {
			name: 'Visits by locations',
		} );

		expect( locations ).toHaveTextContent(
			'No data to display: your site hasn’t received any visitors yet'
		);
		expect( getByText( 'Organic Search' ) ).toBeInTheDocument();
		expect( getByText( 'desktop' ) ).toBeInTheDocument();
	} );

	it( 'should render nothing that can be clicked when every column shows all its values, and clicking a row changes nothing', () => {
		const { container, getByText } = renderBreakdown( {
			channels: CHANNELS,
			locations: LOCATIONS,
			devices: DEVICES,
		} );

		expect( container.querySelector( 'a' ) ).toBeNull();
		expect( container.querySelector( 'button' ) ).toBeNull();

		const before = container.innerHTML;

		fireEvent.click( getByText( 'Organic Search' ) );
		fireEvent.click( getByText( '55%' ) );
		fireEvent.click( getByText( 'Visits by channels' ) );

		expect( container.innerHTML ).toBe( before );
		expect( mockTrackEvent ).not.toHaveBeenCalled();
	} );

	it( 'renders an "Others" row that is inert too', () => {
		const { container, getByText } = renderBreakdown( {
			channels: createBreakdownValues( [
				[ 'A', 50 ],
				[ 'B', 40 ],
				[ 'C', 30 ],
				[ 'D', 20 ],
				[ 'E', 10 ],
				[ 'F', 5 ],
			] ),
			locations: LOCATIONS,
			devices: DEVICES,
		} );

		const others = getByText( 'Others' );
		const before = container.innerHTML;

		fireEvent.click( others );

		expect( container.innerHTML ).toBe( before );
		expect( mockTrackEvent ).not.toHaveBeenCalled();
	} );

	it( 'renders a dimension value named "Others" alongside the folded row', () => {
		const { getAllByText } = renderBreakdown( {
			channels: createBreakdownValues( [
				[ 'Others', 100 ],
				[ 'B', 40 ],
				[ 'C', 30 ],
				[ 'D', 20 ],
				[ 'E', 10 ],
				[ 'F', 5 ],
			] ),
			locations: LOCATIONS,
			devices: DEVICES,
		} );

		// Both survive: the real value and the row the tail folds into.
		expect( getAllByText( 'Others' ) ).toHaveLength( 2 );
	} );

	it( 'should render every heading above placeholder rows while the values load', () => {
		const { container, getAllByRole, queryByText } = render(
			<TrafficBreakdown
				values={ {
					channels: CHANNELS,
					locations: LOCATIONS,
					devices: DEVICES,
				} }
				loaded={ false }
			/>,
			{ registry }
		);

		expect(
			getAllByRole( 'heading' ).map( ( heading ) => heading.textContent )
		).toEqual( [
			'Traffic breakdown',
			'Visits by channels',
			'Visits by locations',
			'Visits by devices',
		] );
		// Five placeholder rows in each of the three columns.
		expect(
			container.querySelectorAll( '.googlesitekit-preview-block' )
		).toHaveLength( 15 );
		expect( queryByText( 'Organic Search' ) ).not.toBeInTheDocument();
	} );

	it( 'should render every column heading above "We’re still collecting data" while the property is gathering data', () => {
		const { getAllByRole, getAllByText, queryByText } = render(
			<TrafficBreakdown
				values={ {
					channels: CHANNELS,
					locations: LOCATIONS,
					devices: DEVICES,
				} }
				gatheringData
			/>,
			{ registry }
		);

		expect(
			getAllByRole( 'heading' ).map( ( heading ) => heading.textContent )
		).toEqual( [
			'Traffic breakdown',
			'Visits by channels',
			'Visits by locations',
			'Visits by devices',
		] );
		expect( getAllByText( 'We’re still collecting data' ) ).toHaveLength(
			3
		);
		expect(
			queryByText(
				'No data to display: your site hasn’t received any visitors yet'
			)
		).not.toBeInTheDocument();
		// `CHANNELS` has an "Organic Search" row, and a property gathering data
		// shows none.
		expect( queryByText( 'Organic Search' ) ).not.toBeInTheDocument();
	} );

	it( 'should render a column whose values have not arrived as its zero data message', () => {
		const { getByRole } = renderBreakdown( {
			channels: CHANNELS,
			locations: LOCATIONS,
			devices: undefined,
		} );

		expect(
			getByRole( 'region', { name: 'Visits by devices' } )
		).toHaveTextContent(
			'No data to display: your site hasn’t received any visitors yet'
		);
	} );

	it( 'should draw a bar under each row, filled to the row’s share of the column, and hide it from screen readers', () => {
		const { getByRole } = renderBreakdown( {
			channels: CHANNELS,
			locations: LOCATIONS,
			devices: DEVICES,
		} );

		const channels = getByRole( 'region', {
			name: 'Visits by channels',
		} );
		const bars = Array.from(
			channels.querySelectorAll(
				'.googlesitekit-traffic-overview__breakdown-row-bar'
			)
		);
		const fillWidths = Array.from(
			channels.querySelectorAll< HTMLDivElement >(
				'.googlesitekit-traffic-overview__breakdown-row-bar-fill'
			)
		).map( ( fill ) => parseFloat( fill.style.width ) );

		expect( bars ).toHaveLength( 3 );
		bars.forEach( ( bar ) => {
			expect( bar ).toHaveAttribute( 'aria-hidden', 'true' );
		} );
		// The exact shares of 2200, which the rows read as 55%, 27% and 18%.
		expect( fillWidths ).toHaveLength( 3 );
		expect( fillWidths[ 0 ] ).toBeCloseTo( ( 1200 / 2200 ) * 100, 6 );
		expect( fillWidths[ 1 ] ).toBeCloseTo( ( 600 / 2200 ) * 100, 6 );
		expect( fillWidths[ 2 ] ).toBeCloseTo( ( 400 / 2200 ) * 100, 6 );
	} );

	it( 'should render no "Show more" when no column has more than five values', () => {
		const { queryByRole } = renderBreakdown( {
			// Five values fill the column without an "Others" row.
			channels: createBreakdownValues( [
				[ 'A', 50 ],
				[ 'B', 40 ],
				[ 'C', 30 ],
				[ 'D', 20 ],
				[ 'E', 10 ],
			] ),
			locations: LOCATIONS,
			devices: DEVICES,
		} );

		expect( queryByRole( 'button' ) ).not.toBeInTheDocument();
	} );

	it( 'should render "Show more" for the columns when a column has more than five values', () => {
		const { getByRole } = renderBreakdown( {
			channels: MANY_CHANNELS,
			locations: LOCATIONS,
			devices: DEVICES,
		} );

		const toggle = getByRole( 'button', { name: 'Show more' } );

		expect( toggle ).toHaveAttribute( 'aria-expanded', 'false' );
		expect(
			document.getElementById(
				toggle.getAttribute( 'aria-controls' ) ?? ''
			)
		).toHaveClass( 'googlesitekit-traffic-overview__breakdown-columns' );
	} );

	it( 'should show up to nine rows in each column after "Show more" is clicked, and five again after "Show less"', () => {
		const { getByRole } = renderBreakdown( {
			channels: MANY_CHANNELS,
			locations: LOCATIONS,
			devices: DEVICES,
		} );

		const channels = getByRole( 'region', {
			name: 'Visits by channels',
		} );
		const locations = getByRole( 'region', {
			name: 'Visits by locations',
		} );
		const collapsedChannels = [
			'Direct',
			'Organic Search',
			'Referral',
			'Display',
			'Others',
		];

		expect( getRowLabels( channels ) ).toEqual( collapsedChannels );

		fireEvent.click( getByRole( 'button', { name: 'Show more' } ) );

		// Eight values fill the column, and "Others" adds up the last two.
		expect( getRowLabels( channels ) ).toEqual( [
			'Direct',
			'Organic Search',
			'Referral',
			'Display',
			'Organic Video',
			'Organic Social',
			'Paid Search',
			'Email',
			'Others',
		] );
		// A column that already shows all its values keeps them.
		expect( getRowLabels( locations ) ).toEqual( [
			'United States',
			'Germany',
		] );
		expect( getByRole( 'button', { name: 'Show less' } ) ).toHaveAttribute(
			'aria-expanded',
			'true'
		);

		fireEvent.click( getByRole( 'button', { name: 'Show less' } ) );

		expect( getRowLabels( channels ) ).toEqual( collapsedChannels );
		expect( getByRole( 'button', { name: 'Show more' } ) ).toHaveAttribute(
			'aria-expanded',
			'false'
		);
	} );

	it.each( [
		[ 'while the values load', { loaded: false } ],
		[ 'while the property is gathering data', { gatheringData: true } ],
	] )( 'should render no "Show more" %s', ( _, props ) => {
		const { queryByRole } = render(
			<TrafficBreakdown
				values={ {
					channels: MANY_CHANNELS,
					locations: LOCATIONS,
					devices: DEVICES,
				} }
				{ ...props }
			/>,
			{ registry }
		);

		expect( queryByRole( 'button' ) ).not.toBeInTheDocument();
	} );
} );
