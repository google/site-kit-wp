/**
 * Traffic Overview footer tests.
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
import {
	VIEW_CONTEXT_ENTITY_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '@/js/googlesitekit/constants';
import {
	CORE_USER,
	PERMISSION_READ_SHARED_MODULE_DATA,
} from '@/js/googlesitekit/datastore/user/constants';
import { getMetaCapabilityPropertyName } from '@/js/googlesitekit/datastore/util/permissions';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import {
	provideBenchmarkingData,
	provideBenchmarkingInsight,
} from '@/js/modules/analytics-4/datastore/__factories__/benchmarking';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { MODULES_SEARCH_CONSOLE } from '@/js/modules/search-console/datastore/constants';
import { decodeServiceURL } from '@tests/js/mock-accountChooserURL-utils';
import { createTestRegistry, render, screen } from '@tests/js/test-utils';
import {
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
	provideUserCapabilities,
	provideUserInfo,
} from '@tests/js/utils';
import TrafficOverviewFooter from './TrafficOverviewFooter';

const DISCLOSURE =
	'Some insights on this page are created using AI and may contain mistakes. Learn more';

describe( 'TrafficOverviewFooter', () => {
	let registry: WPDataRegistry;

	beforeEach( () => {
		registry = createTestRegistry();
		registry.dispatch( CORE_USER ).setReferenceDate( '2025-02-05' );
		registry.dispatch( CORE_USER ).setDateRange( 'last-28-days' );
		provideUserInfo( registry );
		provideSiteInfo( registry );
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
				shareable: true,
			},
		] );
		provideModuleRegistrations( registry );
		registry.dispatch( MODULES_ANALYTICS_4 ).setPropertyID( '1234567890' );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveIsGatheringData( false );
		registry
			.dispatch( MODULES_SEARCH_CONSOLE )
			.setPropertyID( 'https://example.com/' );
		// With the `trafficInsights` feature, the footer reads the insight
		// once the benchmarking response it is generated from has arrived.
		provideBenchmarkingData(
			registry,
			registry.select( CORE_USER ).getDateRangeDates()
		);
	} );

	it( 'should render only "Source: Analytics" when the `typicalTraffic` feature flag is off', async () => {
		const { container, waitForRegistry } = render(
			<TrafficOverviewFooter />,
			{
				registry,
				features: [ 'trafficInsights' ],
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		await waitForRegistry();

		expect( container ).toHaveTextContent( /^Source: Analytics$/ );
	} );

	it( 'should render only "Source: Analytics" on the entity dashboard, which shows no key factors', async () => {
		const { container, waitForRegistry } = render(
			<TrafficOverviewFooter />,
			{
				registry,
				features: [ 'typicalTraffic', 'trafficInsights' ],
				viewContext: VIEW_CONTEXT_ENTITY_DASHBOARD,
			}
		);

		await waitForRegistry();

		expect( container ).toHaveTextContent( /^Source: Analytics$/ );
	} );

	it( 'should render "Sources: Analytics Search Console", with each source linking to its report for the selected range, and no AI disclosure, when the `typicalTraffic` feature flag is enabled', async () => {
		const { container, waitForRegistry } = render(
			<TrafficOverviewFooter />,
			{
				registry,
				features: [ 'typicalTraffic' ],
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		await waitForRegistry();

		expect( container ).toHaveTextContent(
			/^Sources: Analytics Search Console$/
		);

		// The Analytics report compares the selected range with the range
		// before it, as the "Source: Analytics" link does.
		const analyticsReportURL = decodeServiceURL(
			screen
				.getByRole( 'link', { name: 'Analytics (opens in a new tab)' } )
				.getAttribute( 'href' ) as string
		);

		expect( analyticsReportURL ).toContain( '_u.date00=20250109' );
		expect( analyticsReportURL ).toContain( '_u.date01=20250205' );
		expect( analyticsReportURL ).toContain( '_u.date10=20241212' );
		expect( analyticsReportURL ).toContain( '_u.date11=20250108' );

		expect(
			screen
				.getByRole( 'link', {
					name: 'Search Console (opens in a new tab)',
				} )
				.getAttribute( 'href' )
		).toBe(
			registry.select( MODULES_SEARCH_CONSOLE ).getServiceReportURL( {
				start_date: '20250109',
				end_date: '20250205',
			} )
		);
	} );

	it( 'should render the AI disclosure, with its link to the AI insights documentation page, before the sources when the `typicalTraffic` and `trafficInsights` feature flags are enabled', async () => {
		provideBenchmarkingInsight(
			registry,
			registry.select( CORE_USER ).getDateRangeDates()
		);

		const { container, waitForRegistry } = render(
			<TrafficOverviewFooter />,
			{
				registry,
				features: [ 'typicalTraffic', 'trafficInsights' ],
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		await waitForRegistry();

		expect( container ).toHaveTextContent( DISCLOSURE );
		expect( container ).toHaveTextContent(
			/Learn more\s*Sources: Analytics Search Console$/
		);
		expect(
			screen.getByRole( 'link', {
				name: 'Learn more (opens in a new tab)',
			} )
		).toHaveAttribute(
			'href',
			'https://sitekit.withgoogle.com/support/?doc=ai-insights'
		);
	} );

	it( 'should render the sources without the AI disclosure when there is no generated insight to show', async () => {
		provideBenchmarkingInsight(
			registry,
			registry.select( CORE_USER ).getDateRangeDates(),
			null
		);

		const { container, waitForRegistry } = render(
			<TrafficOverviewFooter />,
			{
				registry,
				features: [ 'typicalTraffic', 'trafficInsights' ],
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		await waitForRegistry();

		expect( container ).toHaveTextContent(
			/^Sources: Analytics Search Console$/
		);
	} );

	it( 'should render the sources without the AI disclosure for a property that is still gathering data, whose panel shows no key factors', async () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveIsGatheringData( true );

		const { container, waitForRegistry } = render(
			<TrafficOverviewFooter />,
			{
				registry,
				features: [ 'typicalTraffic', 'trafficInsights' ],
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		await waitForRegistry();

		expect( container ).toHaveTextContent(
			/^Sources: Analytics Search Console$/
		);
	} );

	it( 'should render the AI disclosure without the sources for a view-only user', async () => {
		provideUserCapabilities( registry, {
			[ getMetaCapabilityPropertyName(
				PERMISSION_READ_SHARED_MODULE_DATA,
				MODULE_SLUG_ANALYTICS_4
			) ]: true,
		} );
		provideBenchmarkingInsight(
			registry,
			registry.select( CORE_USER ).getDateRangeDates()
		);

		const { container, waitForRegistry } = render(
			<TrafficOverviewFooter />,
			{
				registry,
				features: [ 'typicalTraffic', 'trafficInsights' ],
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
			}
		);

		await waitForRegistry();

		expect( container ).toHaveTextContent( DISCLOSURE );
		expect( container ).not.toHaveTextContent( 'Source' );
	} );
} );
