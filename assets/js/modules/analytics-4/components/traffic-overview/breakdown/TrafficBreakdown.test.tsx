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
import { Report } from '@/js/modules/analytics-4/datastore/types';
import * as tracking from '@/js/util/tracking';
import { createTestRegistry, fireEvent, render } from '@tests/js/test-utils';
import { provideSiteInfo } from '@tests/js/utils';
import TrafficBreakdown from './TrafficBreakdown';

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );

/**
 * Builds a breakdown report from label and visitor pairs, in the order given.
 *
 * @since n.e.x.t
 *
 * @param {Array<Array>} pairs `[ label, visitors ]` pairs.
 * @return {Object} The breakdown report.
 */
function createReport( pairs: Array< [ string, number ] > ): Report {
	return {
		rows: pairs.map( ( [ label, visitors ] ) => ( {
			dimensionValues: [ { value: label } ],
			metricValues: [ { value: String( visitors ) } ],
		} ) ),
	};
}

const CHANNELS = createReport( [
	[ 'Organic Search', 1200 ],
	[ 'Direct', 600 ],
	[ 'Paid Search', 400 ],
] );
const LOCATIONS = createReport( [
	[ 'United States', 800 ],
	[ 'Germany', 200 ],
] );
const DEVICES = createReport( [
	[ 'desktop', 700 ],
	[ 'mobile', 300 ],
] );

describe( 'TrafficBreakdown', () => {
	let registry: WPDataRegistry;

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );
		mockTrackEvent.mockClear();
	} );

	function renderBreakdown( reports: Record< string, Report | undefined > ) {
		return render( <TrafficBreakdown reports={ reports } />, { registry } );
	}

	it( 'renders the three headings in the catalog order', () => {
		const { getAllByRole } = renderBreakdown( {
			channels: CHANNELS,
			locations: LOCATIONS,
			devices: DEVICES,
		} );

		expect(
			getAllByRole( 'heading' ).map( ( heading ) => heading.textContent )
		).toEqual( [
			'Visitors by channels',
			'Visitors by locations',
			'Visitors by devices',
		] );
	} );

	it( 'names each column region after its own heading', () => {
		const { getAllByRole } = renderBreakdown( {
			channels: CHANNELS,
			locations: LOCATIONS,
			devices: DEVICES,
		} );

		expect(
			getAllByRole( 'region', { name: 'Visitors by channels' } )
		).toHaveLength( 1 );
		expect(
			getAllByRole( 'region', { name: 'Visitors by locations' } )
		).toHaveLength( 1 );
		expect(
			getAllByRole( 'region', { name: 'Visitors by devices' } )
		).toHaveLength( 1 );
	} );

	it( 'reads each row as its label then its share', () => {
		const { getByRole } = renderBreakdown( {
			channels: CHANNELS,
			locations: LOCATIONS,
			devices: DEVICES,
		} );

		const channels = getByRole( 'region', {
			name: 'Visitors by channels',
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

	it( 'shows the zero data message for a column with no rows, and the other two keep their rows', () => {
		const { getByRole, getByText } = renderBreakdown( {
			channels: CHANNELS,
			locations: createReport( [] ),
			devices: DEVICES,
		} );

		const locations = getByRole( 'region', {
			name: 'Visitors by locations',
		} );

		expect( locations ).toHaveTextContent(
			'No data to display: your site hasn’t received any visitors yet'
		);
		expect( getByText( 'Organic Search' ) ).toBeInTheDocument();
		expect( getByText( 'desktop' ) ).toBeInTheDocument();
	} );

	it( 'renders nothing that can be clicked, and clicking a row changes nothing', () => {
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
		fireEvent.click( getByText( 'Visitors by channels' ) );

		expect( container.innerHTML ).toBe( before );
		expect( mockTrackEvent ).not.toHaveBeenCalled();
	} );

	it( 'renders an "Others" row that is inert too', () => {
		const { container, getByText } = renderBreakdown( {
			channels: createReport( [
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
			channels: createReport( [
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

	it( 'renders a column whose report has not arrived as its zero data message', () => {
		const { getByRole } = renderBreakdown( {
			channels: CHANNELS,
			locations: LOCATIONS,
			devices: undefined,
		} );

		expect(
			getByRole( 'region', { name: 'Visitors by devices' } )
		).toHaveTextContent(
			'No data to display: your site hasn’t received any visitors yet'
		);
	} );
} );
