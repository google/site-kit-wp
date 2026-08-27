/**
 * Site Goals KeyActionChartTile tests.
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
import { GOAL_TYPES } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import {
	Report,
	ReportOptions,
} from '@/js/modules/analytics-4/datastore/types';
import { getPreviousDate } from '@/js/util';
import { freezeFetch, render, waitFor } from '@tests/js/test-utils';
import {
	createTestRegistry,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	provideUserCapabilities,
} from '@tests/js/utils';
import getKeyActionChartReportOptions, {
	KeyActionChartReportArgs,
} from './getKeyActionChartReportOptions';
import KeyActionChartTile, {
	KeyActionChartTileProps,
} from './KeyActionChartTile';

type ChartInputs = Partial< Omit< KeyActionChartReportArgs, 'dates' > >;

const mockGoogleChart = jest.fn();

// Google Charts draws nothing under Jest, so this stub records the props a
// test reads.
jest.mock( '@/js/components/GoogleChart', () => {
	return function GoogleChartStub( props: Record< string, unknown > ) {
		mockGoogleChart( props );
		return <div className="googlesitekit-chart" />;
	};
} );

const dates = { startDate: '2020-08-11', endDate: '2020-09-07' };

/**
 * The event names and the goal the tile renders with unless a test overrides
 * them.
 */
const DEFAULT_INPUTS: Required< Omit< ChartInputs, 'breakdownFilter' > > = {
	eventNames: [ 'purchase' ],
	goalType: GOAL_TYPES.ECOMMERCE,
};

const REPORT_ENDPOINT = new RegExp(
	'^/google-site-kit/v1/modules/analytics-4/data/report'
);

const WOOCOMMERCE_FILTER = {
	'customEvent:googlesitekit_event_provider': 'woocommerce',
};

/**
 * Builds the report options the tile asks for.
 *
 * @since n.e.x.t
 *
 * @param {Object} [inputs] Inputs that override `DEFAULT_INPUTS`.
 * @return {Object} The options to pass `getReport`.
 */
function buildChartReportOptions( inputs: ChartInputs = {} ) {
	return getKeyActionChartReportOptions( {
		dates,
		...DEFAULT_INPUTS,
		...inputs,
	} );
}

/**
 * Builds one report row per count, starting on `dates.startDate`.
 *
 * @since n.e.x.t
 *
 * @param {Array} counts The event count for each day, as strings.
 * @return {Array} One row per count, each holding its date and its count.
 */
function buildDailyReportRows( counts: string[] ) {
	return counts.map( ( value, index ) => ( {
		dimensionValues: [
			{
				value: getPreviousDate( dates.startDate, -index ).replace(
					/-/g,
					''
				),
			},
		],
		metricValues: [ { value } ],
	} ) );
}

describe( 'KeyActionChartTile', () => {
	let registry: WPDataRegistry;

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );
		provideUserAuthentication( registry );
		provideUserCapabilities( registry );
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
			},
		] );
	} );

	afterEach( () => {
		mockGoogleChart.mockClear();
	} );

	/**
	 * Adds one report to the registry and marks its resolution finished.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} options The options to store the report under.
	 * @param {Object} report  The report the tile reads.
	 * @return {void}
	 */
	function receiveChartReport( options: ReportOptions, report: Report ) {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( report, { options } );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getReport', [ options ] );
	}

	/**
	 * Renders the `KeyActionChartTile` component with the default title and inputs.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} [props] Props that override the title and `DEFAULT_INPUTS`.
	 * @return {Object} The render result, with its queries and `waitForRegistry`.
	 */
	function renderChartTile( props: Partial< KeyActionChartTileProps > = {} ) {
		return render(
			<KeyActionChartTile
				title="Total sales in the last 28 days"
				dates={ dates }
				{ ...DEFAULT_INPUTS }
				{ ...props }
			/>,
			{ registry }
		);
	}

	/**
	 * Waits for the tile to render `GoogleChartStub`, then reads what it passed.
	 *
	 * @since n.e.x.t
	 *
	 * @return {Object} The props the chart last received.
	 */
	async function getLastChartProps() {
		await waitFor( () => expect( mockGoogleChart ).toHaveBeenCalled() );

		const { calls } = mockGoogleChart.mock;

		return calls[ calls.length - 1 ][ 0 ];
	}

	it( 'shows its title and an area chart', async () => {
		receiveChartReport( buildChartReportOptions(), {
			rows: buildDailyReportRows( [ '4', '9' ] ),
		} );

		const { getByText } = renderChartTile();

		expect(
			getByText( 'Total sales in the last 28 days' )
		).toBeInTheDocument();

		const { chartType, data } = await getLastChartProps();

		expect( chartType ).toBe( 'AreaChart' );
		// The first row is the header that gives each column its type.
		expect( data[ 0 ] ).toEqual( [
			{ type: 'date', label: 'Day' },
			{ type: 'number', label: 'Events' },
			{ type: 'number', label: 'Events' },
		] );
	} );

	const chartCases: Array< {
		name: string;
		inputs: ChartInputs;
		counts: string[];
		points: Array< [ Date, number, number ] >;
	} > = [
		{
			name: 'one point for every day the report returns',
			inputs: {},
			counts: [ '4', '9', '0' ],
			points: [
				[ new Date( 2020, 7, 11 ), 4, 4 ],
				[ new Date( 2020, 7, 12 ), 9, 9 ],
				[ new Date( 2020, 7, 13 ), 0, 0 ],
			],
		},
		{
			name: 'the daily counts of a Key action with more than one event name',
			inputs: {
				eventNames: [ 'submit_lead_form', 'contact' ],
				goalType: GOAL_TYPES.LEAD,
			},
			counts: [ '6', '2' ],
			points: [
				[ new Date( 2020, 7, 11 ), 6, 6 ],
				[ new Date( 2020, 7, 12 ), 2, 2 ],
			],
		},
		{
			name: "only the selected breakdown tab's counts",
			inputs: { breakdownFilter: WOOCOMMERCE_FILTER },
			counts: [ '7', '3' ],
			points: [
				[ new Date( 2020, 7, 11 ), 7, 7 ],
				[ new Date( 2020, 7, 12 ), 3, 3 ],
			],
		},
	];

	it.each( chartCases )(
		'draws $name',
		async ( { inputs, counts, points } ) => {
			receiveChartReport( buildChartReportOptions( inputs ), {
				rows: buildDailyReportRows( counts ),
			} );

			renderChartTile( inputs );

			const { data } = await getLastChartProps();

			// Every row holds its count twice, once for the area and once for
			// the line.
			expect( data.slice( 1 ) ).toEqual( points );
		}
	);

	it( 'shows a loading placeholder, not the zero data message, on the first render', () => {
		// The frozen fetch leaves the report unresolved.
		freezeFetch( REPORT_ENDPOINT );

		const { container } = renderChartTile();

		expect(
			container.querySelector( '.googlesitekit-site-goals-tile__loading' )
		).toBeInTheDocument();
		expect(
			container.querySelector(
				'.googlesitekit-site-goals-tile__zero-state'
			)
		).not.toBeInTheDocument();
	} );

	it( 'shows a loading placeholder instead of the chart while the report loads', () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.startResolution( 'getReport', [ buildChartReportOptions() ] );

		const { container } = renderChartTile();

		expect(
			container.querySelector( '.googlesitekit-site-goals-tile__loading' )
		).toBeInTheDocument();
		expect( mockGoogleChart ).not.toHaveBeenCalled();
	} );

	it( 'shows the report error instead of the chart when the report fails', async () => {
		const options = buildChartReportOptions();

		registry.dispatch( MODULES_ANALYTICS_4 ).setErrorForSelector(
			{
				code: 400,
				message: 'Data loading failed',
				data: { status: 400, reason: 'badRequest' },
			},
			'getReport',
			[ options ]
		);
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getReport', [ options ] );

		const { getByText } = renderChartTile();

		await waitFor( () =>
			expect( getByText( 'Data loading failed' ) ).toBeInTheDocument()
		);
		expect( mockGoogleChart ).not.toHaveBeenCalled();
	} );

	it( 'says the site has received no sales yet when every daily count is zero', async () => {
		receiveChartReport( buildChartReportOptions(), {
			rows: buildDailyReportRows( [ '0', '0' ] ),
		} );

		const { getByText, waitForRegistry } = renderChartTile();
		await waitForRegistry();

		expect(
			getByText(
				'No data to display: your site hasn’t received any sales yet'
			)
		).toBeInTheDocument();
		expect( mockGoogleChart ).not.toHaveBeenCalled();
	} );

	it( 'says the site has received no leads yet for the lead generation goal', async () => {
		receiveChartReport(
			buildChartReportOptions( {
				eventNames: [ 'submit_lead_form' ],
				goalType: GOAL_TYPES.LEAD,
			} ),
			{ rows: [] }
		);

		const { getByText, waitForRegistry } = renderChartTile( {
			eventNames: [ 'submit_lead_form' ],
			goalType: GOAL_TYPES.LEAD,
		} );
		await waitForRegistry();

		expect(
			getByText(
				'No data to display: your site hasn’t received any leads yet'
			)
		).toBeInTheDocument();
	} );
} );
