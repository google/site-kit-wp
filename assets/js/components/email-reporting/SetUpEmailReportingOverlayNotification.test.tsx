/**
 * SetUpEmailReportingOverlayNotification component tests.
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
 * External dependencies
 */
import { waitFor } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { FEATURES_MENU_BUTTON_CLASS } from '@/js/components/FeaturesMenu/constants';
import Notifications from '@/js/components/notifications/Notifications';
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '@/js/googlesitekit/constants';
import type { Registry } from '@/js/googlesitekit/data/types';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import {
	NOTIFICATION_AREAS,
	NOTIFICATION_GROUPS,
} from '@/js/googlesitekit/notifications/constants';
import { CORE_NOTIFICATIONS } from '@/js/googlesitekit/notifications/datastore/constants';
import { DEFAULT_NOTIFICATIONS } from '@/js/googlesitekit/notifications/register-defaults';
import { mockSurveyEndpoints } from '@tests/js/mock-survey-endpoints';
import {
	act,
	createTestRegistry,
	fireEvent,
	provideSiteInfo,
	provideUserAuthentication,
	render,
} from '@tests/js/test-utils';
import {
	MANAGE_EMAIL_REPORTS_BUTTON_CLASS,
	USER_SETTINGS_SELECTION_PANEL_OPENED_KEY,
} from './constants';
import {
	SET_UP_EMAIL_REPORTING_OVERLAY_NOTIFICATION,
	SET_UP_EMAIL_REPORTING_OVERLAY_NOTIFICATION_SETUP_CTA,
} from './SetUpEmailReportingOverlayNotification';

const fetchDismissItem = new RegExp(
	'^/google-site-kit/v1/core/user/data/dismiss-item'
);
const fetchGetDismissedItems = new RegExp(
	'^/google-site-kit/v1/core/user/data/dismissed-items'
);

jest.mock( '@/js/hooks/useActivateModuleCallback', () =>
	jest.fn( () => jest.fn() )
);

describe( 'SetUpEmailReportingOverlayNotification', () => {
	const notification =
		DEFAULT_NOTIFICATIONS[ SET_UP_EMAIL_REPORTING_OVERLAY_NOTIFICATION ];

	afterEach( () => {
		fetchMock.reset();
	} );

	describe( 'checkRequirements', () => {
		/**
		 * Creates a registry whose dismissal state has already arrived, which
		 * the setup CTA requirement waits on before it reads the header queue.
		 *
		 * @since 1.187.0
		 *
		 * @return {Object} Test registry.
		 */
		function createRegistry(): Registry {
			const registry = createTestRegistry() as Registry;

			registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
			registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {} );

			return registry;
		}

		it( 'returns false when user is already subscribed', async () => {
			const registry = createRegistry();
			registry.dispatch( CORE_SITE ).receiveGetEmailReportingSettings( {
				enabled: true,
			} );
			registry.dispatch( CORE_USER ).receiveGetEmailReportingSettings( {
				subscribed: true,
			} );

			const result = await notification.checkRequirements(
				{
					select: registry.select,
					resolveSelect: registry.resolveSelect,
				},
				VIEW_CONTEXT_MAIN_DASHBOARD
			);

			expect( result ).toBe( false );
		} );

		it( 'returns true when user is not subscribed (authenticated users always have access)', async () => {
			const registry = createRegistry();
			registry.dispatch( CORE_SITE ).receiveGetEmailReportingSettings( {
				enabled: true,
			} );
			registry.dispatch( CORE_USER ).receiveGetEmailReportingSettings( {
				subscribed: false,
			} );

			const result = await notification.checkRequirements(
				{
					select: registry.select,
					resolveSelect: registry.resolveSelect,
				},
				VIEW_CONTEXT_MAIN_DASHBOARD
			);

			expect( result ).toBe( true );
		} );

		it( 'returns false when email reporting is disabled at site level', async () => {
			const registry = createRegistry();
			registry.dispatch( CORE_SITE ).receiveGetEmailReportingSettings( {
				enabled: false,
			} );
			registry.dispatch( CORE_USER ).receiveGetEmailReportingSettings( {
				subscribed: false,
			} );

			const result = await notification.checkRequirements(
				{
					select: registry.select,
					resolveSelect: registry.resolveSelect,
				},
				VIEW_CONTEXT_MAIN_DASHBOARD
			);

			expect( result ).toBe( false );
		} );

		describe( 'view-only users', () => {
			const shareableModules = [
				{
					slug: 'analytics-4',
					name: 'Analytics',
					shareable: true,
				},
				{
					slug: 'search-console',
					name: 'Search Console',
					shareable: true,
				},
			];

			function setupViewableModules(
				registry: Registry,
				viewableModuleSlugs: string[] = []
			) {
				registry
					.dispatch( CORE_MODULES )
					.receiveGetModules( shareableModules );

				const capabilities = {
					googlesitekit_view_dashboard: true,
					'googlesitekit_read_shared_module_data::["analytics-4"]':
						viewableModuleSlugs.includes( 'analytics-4' ),
					'googlesitekit_read_shared_module_data::["search-console"]':
						viewableModuleSlugs.includes( 'search-console' ),
				};
				registry
					.dispatch( CORE_USER )
					.receiveGetCapabilities( capabilities );
			}

			it( 'returns true when view-only user can view Analytics', async () => {
				const registry = createRegistry();
				registry
					.dispatch( CORE_SITE )
					.receiveGetEmailReportingSettings( {
						enabled: true,
					} );
				registry
					.dispatch( CORE_USER )
					.receiveGetEmailReportingSettings( {
						subscribed: false,
					} );
				setupViewableModules( registry, [ 'analytics-4' ] );

				const result = await notification.checkRequirements(
					{
						select: registry.select,
						resolveSelect: registry.resolveSelect,
					},
					VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY
				);

				expect( result ).toBe( true );
			} );

			it( 'returns true when view-only user can view Search Console', async () => {
				const registry = createRegistry();
				registry
					.dispatch( CORE_SITE )
					.receiveGetEmailReportingSettings( {
						enabled: true,
					} );
				registry
					.dispatch( CORE_USER )
					.receiveGetEmailReportingSettings( {
						subscribed: false,
					} );
				setupViewableModules( registry, [ 'search-console' ] );

				const result = await notification.checkRequirements(
					{
						select: registry.select,
						resolveSelect: registry.resolveSelect,
					},
					VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY
				);

				expect( result ).toBe( true );
			} );

			it( 'returns false when view-only user cannot view Analytics or Search Console', async () => {
				const registry = createRegistry();
				registry
					.dispatch( CORE_SITE )
					.receiveGetEmailReportingSettings( {
						enabled: true,
					} );
				registry
					.dispatch( CORE_USER )
					.receiveGetEmailReportingSettings( {
						subscribed: false,
					} );
				setupViewableModules( registry, [] );

				const result = await notification.checkRequirements(
					{
						select: registry.select,
						resolveSelect: registry.resolveSelect,
					},
					VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY
				);

				expect( result ).toBe( false );
			} );
		} );
	} );

	describe( 'rendering', () => {
		let registry: ReturnType< typeof createTestRegistry >;
		let anchor: HTMLButtonElement | null = null;
		let featuresMenuButton: HTMLButtonElement | null = null;

		function addHeaderIcon() {
			anchor = document.createElement( 'button' );
			anchor.className = MANAGE_EMAIL_REPORTS_BUTTON_CLASS;
			document.body.appendChild( anchor );
		}

		function addFeaturesMenuButton() {
			featuresMenuButton = document.createElement( 'button' );
			featuresMenuButton.className = FEATURES_MENU_BUTTON_CLASS;
			document.body.appendChild( featuresMenuButton );
		}

		function renderNotifications() {
			return render(
				<Notifications
					areaSlug={ NOTIFICATION_AREAS.OVERLAYS }
					groupID={ NOTIFICATION_GROUPS.SETUP_CTAS }
				/>,
				{
					registry,
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			);
		}

		beforeEach( () => {
			registry = createTestRegistry();
			provideSiteInfo( registry );
			provideUserAuthentication( registry );
			registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
			registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {} );
			registry.dispatch( CORE_SITE ).receiveGetEmailReportingSettings( {
				enabled: true,
			} );
			registry.dispatch( CORE_USER ).receiveGetEmailReportingSettings( {
				subscribed: false,
			} );
			registry
				.dispatch( CORE_NOTIFICATIONS )
				.registerNotification(
					SET_UP_EMAIL_REPORTING_OVERLAY_NOTIFICATION,
					notification
				);
		} );

		afterEach( () => {
			anchor?.remove();
			anchor = null;
			featuresMenuButton?.remove();
			featuresMenuButton = null;
		} );

		it( 'anchors the overlay to the header icon when it is present', async () => {
			mockSurveyEndpoints();
			addHeaderIcon();

			const { waitForRegistry } = renderNotifications();

			await waitForRegistry();

			await waitFor( () =>
				expect(
					document.querySelector(
						'.googlesitekit-overlay-card--anchored'
					)
				).toBeInTheDocument()
			);

			expect(
				document.querySelector(
					'.googlesitekit-popper--overlay-notification'
				)
			).toBeInTheDocument();
		} );

		it( 'renders a centered card when the header icon is absent', async () => {
			mockSurveyEndpoints();

			const { getByText, waitForRegistry } = renderNotifications();

			await waitForRegistry();

			expect(
				getByText( 'Get site insights in your inbox' )
			).toBeInTheDocument();
			expect(
				document.querySelector(
					'.googlesitekit-overlay-card--anchored'
				)
			).toBeNull();
		} );

		it( 'anchors the overlay to the features menu button when the header icon is absent', async () => {
			mockSurveyEndpoints();
			addFeaturesMenuButton();

			const { waitForRegistry } = renderNotifications();

			await waitForRegistry();

			await waitFor( () =>
				expect(
					document.querySelector(
						'.googlesitekit-overlay-card--anchored'
					)
				).toBeInTheDocument()
			);

			expect(
				document.querySelector(
					'.googlesitekit-popper--overlay-notification'
				)
			).toBeInTheDocument();
		} );

		it( 'labels the buttons "Try it" and "Got it"', async () => {
			mockSurveyEndpoints();

			const { getByRole, waitForRegistry } = renderNotifications();

			await waitForRegistry();

			expect(
				getByRole( 'button', { name: /try it/i } )
			).toBeInTheDocument();
			expect(
				getByRole( 'button', { name: /got it/i } )
			).toBeInTheDocument();
		} );

		it( 'opens the setup panel and flags the CTA when "Try it" is clicked', async () => {
			fetchMock.getOnce( fetchGetDismissedItems, { body: [] } );
			fetchMock.post( fetchDismissItem, {
				body: [
					SET_UP_EMAIL_REPORTING_OVERLAY_NOTIFICATION,
					SET_UP_EMAIL_REPORTING_OVERLAY_NOTIFICATION_SETUP_CTA,
				],
			} );
			mockSurveyEndpoints();

			const { getByRole, waitForRegistry } = renderNotifications();

			await waitForRegistry();

			act( () => {
				fireEvent.click( getByRole( 'button', { name: /try it/i } ) );
			} );

			expect(
				registry
					.select( CORE_UI )
					.getValue( USER_SETTINGS_SELECTION_PANEL_OPENED_KEY )
			).toBe( true );

			await waitFor( () =>
				expect( fetchMock ).toHaveFetched(
					fetchDismissItem,
					expect.objectContaining( {
						body: {
							data: {
								slug: SET_UP_EMAIL_REPORTING_OVERLAY_NOTIFICATION_SETUP_CTA,
								expiration: 0,
							},
						},
					} )
				)
			);
		} );

		it( 'dismisses the notification without a follow-up tooltip when "Got it" is clicked', async () => {
			fetchMock.getOnce( fetchGetDismissedItems, { body: [] } );
			fetchMock.postOnce( fetchDismissItem, {
				body: [ SET_UP_EMAIL_REPORTING_OVERLAY_NOTIFICATION ],
			} );
			mockSurveyEndpoints();

			const { getByRole, waitForRegistry } = renderNotifications();

			await waitForRegistry();

			act( () => {
				fireEvent.click( getByRole( 'button', { name: /got it/i } ) );
			} );

			await waitFor( () =>
				expect( fetchMock ).toHaveFetched(
					fetchDismissItem,
					expect.objectContaining( {
						body: {
							data: {
								slug: SET_UP_EMAIL_REPORTING_OVERLAY_NOTIFICATION,
								expiration: 0,
							},
						},
					} )
				)
			);

			expect(
				registry.select( CORE_UI ).getValue( 'admin-screen-tooltip' )
			).toBeUndefined();
		} );

		it( 'does not render once dismissed', async () => {
			registry
				.dispatch( CORE_USER )
				.receiveGetDismissedItems( [
					SET_UP_EMAIL_REPORTING_OVERLAY_NOTIFICATION,
				] );

			const { queryByText, waitForRegistry } = renderNotifications();

			await waitForRegistry();

			expect(
				queryByText( 'Get site insights in your inbox' )
			).not.toBeInTheDocument();
		} );
	} );
} );
