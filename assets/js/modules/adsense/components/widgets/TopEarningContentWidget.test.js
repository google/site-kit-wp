/**
 * TopEarningContentWidget component tests.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { render } from '../../../../../../tests/js/test-utils';
import {
	createTestRegistry,
	provideKeyMetrics,
	provideModules,
} from '../../../../../../tests/js/utils';
import {
	getAnalytics4MockResponse,
	provideAnalytics4MockReport,
	STRATEGY_ZIP,
} from '../../../analytics-4/utils/data-mock';
import { getWidgetComponentProps } from '../../../../googlesitekit/widgets/util';
import {
	CORE_USER,
	KM_ANALYTICS_ADSENSE_TOP_EARNING_CONTENT,
} from '../../../../googlesitekit/datastore/user/constants';
import TopEarningContentWidget from './TopEarningContentWidget';
import { withConnected } from '../../../../googlesitekit/modules/datastore/__fixtures__';
import { DATE_RANGE_OFFSET, MODULES_ADSENSE } from '../../datastore/constants';
import { MODULES_ANALYTICS_4 } from '../../../analytics-4/datastore/constants';

describe( 'TopCountriesWidget', () => {
	const { Widget, WidgetNull } = getWidgetComponentProps(
		KM_ANALYTICS_ADSENSE_TOP_EARNING_CONTENT
	);

	const adSenseAccountID = 'pub-1234567890';

	const basePageTitlesReportOptions = {
		dimensionFilters: {
			pagePath: new Array( 3 )
				.fill( '' )
				.map( ( _, i ) => `/test-post-${ i + 1 }/` )
				.sort(),
		},
		dimensions: [ 'pagePath', 'pageTitle' ],
		metrics: [ { name: 'screenPageViews' } ],
		orderby: [ { metric: { metricName: 'screenPageViews' }, desc: true } ],
		limit: 15,
	};

	it( 'should render correctly with the expected metrics', async () => {
		const registry = createTestRegistry();
		registry.dispatch( CORE_USER ).setReferenceDate( '2020-09-08' );
		provideKeyMetrics( registry );
		provideModules( registry, withConnected( 'analytics-4', 'adsense' ) );
		registry.dispatch( MODULES_ANALYTICS_4 ).setAdSenseLinked( true );
		registry.dispatch( MODULES_ADSENSE ).setAccountID( adSenseAccountID );

		const pageTitlesReportOptions = {
			...registry
				.select( CORE_USER )
				.getDateRangeDates( { offsetDays: DATE_RANGE_OFFSET } ),
			...basePageTitlesReportOptions,
		};

		const pageTitlesReport = getAnalytics4MockResponse(
			pageTitlesReportOptions,
			// Use the zip combination strategy to ensure a one-to-one mapping of page paths to page titles.
			// Otherwise, by using the default cartesian product of dimension values, the resulting output will have non-matching
			// page paths to page titles.
			{ dimensionCombinationStrategy: STRATEGY_ZIP }
		);

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( pageTitlesReport, {
				options: pageTitlesReportOptions,
			} );

		provideAnalytics4MockReport( registry, {
			...registry
				.select( CORE_USER )
				.getDateRangeDates( { offsetDays: DATE_RANGE_OFFSET } ),
			dimensions: [ 'pagePath', 'adSourceName' ],
			metrics: [ { name: 'totalAdRevenue' } ],
			dimensionFilters: {
				adSourceName: `Google AdSense account (${ adSenseAccountID })`,
			},
			orderby: [
				{
					metric: { metricName: 'totalAdRevenue' },
					desc: true,
				},
			],
			limit: 3,
		} );

		const { container, waitForRegistry } = render(
			<TopEarningContentWidget
				Widget={ Widget }
				WidgetNull={ WidgetNull }
			/>,
			{ registry }
		);
		await waitForRegistry();

		expect( container ).toMatchSnapshot();
	} );
} );
