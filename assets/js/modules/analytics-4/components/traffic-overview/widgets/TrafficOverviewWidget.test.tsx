/**
 * Traffic Overview widget tests.
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
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '@/js/googlesitekit/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { getWidgetComponentProps } from '@/js/googlesitekit/widgets/util';
import { TRAFFIC_OVERVIEW_WIDGET_SLUG } from '@/js/modules/analytics-4/components/traffic-overview/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import {
	act,
	createTestRegistry,
	render,
	screen,
	waitFor,
} from '@tests/js/test-utils';
import {
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
	provideUserInfo,
} from '@tests/js/utils';
import TrafficOverviewWidget from './TrafficOverviewWidget';

describe( 'TrafficOverviewWidget', () => {
	let registry: WPDataRegistry;

	const widgetComponentProps = getWidgetComponentProps(
		TRAFFIC_OVERVIEW_WIDGET_SLUG
	);

	const reportEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/report'
	);

	/**
	 * Renders the widget with the props a registered widget receives.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object}  [options]        Optional. Render options.
	 * @param {boolean} [options.inView] Optional. Whether the widget starts in view.
	 * @return {Object} The render result.
	 */
	function renderWidget( { inView = true } = {} ) {
		return render( <TrafficOverviewWidget { ...widgetComponentProps } />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			inView,
		} );
	}

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
			},
		] );
		provideModuleRegistrations( registry );
		registry.dispatch( MODULES_ANALYTICS_4 ).setPropertyID( '1234567890' );
		fetchMock.get( reportEndpoint, { body: {}, status: 200 } );
	} );

	it( 'renders the widget with no header', async () => {
		const { container, waitForRegistry } = renderWidget();

		await waitForRegistry();

		expect(
			container.querySelector(
				'.googlesitekit-widget--analyticsTrafficOverview'
			)
		).toBeInTheDocument();
		expect(
			container.querySelector( '.googlesitekit-widget__header' )
		).toBeNull();
	} );

	it( 'renders one tab labeled "Traffic Overview" at the top of the widget body', async () => {
		const { container, waitForRegistry } = renderWidget();

		await waitForRegistry();

		const tabs = screen.getAllByRole( 'tab' );

		expect( tabs ).toHaveLength( 1 );
		expect( tabs[ 0 ] ).toHaveTextContent( 'Traffic Overview' );
		expect(
			container.querySelector( '.googlesitekit-widget__body' )
				?.firstElementChild
		).toHaveClass( 'googlesitekit-scrollable-tabs' );
	} );

	it( 'names the tab panel after the "Traffic Overview" tab', async () => {
		const { waitForRegistry } = renderWidget();

		await waitForRegistry();

		expect(
			screen.getByRole( 'tabpanel', { name: 'Traffic Overview' } )
		).toBeInTheDocument();
	} );

	it( 'renders a widget footer with the text "Source: Analytics" and a link to Analytics', async () => {
		const { container, waitForRegistry } = renderWidget();

		await waitForRegistry();

		const footer = container.querySelector(
			'.googlesitekit-widget__footer'
		);

		expect( footer ).toHaveTextContent( 'Source: Analytics' );
		expect( footer ).toContainElement(
			screen.getByRole( 'link', {
				name: 'Analytics (opens in a new tab)',
			} )
		);
	} );

	it( 'renders nothing when Analytics is not connected', async () => {
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: false,
			},
		] );

		const { container, waitForRegistry } = renderWidget();

		await waitForRegistry();

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'does not sends a report request when the widget is out of view', async () => {
		const { setInView, waitForRegistry } = renderWidget( {
			inView: false,
		} );

		await waitForRegistry();

		expect( fetchMock ).not.toHaveFetched( reportEndpoint );

		act( () => setInView!( true ) );

		// The five requests do not all start on the render that brings the
		// widget into view, so this check waits for the count to reach five.
		await waitFor( () =>
			expect( fetchMock ).toHaveFetchedTimes( 5, reportEndpoint )
		);
	} );
} );
