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
import { GoalType } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/types';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import * as tracking from '@/js/util/tracking';
import {
	act,
	fireEvent,
	freezeFetch,
	render,
	waitFor,
} from '@tests/js/test-utils';
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
			<SiteGoalsRemovalNotice goalType="ecommerce" />,
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
			<SiteGoalsRemovalNotice goalType="lead" />,
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
			<SiteGoalsRemovalNotice goalType="ecommerce" />,
			{ registry }
		);

		expect(
			container.querySelector( '.googlesitekit-notice--warning' )
		).toBeInTheDocument();
		expect( getAllByRole( 'button' ) ).toHaveLength( 1 );
		expect( getAllByRole( 'button' )[ 0 ] ).toHaveTextContent( 'Got it' );
	} );

	it( 'renders a loading block in place of the notice when `loading` is `true`', () => {
		const { container, queryByRole, queryByText } = render(
			<SiteGoalsRemovalNotice goalType="ecommerce" loading />,
			{ registry }
		);

		expect(
			container.querySelector( '.googlesitekit-preview-block' )
		).toBeInTheDocument();
		expect(
			queryByText( /Online store performance was removed/ )
		).not.toBeInTheDocument();
		expect( queryByRole( 'button' ) ).not.toBeInTheDocument();
	} );

	it.each< [ string, GoalType, GoalType[] ] >( [
		[ 'online store', 'ecommerce', [ 'lead' ] ],
		[ 'lead generation', 'lead', [ 'ecommerce' ] ],
	] )(
		'removes the %s widget from the active widgets on a "Got it" click',
		async ( _label, goalType, remainingWidgets ) => {
			fetchMock.postOnce( removeWidgetEndpoint, {
				body: { activeWidgets: remainingWidgets },
				status: 200,
			} );

			const { getByRole, waitForRegistry } = render(
				<SiteGoalsRemovalNotice goalType={ goalType } />,
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
					body: { data: { widget: goalType } },
				} );
			} );

			expect(
				registry.select( MODULES_ANALYTICS_4 ).getSiteGoalsSettings()
					.activeWidgets
			).toEqual( remainingWidgets );
		}
	);

	it( 'tracks a "remove_widget" event on a "Got it" click', async () => {
		fetchMock.postOnce( removeWidgetEndpoint, {
			body: { activeWidgets: [ 'ecommerce' ] },
			status: 200,
		} );

		const { getByRole, waitForRegistry } = render(
			<SiteGoalsRemovalNotice goalType="lead" />,
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
		expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'disables the "Got it" button while the removal request runs', async () => {
		freezeFetch( removeWidgetEndpoint );

		const { getByRole, waitForRegistry } = render(
			<SiteGoalsRemovalNotice goalType="ecommerce" />,
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
			<SiteGoalsRemovalNotice goalType="ecommerce" />,
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

	it( 'shows the request error in an error notice when the removal request fails', async () => {
		fetchMock.postOnce( removeWidgetEndpoint, {
			body: {
				code: 'site_goals_widget_provider_active',
				message:
					'This Site Goals widget can’t be removed while a plugin that tracks its events is active.',
				data: { status: 400 },
			},
			status: 400,
		} );

		const { container, findByText, getByRole, waitForRegistry } = render(
			<SiteGoalsRemovalNotice goalType="ecommerce" />,
			{ registry }
		);
		await waitForRegistry();

		expect(
			container.querySelector( '.googlesitekit-notice--error' )
		).not.toBeInTheDocument();

		fireEvent.click( getByRole( 'button', { name: /Got it/ } ) );

		const errorMessage = await findByText(
			/can’t be removed while a plugin that tracks its events is active/
		);

		expect( errorMessage.closest( '.googlesitekit-notice' ) ).toHaveClass(
			'googlesitekit-notice--error'
		);

		expect( console ).toHaveErrored();
	} );

	it( 'hides the error notice when a second "Got it" click removes the widget', async () => {
		fetchMock.postOnce( removeWidgetEndpoint, {
			body: {
				code: 'site_goals_widget_provider_active',
				message:
					'This Site Goals widget can’t be removed while a plugin that tracks its events is active.',
				data: { status: 400 },
			},
			status: 400,
		} );
		fetchMock.postOnce( removeWidgetEndpoint, {
			body: { activeWidgets: [ 'lead' ] },
			status: 200,
		} );

		const { container, findByText, getByRole, waitForRegistry } = render(
			<SiteGoalsRemovalNotice goalType="ecommerce" />,
			{ registry }
		);
		await waitForRegistry();

		fireEvent.click( getByRole( 'button', { name: /Got it/ } ) );

		await findByText(
			/can’t be removed while a plugin that tracks its events is active/
		);

		fireEvent.click( getByRole( 'button', { name: /Got it/ } ) );

		await waitFor( () => {
			expect(
				registry.select( MODULES_ANALYTICS_4 ).getSiteGoalsSettings()
					.activeWidgets
			).toEqual( [ 'lead' ] );
		} );

		expect(
			container.querySelector( '.googlesitekit-notice--error' )
		).not.toBeInTheDocument();

		expect( console ).toHaveErrored();
	} );

	it( 'shows no error notice for the lead generation widget when the removal request for the online store widget fails', async () => {
		fetchMock.postOnce( removeWidgetEndpoint, {
			body: {
				code: 'site_goals_widget_provider_active',
				message:
					'This Site Goals widget can’t be removed while a plugin that tracks its events is active.',
				data: { status: 400 },
			},
			status: 400,
		} );

		const { container, waitForRegistry } = render(
			<SiteGoalsRemovalNotice goalType="lead" />,
			{ registry }
		);
		await waitForRegistry();

		await act( () =>
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.removeSiteGoalsWidget( 'ecommerce' )
		);

		expect(
			registry
				.select( MODULES_ANALYTICS_4 )
				.getErrorForAction( 'removeSiteGoalsWidget', [ 'ecommerce' ] )
		).toEqual( {
			code: 'site_goals_widget_provider_active',
			message:
				'This Site Goals widget can’t be removed while a plugin that tracks its events is active.',
			data: { status: 400 },
		} );
		expect(
			container.querySelector( '.googlesitekit-notice--error' )
		).not.toBeInTheDocument();

		expect( console ).toHaveErrored();
	} );
} );
