/**
 * Traffic Overview panel tests.
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
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { createTestRegistry, render, waitFor } from '@tests/js/test-utils';
import { provideModules, provideSiteInfo } from '@tests/js/utils';
import TrafficOverviewPanel from './TrafficOverviewPanel';

describe( 'TrafficOverviewPanel', () => {
	let registry: WPDataRegistry;

	const reportEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/report'
	);

	/**
	 * Renders the panel with the test registry.
	 *
	 * @since n.e.x.t
	 *
	 * @return {Object} The render result.
	 */
	function renderPanel() {
		return render( <TrafficOverviewPanel />, { registry } );
	}

	beforeEach( () => {
		registry = createTestRegistry();
		registry.dispatch( CORE_USER ).setReferenceDate( '2025-02-05' );
		registry.dispatch( CORE_USER ).setDateRange( 'last-28-days' );
		provideSiteInfo( registry );
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
			},
		] );
		fetchMock.get( reportEndpoint, { body: {}, status: 200 } );
	} );

	it( 'marks the panel as a tab panel and names it after the "Traffic Overview" tab', async () => {
		const { container, waitForRegistry } = renderPanel();

		await waitForRegistry();

		const panel = container.querySelector(
			'.googlesitekit-traffic-overview__panel'
		);

		expect( panel ).toHaveAttribute( 'role', 'tabpanel' );
		expect( panel ).toHaveAttribute(
			'aria-labelledby',
			'googlesitekit-traffic-overview-tab'
		);
	} );

	it( 'renders the visitor total, the traffic chart, and the traffic breakdown in that order, all three empty', async () => {
		const { container, waitForRegistry } = renderPanel();

		await waitForRegistry();

		const sections = Array.from(
			container.querySelectorAll(
				'.googlesitekit-traffic-overview__panel > *'
			)
		);

		expect( sections.map( ( section ) => section.className ) ).toEqual( [
			'googlesitekit-traffic-overview__total-visitors',
			'googlesitekit-traffic-overview__chart',
			'googlesitekit-traffic-overview__breakdown',
		] );

		sections.forEach( ( section ) => {
			expect( section ).toBeEmptyDOMElement();
		} );
	} );

	it( 'sends a report request when the panel renders', async () => {
		const { waitForRegistry } = renderPanel();

		await waitForRegistry();

		// This test checks only that one request goes out, because
		// `useTrafficOverviewReports.test.ts` covers all five reports.
		await waitFor( () =>
			expect( fetchMock ).toHaveFetched( reportEndpoint )
		);
	} );
} );
