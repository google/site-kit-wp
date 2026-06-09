/**
 * Site Goals BreakdownNoticeArea tests.
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
import { deleteItem, setItem } from '@/js/googlesitekit/api/cache';
import { VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY } from '@/js/googlesitekit/constants';
import { CORE_FORMS } from '@/js/googlesitekit/datastore/forms/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	BREAKDOWN_ORIGIN_FORM_KEY,
	BREAKDOWN_ORIGIN_PANEL,
	BREAKDOWN_ORIGIN_WIDGET,
	BREAKDOWN_SCOPE_BOTH,
	BREAKDOWN_SCOPE_FORM_KEY,
	SITE_GOALS_BREAKDOWN_NOTICE,
} from '@/js/modules/analytics-4/components/site-goals/constants';
import { GOAL_TYPES } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import { SITE_GOALS_INTRO_MODAL_BANNER } from '@/js/modules/analytics-4/components/site-goals/notifications/IntroModalBanner';
import {
	FORM_CUSTOM_DIMENSIONS_CREATE,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import { ALL_CUSTOM_DIMENSIONS } from '@/js/modules/analytics-4/hooks/useBreakdownEnableHandler';
import { provideCustomDimensionError } from '@/js/modules/analytics-4/utils/custom-dimensions';
import { fireEvent, render, waitFor } from '@tests/js/test-utils';
import {
	createTestRegistry,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	provideUserCapabilities,
} from '@tests/js/utils';
import BreakdownNoticeArea, {
	AVAILABILITY_SYNC_CACHE_KEY,
} from './BreakdownNoticeArea';

describe( 'BreakdownNoticeArea', () => {
	let registry: WPDataRegistry;

	function seedAvailableCustomDimensions(
		availableCustomDimensions: string[]
	) {
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
			propertyID: '12345',
			availableCustomDimensions,
		} );
	}

	beforeEach( async () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );
		provideUserAuthentication( registry );
		provideUserCapabilities( registry );
		provideModules( registry, [
			{ slug: 'analytics-4', active: true, connected: true },
		] );
		// The "New" notice gating requires the intro modal to be dismissed.
		registry
			.dispatch( CORE_USER )
			.receiveGetDismissedItems( [ SITE_GOALS_INTRO_MODAL_BANNER ] );
		registry.dispatch( CORE_USER ).receiveGetKeyMetricsSettings( {
			widgetSlugs: [],
			isWidgetHidden: false,
		} );
		registry.dispatch( CORE_USER ).receiveGetUserInputSettings( {} );
		// Mark the throttled availability sync as already done, so the mount
		// effect doesn't schedule one (tests that need it clear this).
		await setItem( AVAILABILITY_SYNC_CACHE_KEY, true );
	} );

	it( 'renders the "New" notice when dimensions are missing and nothing is in progress', () => {
		seedAvailableCustomDimensions( [] );

		const { getByText } = render(
			<BreakdownNoticeArea
				origin={ BREAKDOWN_ORIGIN_WIDGET }
				goalTypes={ [ GOAL_TYPES.LEAD ] }
			/>,
			{ registry }
		);

		expect( getByText( 'Get breakdown' ) ).toBeInTheDocument();
		expect( getByText( 'No thanks' ) ).toBeInTheDocument();
	} );

	it( 'gates each section on its own breakdown dimension', () => {
		// The ecommerce (plugin source) dimension exists; the lead (form)
		// dimension does not.
		seedAvailableCustomDimensions( [ 'googlesitekit_event_provider' ] );

		const lead = render(
			<BreakdownNoticeArea
				origin={ BREAKDOWN_ORIGIN_WIDGET }
				goalTypes={ [ GOAL_TYPES.LEAD ] }
			/>,
			{ registry }
		);
		// The lead section's dimension is missing, so it shows the notice.
		expect( lead.getByText( 'Get breakdown' ) ).toBeInTheDocument();
		lead.unmount();

		const ecommerce = render(
			<BreakdownNoticeArea
				origin={ BREAKDOWN_ORIGIN_WIDGET }
				goalTypes={ [ GOAL_TYPES.ECOMMERCE ] }
			/>,
			{ registry }
		);
		// The ecommerce section's dimension exists, so it shows nothing.
		expect( ecommerce.queryByText( 'Get breakdown' ) ).toBeNull();
	} );

	it( 'does not fall back to the "New" notice for a goal type enabled this session', () => {
		// The dimension is missing, but this goal type was triggered this session
		// (e.g. creation just finished and availability has not settled yet), so
		// the notice must not flash back to "New".
		seedAvailableCustomDimensions( [] );
		registry
			.dispatch( CORE_FORMS )
			.setValues( FORM_CUSTOM_DIMENSIONS_CREATE, {
				[ BREAKDOWN_SCOPE_FORM_KEY ]: GOAL_TYPES.LEAD,
			} );

		const { queryByText } = render(
			<BreakdownNoticeArea
				origin={ BREAKDOWN_ORIGIN_WIDGET }
				goalTypes={ [ GOAL_TYPES.LEAD ] }
			/>,
			{ registry }
		);

		expect( queryByText( 'Get breakdown' ) ).toBeNull();
	} );

	it( 'keeps the notice visible in a loading state once the CTA starts the OAuth flow', async () => {
		// No edit scope, so the CTA starts the OAuth redirect instead of creating
		// dimensions directly.
		provideUserAuthentication( registry, { grantedScopes: [] } );
		seedAvailableCustomDimensions( [] );

		const { getByRole, getByText } = render(
			<BreakdownNoticeArea
				origin={ BREAKDOWN_ORIGIN_WIDGET }
				goalTypes={ [ GOAL_TYPES.LEAD ] }
			/>,
			{ registry }
		);

		fireEvent.click( getByRole( 'button', { name: 'Get breakdown' } ) );

		// The notice persists (loading) rather than disappearing while the
		// redirect is pending, and the CTA is busy/disabled.
		await waitFor( () => {
			expect(
				getByRole( 'button', { name: 'Get breakdown' } )
			).toBeDisabled();
		} );
		expect(
			getByText( 'Want to see results for each form?' )
		).toBeInTheDocument();
	} );

	it( 'syncs available custom dimensions on mount (throttled) so a deleted dimension is detected', async () => {
		seedAvailableCustomDimensions( ALL_CUSTOM_DIMENSIONS );
		// Not synced within the throttle window yet.
		await deleteItem( AVAILABILITY_SYNC_CACHE_KEY );

		render(
			<BreakdownNoticeArea
				origin={ BREAKDOWN_ORIGIN_WIDGET }
				goalTypes={ [ GOAL_TYPES.LEAD ] }
			/>,
			{ registry }
		);

		// A refresh is scheduled (the cached list is otherwise never re-synced).
		await waitFor( () => {
			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.isSyncingAvailableCustomDimensions()
			).toBe( true );
		} );
	} );

	it( 'does not sync again on mount while within the throttle window', async () => {
		seedAvailableCustomDimensions( ALL_CUSTOM_DIMENSIONS );
		// The throttle cache is set in beforeEach, so no sync should be scheduled.

		render(
			<BreakdownNoticeArea
				origin={ BREAKDOWN_ORIGIN_WIDGET }
				goalTypes={ [ GOAL_TYPES.LEAD ] }
			/>,
			{ registry }
		);

		// Allow the (cache-gated) effect to run; it should bail without syncing.
		await waitFor( () => {
			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.isSyncingAvailableCustomDimensions()
			).toBe( false );
		} );
	} );

	it( 'renders the success notice at the triggering instance once the breakdown dimensions exist', () => {
		seedAvailableCustomDimensions( ALL_CUSTOM_DIMENSIONS );
		registry
			.dispatch( CORE_FORMS )
			.setValues( FORM_CUSTOM_DIMENSIONS_CREATE, {
				[ BREAKDOWN_ORIGIN_FORM_KEY ]: BREAKDOWN_ORIGIN_WIDGET,
				[ BREAKDOWN_SCOPE_FORM_KEY ]: GOAL_TYPES.LEAD,
			} );

		const { getByText } = render(
			<BreakdownNoticeArea
				origin={ BREAKDOWN_ORIGIN_WIDGET }
				goalTypes={ [ GOAL_TYPES.LEAD ] }
			/>,
			{ registry }
		);

		expect(
			getByText( /Individual form tracking is now active/ )
		).toBeInTheDocument();
	} );

	it( 'renders a single success notice only at the clicked instance', () => {
		seedAvailableCustomDimensions( ALL_CUSTOM_DIMENSIONS );
		// The ecommerce widget notice was clicked.
		registry
			.dispatch( CORE_FORMS )
			.setValues( FORM_CUSTOM_DIMENSIONS_CREATE, {
				[ BREAKDOWN_ORIGIN_FORM_KEY ]: BREAKDOWN_ORIGIN_WIDGET,
				[ BREAKDOWN_SCOPE_FORM_KEY ]: GOAL_TYPES.ECOMMERCE,
			} );

		// Success at the clicked instance (ecommerce widget).
		const ecommerce = render(
			<BreakdownNoticeArea
				origin={ BREAKDOWN_ORIGIN_WIDGET }
				goalTypes={ [ GOAL_TYPES.ECOMMERCE ] }
			/>,
			{ registry }
		);
		expect(
			ecommerce.getByText( /Event breakdown is now active/ )
		).toBeInTheDocument();
		ecommerce.unmount();

		// The other widget section (not clicked) shows nothing.
		const lead = render(
			<BreakdownNoticeArea
				origin={ BREAKDOWN_ORIGIN_WIDGET }
				goalTypes={ [ GOAL_TYPES.LEAD ] }
			/>,
			{ registry }
		);
		expect( lead.container ).toBeEmptyDOMElement();
		lead.unmount();

		// The Side Panel (different origin) shows nothing.
		const panel = render(
			<BreakdownNoticeArea
				origin={ BREAKDOWN_ORIGIN_PANEL }
				goalTypes={ [ GOAL_TYPES.ECOMMERCE ] }
			/>,
			{ registry }
		);
		expect( panel.container ).toBeEmptyDOMElement();
	} );

	it( 'renders nothing at a non-origin location on success', () => {
		seedAvailableCustomDimensions( ALL_CUSTOM_DIMENSIONS );
		registry
			.dispatch( CORE_FORMS )
			.setValues( FORM_CUSTOM_DIMENSIONS_CREATE, {
				[ BREAKDOWN_ORIGIN_FORM_KEY ]: BREAKDOWN_ORIGIN_PANEL,
				[ BREAKDOWN_SCOPE_FORM_KEY ]: GOAL_TYPES.LEAD,
			} );

		const { container } = render(
			<BreakdownNoticeArea
				origin={ BREAKDOWN_ORIGIN_WIDGET }
				goalTypes={ [ GOAL_TYPES.LEAD ] }
			/>,
			{ registry }
		);

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'renders nothing at a same-origin instance with a different goal type on success', () => {
		seedAvailableCustomDimensions( ALL_CUSTOM_DIMENSIONS );
		// Both performance widgets share origin 'widget'; success triggered from
		// the lead widget must not also render in the ecommerce widget.
		registry
			.dispatch( CORE_FORMS )
			.setValues( FORM_CUSTOM_DIMENSIONS_CREATE, {
				[ BREAKDOWN_ORIGIN_FORM_KEY ]: BREAKDOWN_ORIGIN_WIDGET,
				[ BREAKDOWN_SCOPE_FORM_KEY ]: GOAL_TYPES.LEAD,
			} );

		const { container } = render(
			<BreakdownNoticeArea
				origin={ BREAKDOWN_ORIGIN_WIDGET }
				goalTypes={ [ GOAL_TYPES.ECOMMERCE ] }
			/>,
			{ registry }
		);

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'renders the generic error notice in both locations on creation failure', () => {
		seedAvailableCustomDimensions( [] );
		provideCustomDimensionError( registry, {
			customDimension: ALL_CUSTOM_DIMENSIONS[ 0 ],
			error: {
				code: 'internal_server_error',
				message: 'Internal server error',
				data: { status: 500 },
			},
		} );
		registry
			.dispatch( CORE_FORMS )
			.setValues( FORM_CUSTOM_DIMENSIONS_CREATE, {
				[ BREAKDOWN_SCOPE_FORM_KEY ]: GOAL_TYPES.LEAD,
			} );

		[ BREAKDOWN_ORIGIN_WIDGET, BREAKDOWN_ORIGIN_PANEL ].forEach(
			( origin ) => {
				const { getByText, getByRole, unmount } = render(
					<BreakdownNoticeArea
						origin={ origin }
						goalTypes={ [ GOAL_TYPES.LEAD ] }
					/>,
					{ registry }
				);

				expect(
					getByText( /Analytics update failed/ )
				).toBeInTheDocument();
				expect(
					getByRole( 'button', { name: 'Retry' } )
				).toBeInTheDocument();

				unmount();
			}
		);
	} );

	it( 'renders the permissions error notice in both locations', () => {
		seedAvailableCustomDimensions( [] );
		provideCustomDimensionError( registry, {
			customDimension: ALL_CUSTOM_DIMENSIONS[ 0 ],
			error: {
				code: 'insufficient_permissions',
				message: 'Insufficient permissions',
				data: { status: 403, reason: 'insufficientPermissions' },
			},
		} );
		registry
			.dispatch( CORE_FORMS )
			.setValues( FORM_CUSTOM_DIMENSIONS_CREATE, {
				[ BREAKDOWN_SCOPE_FORM_KEY ]: GOAL_TYPES.LEAD,
			} );

		[ BREAKDOWN_ORIGIN_WIDGET, BREAKDOWN_ORIGIN_PANEL ].forEach(
			( origin ) => {
				const { getByText, unmount } = render(
					<BreakdownNoticeArea
						origin={ origin }
						goalTypes={ [ GOAL_TYPES.LEAD ] }
					/>,
					{ registry }
				);

				expect(
					getByText( /insufficient permissions/ )
				).toBeInTheDocument();

				unmount();
			}
		);
	} );

	it( 'does not render the error notice for a section whose dimension already exists', () => {
		// The lead (form) dimension already exists; only the ecommerce one is
		// missing.
		seedAvailableCustomDimensions( [ 'googlesitekit_form_id' ] );
		provideCustomDimensionError( registry, {
			customDimension: ALL_CUSTOM_DIMENSIONS[ 0 ],
			error: {
				code: 'internal_server_error',
				message: 'Internal server error',
				data: { status: 500 },
			},
		} );
		registry
			.dispatch( CORE_FORMS )
			.setValues( FORM_CUSTOM_DIMENSIONS_CREATE, {
				[ BREAKDOWN_SCOPE_FORM_KEY ]: GOAL_TYPES.ECOMMERCE,
			} );

		// The lead section's dimension exists, so it is not eligible for the
		// error even though creation failed overall.
		const { queryByText } = render(
			<BreakdownNoticeArea
				origin={ BREAKDOWN_ORIGIN_WIDGET }
				goalTypes={ [ GOAL_TYPES.LEAD ] }
			/>,
			{ registry }
		);

		expect( queryByText( /Analytics update failed/ ) ).toBeNull();
	} );

	describe( 'combined Side Panel notice', () => {
		it( 'renders the "both" New copy when both breakdown dimensions are missing', () => {
			seedAvailableCustomDimensions( [] );
			provideSiteInfo( registry, {
				hasMultipleActiveEcommerceEventProviders: true,
			} );

			const { getByText } = render(
				<BreakdownNoticeArea
					origin={ BREAKDOWN_ORIGIN_PANEL }
					goalTypes={ [ GOAL_TYPES.ECOMMERCE, GOAL_TYPES.LEAD ] }
				/>,
				{ registry }
			);

			expect(
				getByText(
					/Have multiple forms, or Using both WooCommerce and Easy Digital Downloads/
				)
			).toBeInTheDocument();
		} );

		it( 'scopes the combined notice to the goal type still missing its dimension', () => {
			// The lead (form) dimension exists; only the ecommerce one is missing.
			seedAvailableCustomDimensions( [ 'googlesitekit_form_id' ] );
			provideSiteInfo( registry, {
				hasMultipleActiveEcommerceEventProviders: true,
			} );

			const { getByText } = render(
				<BreakdownNoticeArea
					origin={ BREAKDOWN_ORIGIN_PANEL }
					goalTypes={ [ GOAL_TYPES.ECOMMERCE, GOAL_TYPES.LEAD ] }
				/>,
				{ registry }
			);

			expect(
				getByText(
					'Using both WooCommerce and Easy Digital Downloads to sell products or services?'
				)
			).toBeInTheDocument();
		} );

		it( 'renders the combined success notice once both dimensions exist', () => {
			seedAvailableCustomDimensions( ALL_CUSTOM_DIMENSIONS );
			registry
				.dispatch( CORE_FORMS )
				.setValues( FORM_CUSTOM_DIMENSIONS_CREATE, {
					[ BREAKDOWN_ORIGIN_FORM_KEY ]: BREAKDOWN_ORIGIN_PANEL,
					[ BREAKDOWN_SCOPE_FORM_KEY ]: BREAKDOWN_SCOPE_BOTH,
				} );

			const { getByText } = render(
				<BreakdownNoticeArea
					origin={ BREAKDOWN_ORIGIN_PANEL }
					goalTypes={ [ GOAL_TYPES.ECOMMERCE, GOAL_TYPES.LEAD ] }
				/>,
				{ registry }
			);

			expect(
				getByText( /Breakdown is now active/ )
			).toBeInTheDocument();
		} );
	} );

	describe( 'gating', () => {
		it( 'renders nothing for view-only dashboard users', () => {
			seedAvailableCustomDimensions( [] );

			const { container } = render(
				<BreakdownNoticeArea
					origin={ BREAKDOWN_ORIGIN_WIDGET }
					goalTypes={ [ GOAL_TYPES.LEAD ] }
				/>,
				{
					registry,
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
				}
			);

			expect( container ).toBeEmptyDOMElement();
		} );

		it( 'renders nothing before the intro modal has been dismissed', () => {
			seedAvailableCustomDimensions( [] );
			registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

			const { container } = render(
				<BreakdownNoticeArea
					origin={ BREAKDOWN_ORIGIN_WIDGET }
					goalTypes={ [ GOAL_TYPES.LEAD ] }
				/>,
				{ registry }
			);

			expect( container ).toBeEmptyDOMElement();
		} );

		it( 'renders nothing once the "New" notice has been dismissed', () => {
			seedAvailableCustomDimensions( [] );
			registry
				.dispatch( CORE_USER )
				.receiveGetDismissedItems( [
					SITE_GOALS_INTRO_MODAL_BANNER,
					SITE_GOALS_BREAKDOWN_NOTICE,
				] );

			const { container } = render(
				<BreakdownNoticeArea
					origin={ BREAKDOWN_ORIGIN_WIDGET }
					goalTypes={ [ GOAL_TYPES.LEAD ] }
				/>,
				{ registry }
			);

			expect( container ).toBeEmptyDOMElement();
		} );
	} );

	describe( 'on page reload (form state cleared)', () => {
		it( 'renders the "New" notice when dimensions are still missing', () => {
			seedAvailableCustomDimensions( [] );

			const { getByText } = render(
				<BreakdownNoticeArea
					origin={ BREAKDOWN_ORIGIN_WIDGET }
					goalTypes={ [ GOAL_TYPES.LEAD ] }
				/>,
				{ registry }
			);

			expect( getByText( 'Get breakdown' ) ).toBeInTheDocument();
		} );

		it( 'renders nothing when all dimensions already exist', () => {
			seedAvailableCustomDimensions( ALL_CUSTOM_DIMENSIONS );

			const { container } = render(
				<BreakdownNoticeArea
					origin={ BREAKDOWN_ORIGIN_WIDGET }
					goalTypes={ [ GOAL_TYPES.LEAD ] }
				/>,
				{ registry }
			);

			expect( container ).toBeEmptyDOMElement();
		} );
	} );
} );
