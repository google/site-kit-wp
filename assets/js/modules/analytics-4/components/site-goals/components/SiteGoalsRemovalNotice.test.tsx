/**
 * Site Goals removal notice tests.
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
 * External dependencies
 */
import fetchMock from 'fetch-mock';

/**
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '@/js/googlesitekit/constants';
import { GOAL_TYPES } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import * as tracking from '@/js/util/tracking';
import { fireEvent, freezeFetch, render, waitFor } from '@tests/js/test-utils';
import {
	createTestRegistry,
	provideModules,
	provideSiteInfo,
} from '@tests/js/utils';
import SiteGoalsRemovalNotice from './SiteGoalsRemovalNotice';

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

describe( 'SiteGoalsRemovalNotice', () => {
	let registry: WPDataRegistry;

	const removeWidgetEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/remove-site-goals-widget'
	);

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
			},
		] );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSiteGoalsSettings( {
			activeWidgets: [ 'ecommerce', 'lead' ],
		} );
	} );

	afterEach( () => {
		mockTrackEvent.mockClear();
	} );

	it( 'renders the online store title, description, and "Learn more" link for the ecommerce goal type', () => {
		const { getByRole, getByText } = render(
			<SiteGoalsRemovalNotice goalType={ GOAL_TYPES.ECOMMERCE } />,
			{ registry }
		);

		expect(
			getByText( /Online store performance was removed/ )
		).toBeInTheDocument();
		expect(
			getByText(
				/If you reinstall the plugin, we’ll resume tracking your online store data/
			)
		).toBeInTheDocument();
		expect(
			getByRole( 'link', { name: /Learn more/ } )
		).toBeInTheDocument();
	} );

	it( 'renders the lead generation title and description for the lead goal type', () => {
		const { getByText } = render(
			<SiteGoalsRemovalNotice goalType={ GOAL_TYPES.LEAD } />,
			{ registry }
		);

		expect(
			getByText( /Lead generation performance was removed/ )
		).toBeInTheDocument();
		expect(
			getByText(
				/If you reinstall the plugin, we’ll resume tracking your forms data/
			)
		).toBeInTheDocument();
	} );

	it( 'renders a warning notice with a single "Got it" button', () => {
		const { container, getAllByRole } = render(
			<SiteGoalsRemovalNotice goalType={ GOAL_TYPES.ECOMMERCE } />,
			{ registry }
		);

		expect(
			container.querySelector( '.googlesitekit-notice--warning' )
		).toBeInTheDocument();
		expect( getAllByRole( 'button' ) ).toHaveLength( 1 );
		expect( getAllByRole( 'button' )[ 0 ] ).toHaveTextContent( 'Got it' );
	} );

	it( 'removes the ecommerce widget from the active widgets on a "Got it" click', async () => {
		fetchMock.postOnce( removeWidgetEndpoint, {
			body: { activeWidgets: [ 'lead' ] },
			status: 200,
		} );

		const { getByRole, waitForRegistry } = render(
			<SiteGoalsRemovalNotice goalType={ GOAL_TYPES.ECOMMERCE } />,
			{ registry }
		);
		await waitForRegistry();

		expect( fetchMock ).not.toHaveFetched( removeWidgetEndpoint );
		expect(
			registry.select( MODULES_ANALYTICS_4 ).getSiteGoalsSettings()
				.activeWidgets
		).toEqual( [ 'ecommerce', 'lead' ] );

		fireEvent.click( getByRole( 'button', { name: /Got it/ } ) );

		await waitFor( () => {
			expect( fetchMock ).toHaveFetched( removeWidgetEndpoint, {
				body: { data: { widget: 'ecommerce' } },
			} );
		} );

		expect(
			registry.select( MODULES_ANALYTICS_4 ).getSiteGoalsSettings()
				.activeWidgets
		).toEqual( [ 'lead' ] );
	} );

	it( 'tracks a "remove_widget" event on a "Got it" click', async () => {
		fetchMock.postOnce( removeWidgetEndpoint, {
			body: { activeWidgets: [ 'ecommerce' ] },
			status: 200,
		} );

		const { getByRole, waitForRegistry } = render(
			<SiteGoalsRemovalNotice goalType={ GOAL_TYPES.LEAD } />,
			{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD }
		);
		await waitForRegistry();

		fireEvent.click( getByRole( 'button', { name: /Got it/ } ) );

		await waitFor( () => {
			expect( mockTrackEvent ).toHaveBeenCalledWith(
				'mainDashboard_site-goals-widget',
				'remove_widget',
				'lead'
			);
		} );
	} );

	it( 'disables the "Got it" button while the removal request runs', async () => {
		freezeFetch( removeWidgetEndpoint );

		const { getByRole, waitForRegistry } = render(
			<SiteGoalsRemovalNotice goalType={ GOAL_TYPES.ECOMMERCE } />,
			{ registry }
		);
		await waitForRegistry();

		fireEvent.click( getByRole( 'button', { name: /Got it/ } ) );

		await waitFor( () => {
			expect( getByRole( 'button', { name: /Got it/ } ) ).toBeDisabled();
		} );
	} );

	it( 'keeps the ecommerce widget in the active widgets when the removal request fails', async () => {
		fetchMock.postOnce( removeWidgetEndpoint, {
			body: {
				code: 'site_goals_widget_provider_active',
				message: 'The plugin is still active.',
				data: { status: 400 },
			},
			status: 400,
		} );

		const { getByRole, waitForRegistry } = render(
			<SiteGoalsRemovalNotice goalType={ GOAL_TYPES.ECOMMERCE } />,
			{ registry }
		);
		await waitForRegistry();

		fireEvent.click( getByRole( 'button', { name: /Got it/ } ) );

		await waitFor( () => {
			expect( fetchMock ).toHaveFetched( removeWidgetEndpoint );
		} );

		expect(
			registry.select( MODULES_ANALYTICS_4 ).getSiteGoalsSettings()
				.activeWidgets
		).toEqual( [ 'ecommerce', 'lead' ] );
		expect( getByRole( 'button', { name: /Got it/ } ) ).toBeEnabled();

		expect( console ).toHaveErrored();
	} );
} );
