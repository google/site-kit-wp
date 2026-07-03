/**
 * ModuleOverviewWidget component tests.
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
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { getWidgetComponentProps } from '@/js/googlesitekit/widgets/util';
import { MODULE_SLUG_ADSENSE } from '@/js/modules/adsense/constants';
import { MODULES_ADSENSE } from '@/js/modules/adsense/datastore/constants';
import {
	createTestRegistry,
	muteFetch,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	provideUserInfo,
	render,
} from '@tests/js/test-utils';
import {
	getCurrentRangeArgs,
	getCurrentRangeChartArgs,
	getPreviousRangeArgs,
	getPreviousRangeChartArgs,
} from './reportOptions';
import ModuleOverviewWidget from '.';

const METRIC_HEADERS = [
	{
		name: 'ESTIMATED_EARNINGS',
		type: 'METRIC_CURRENCY',
		currencyCode: 'USD',
	},
	{ name: 'PAGE_VIEWS_RPM', type: 'METRIC_CURRENCY', currencyCode: 'USD' },
	{ name: 'IMPRESSIONS', type: 'METRIC_TALLY' },
	{ name: 'PAGE_VIEWS_CTR', type: 'METRIC_RATIO' },
];

const CURRENT_RANGE_DAYS = [
	'2025-01-08',
	'2025-01-09',
	'2025-01-10',
	'2025-01-11',
	'2025-01-12',
	'2025-01-13',
	'2025-01-14',
];
const PREVIOUS_RANGE_DAYS = [
	'2025-01-01',
	'2025-01-02',
	'2025-01-03',
	'2025-01-04',
	'2025-01-05',
	'2025-01-06',
	'2025-01-07',
];

/**
 * Splits a `YYYY-MM-DD` date into the parts the AdSense API returns.
 *
 * @since n.e.x.t
 *
 * @param date The date string.
 * @return The date parts.
 */
function toAdSenseDate( date: string ) {
	const [ year, month, day ] = date.split( '-' ).map( Number );
	return { year, month, day };
}

/**
 * Builds an AdSense totals report fixture with one cell per metric.
 *
 * @since n.e.x.t
 *
 * @param options           Options.
 * @param options.startDate First day of the report.
 * @param options.endDate   Last day of the report.
 * @param options.totals    One total per metric, in report column order.
 * @return The totals report fixture.
 */
function buildTotalsReport( {
	startDate,
	endDate,
	totals,
}: {
	startDate: string;
	endDate: string;
	totals: number[];
} ) {
	return {
		startDate: toAdSenseDate( startDate ),
		endDate: toAdSenseDate( endDate ),
		headers: METRIC_HEADERS,
		totals: {
			cells: totals.map( ( value ) => ( { value: String( value ) } ) ),
		},
		rows: [],
	};
}

/**
 * Builds an AdSense daily series report fixture, one row per day.
 *
 * @since n.e.x.t
 *
 * @param options             Options.
 * @param options.days        The report days, as `YYYY-MM-DD` strings.
 * @param options.dailyValues One value per metric, repeated for every day.
 * @param options.totals      One total per metric, in report column order.
 * @return The daily series report fixture.
 */
function buildChartReport( {
	days,
	dailyValues,
	totals,
}: {
	days: string[];
	dailyValues: number[];
	totals: number[];
} ) {
	return {
		startDate: toAdSenseDate( days[ 0 ] ),
		endDate: toAdSenseDate( days[ days.length - 1 ] ),
		headers: [ { name: 'DATE' }, ...METRIC_HEADERS ],
		totals: {
			cells: [
				{ value: '' },
				...totals.map( ( value ) => ( { value: String( value ) } ) ),
			],
		},
		rows: days.map( ( day ) => ( {
			cells: [
				{ value: day },
				...dailyValues.map( ( value ) => ( {
					value: String( value ),
				} ) ),
			],
		} ) ),
	};
}

describe( 'ModuleOverviewWidget', () => {
	let registry: WPDataRegistry;

	const widgetComponentProps = getWidgetComponentProps(
		'adsenseModuleOverview'
	);

	beforeEach( () => {
		registry = createTestRegistry();

		provideModules( registry, [
			{ slug: MODULE_SLUG_ADSENSE, active: true, connected: true },
		] );
		provideSiteInfo( registry );
		provideUserAuthentication( registry );
		provideUserInfo( registry );

		registry.dispatch( MODULES_ADSENSE ).receiveGetSettings( {
			accountID: 'pub-123456789',
			clientID: 'ca-pub-123456789',
			accountStatus: 'ready',
			siteStatus: 'ready',
			accountSetupComplete: true,
			siteSetupComplete: true,
		} );

		registry.dispatch( CORE_USER ).setReferenceDate( '2025-01-15' );
		registry.dispatch( CORE_USER ).setDateRange( 'last-7-days' );

		muteFetch(
			new RegExp(
				'^/google-site-kit/v1/modules/adsense/data/data-available'
			)
		);
	} );

	// Regression coverage for the reportOptions.ts extraction: the dashboard
	// widget must keep requesting the same four reports it did when the args
	// were inlined, so the dashboard and PDF report cannot drift.
	it( 'should render the four metric cards from the reports the extracted builders request', async () => {
		const dates = registry
			.select( CORE_USER )
			.getDateRangeDates( { compare: true } );

		registry.dispatch( MODULES_ADSENSE ).receiveGetReport(
			buildTotalsReport( {
				startDate: dates.startDate,
				endDate: dates.endDate,
				totals: [ 10.5, 2.5, 4200, 0.05 ],
			} ),
			{ options: getCurrentRangeArgs( dates ) }
		);
		registry.dispatch( MODULES_ADSENSE ).receiveGetReport(
			buildTotalsReport( {
				startDate: dates.compareStartDate,
				endDate: dates.compareEndDate,
				totals: [ 5.25, 2, 2100, 0.04 ],
			} ),
			{ options: getPreviousRangeArgs( dates ) }
		);
		registry.dispatch( MODULES_ADSENSE ).receiveGetReport(
			buildChartReport( {
				days: CURRENT_RANGE_DAYS,
				dailyValues: [ 1.5, 2.5, 600, 0.05 ],
				totals: [ 10.5, 2.5, 4200, 0.05 ],
			} ),
			{ options: getCurrentRangeChartArgs( dates ) }
		);
		registry.dispatch( MODULES_ADSENSE ).receiveGetReport(
			buildChartReport( {
				days: PREVIOUS_RANGE_DAYS,
				dailyValues: [ 0.75, 2, 300, 0.04 ],
				totals: [ 5.25, 2, 2100, 0.04 ],
			} ),
			{ options: getPreviousRangeChartArgs( dates ) }
		);

		const { getByText, queryByText, waitForRegistry } = render(
			<ModuleOverviewWidget { ...widgetComponentProps } />,
			{ registry }
		);

		await waitForRegistry();

		// The pre-populated reports satisfy the widget's selectors, so the
		// four overview cards render instead of the loading previews.
		expect( getByText( 'Earnings' ) ).toBeInTheDocument();
		expect( getByText( 'Page RPM' ) ).toBeInTheDocument();
		expect( getByText( 'Impressions' ) ).toBeInTheDocument();
		expect( getByText( 'Page CTR' ) ).toBeInTheDocument();

		expect(
			queryByText( /Data error in AdSense/i )
		).not.toBeInTheDocument();
	} );
} );
