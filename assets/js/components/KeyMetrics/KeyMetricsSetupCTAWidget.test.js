/**
 * KeyMetricsSetupCTAWidget component tests.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import KeyMetricsSetupCTAWidget from './KeyMetricsSetupCTAWidget';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4 } from '../../modules/analytics-4/datastore/constants';
import { MODULES_SEARCH_CONSOLE } from '../../modules/search-console/datastore/constants';
import { getAnalytics4MockResponse } from '../../modules/analytics-4/utils/data-mock';
import { getSearchConsoleMockResponse } from '../../modules/search-console/util/data-mock';
import {
	render,
	createTestRegistry,
	provideModules,
	provideSiteInfo,
	muteFetch,
} from '../../../../tests/js/test-utils';

describe( 'KeyMetricsSetupCTAWidget', () => {
	let registry;

	const searchConsoleReportOptions = {
		dimensions: 'date',
		startDate: '2020-07-14',
		endDate: '2020-09-07',
	};

	const analytics4ReportOptions = {
		dimensions: [ 'date' ],
		metrics: [ { name: 'totalUsers' } ],
		startDate: '2020-08-11',
		endDate: '2020-09-07',
	};

	beforeEach( async () => {
		registry = createTestRegistry();

		provideSiteInfo( registry, { homeURL: 'http://example.com' } );

		await registry
			.dispatch( CORE_USER )
			.receiveIsUserInputCompleted( true );

		registry.dispatch( CORE_USER ).setReferenceDate( '2020-09-08' );

		fetchMock.getOnce(
			new RegExp( '^/google-site-kit/v1/core/user/data/authentication' ),
			{
				authenticated: true,
			}
		);

		muteFetch(
			new RegExp(
				'^/google-site-kit/v1/modules/analytics-4/data/data-available'
			)
		);

		muteFetch(
			new RegExp(
				'^/google-site-kit/v1/modules/search-console/data/data-available'
			)
		);
	} );

	it( 'does not render when SC is not connected', async () => {
		provideModules( registry, [
			{
				slug: 'search-console',
				active: true,
				connected: false,
			},
		] );

		const Widget = ( { children } ) => <div>{ children }</div>;
		const WidgetNull = () => <div>NULL</div>;

		const { container, waitForRegistry } = render(
			<KeyMetricsSetupCTAWidget
				Widget={ Widget }
				WidgetNull={ WidgetNull }
			/>,
			{
				registry,
				features: [ 'userInput' ],
			}
		);
		await waitForRegistry();
		expect( container ).toHaveTextContent( 'NULL' );
	} );

	it( 'does not render when GA4 is not connected', async () => {
		provideModules( registry, [
			{
				slug: 'analytics-4',
				active: true,
				connected: false,
			},
		] );

		// Provide reports to ensure "gathering data" is false for the Search Console module.
		registry
			.dispatch( MODULES_SEARCH_CONSOLE )
			.receiveGetReport(
				getSearchConsoleMockResponse( searchConsoleReportOptions ),
				{
					options: searchConsoleReportOptions,
				}
			);

		const Widget = ( { children } ) => <div>{ children }</div>;
		const WidgetNull = () => <div>NULL</div>;

		const { container, waitForRegistry } = render(
			<KeyMetricsSetupCTAWidget
				Widget={ Widget }
				WidgetNull={ WidgetNull }
			/>,
			{
				registry,
				features: [ 'userInput' ],
			}
		);
		await waitForRegistry();
		expect( container ).toHaveTextContent( 'NULL' );
	} );

	it( 'does render the CTA when SC and GA4 are both connected', async () => {
		global._googlesitekitUserData.isUserInputCompleted = false;
		await registry
			.dispatch( CORE_USER )
			.receiveIsUserInputCompleted( false );

		provideModules( registry, [
			{
				slug: 'search-console',
				active: true,
				connected: true,
			},
			{
				slug: 'analytics-4',
				active: true,
				connected: true,
			},
		] );

		// Provide reports to ensure "gathering data" is false for Analytics 4 and Search Console modules.
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport(
				getAnalytics4MockResponse( analytics4ReportOptions ),
				{
					options: analytics4ReportOptions,
				}
			);
		registry
			.dispatch( MODULES_SEARCH_CONSOLE )
			.receiveGetReport(
				getSearchConsoleMockResponse( searchConsoleReportOptions ),
				{
					options: searchConsoleReportOptions,
				}
			);

		const Widget = ( { children } ) => <div>{ children }</div>;
		const WidgetNull = () => <div>NULL</div>;

		const { container, getByRole, waitForRegistry } = render(
			<KeyMetricsSetupCTAWidget
				Widget={ Widget }
				WidgetNull={ WidgetNull }
			/>,
			{
				registry,
				features: [ 'userInput' ],
			}
		);
		await waitForRegistry();

		expect(
			container.querySelector( '.googlesitekit-publisher-win__title' )
		).toHaveTextContent(
			'Get metrics and suggestions tailored to your specific goals'
		);
		const button = getByRole( 'button', { name: /get tailored metrics/i } );
		expect( button ).toBeInTheDocument();
		expect( button ).toHaveAttribute(
			'href',
			'http://example.com/wp-admin/admin.php?page=googlesitekit-user-input'
		);
	} );
} );
