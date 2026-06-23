/**
 * DashboardPopularKeywordsWidget component tests.
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
import { MODULE_SLUG_SEARCH_CONSOLE } from '@/js/modules/search-console/constants';
import { MODULES_SEARCH_CONSOLE } from '@/js/modules/search-console/datastore/constants';
import {
	createTestRegistry,
	provideModules,
	provideSiteInfo,
	render,
} from '@tests/js/test-utils';
import { getPopularKeywordsReportArgs } from './reportOptions';
import DashboardPopularKeywordsWidget from '.';

describe( 'DashboardPopularKeywordsWidget', () => {
	let registry: WPDataRegistry;
	const widgetProps = getWidgetComponentProps(
		'searchConsolePopularKeywords'
	);

	beforeEach( () => {
		registry = createTestRegistry();
		registry.dispatch( CORE_USER ).setReferenceDate( '2020-09-08' );
		provideSiteInfo( registry );
		provideModules( registry, [
			{ slug: MODULE_SLUG_SEARCH_CONSOLE, active: true, connected: true },
		] );
		registry
			.dispatch( MODULES_SEARCH_CONSOLE )
			.setPropertyID( 'https://example.com' );
		registry
			.dispatch( MODULES_SEARCH_CONSOLE )
			.receiveIsGatheringData( false );
	} );

	it( 'renders the search queries table with its columns, rows, and the Search Console source link', async () => {
		const reportArgs = getPopularKeywordsReportArgs(
			registry.select( CORE_USER ).getDateRangeDates()
		);

		const report = [
			{ keys: [ 'cat food' ], clicks: 1234, impressions: 5678 },
			{ keys: [ 'dog toys' ], clicks: 89, impressions: 210 },
		];

		// Store the report under the exact args the widget builds for this date
		// range, so the widget finds it only when it requests the report with
		// those args.
		registry
			.dispatch( MODULES_SEARCH_CONSOLE )
			.receiveGetReport( report, { options: reportArgs } );
		registry
			.dispatch( MODULES_SEARCH_CONSOLE )
			.finishResolution( 'getReport', [ reportArgs ] );

		const { getByText, waitForRegistry } = render(
			<DashboardPopularKeywordsWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		expect(
			getByText( 'Top search queries for your site' )
		).toBeInTheDocument();
		expect( getByText( 'Clicks' ) ).toBeInTheDocument();
		expect( getByText( 'Impressions' ) ).toBeInTheDocument();

		expect( getByText( 'cat food' ) ).toBeInTheDocument();
		expect( getByText( 'dog toys' ) ).toBeInTheDocument();
		expect( getByText( '1,234' ) ).toBeInTheDocument();
		expect( getByText( '5,678' ) ).toBeInTheDocument();

		// The footer renders the Search Console source link.
		expect( getByText( 'Search Console' ) ).toBeInTheDocument();
	} );
} );
