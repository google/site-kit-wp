/**
 * Site Goals Selection Panel tests.
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
 * Internal dependencies
 */
import { snapshotAllStores } from '@/js/googlesitekit/data/create-snapshot-store';
import { CORE_FORMS } from '@/js/googlesitekit/datastore/forms/constants';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	SITE_GOALS_BREAKDOWN_NOTICE,
	SITE_GOALS_SELECTED_DRIVERS,
	SITE_GOALS_SELECTED_VISITOR_ENGAGEMENT,
	SITE_GOALS_SELECTION_FORM,
	SITE_GOALS_SELECTION_PANEL_OPENED_KEY,
} from '@/js/modules/analytics-4/components/site-goals/constants';
import {
	GOAL_DRIVER_IDS,
	GOAL_TYPES,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers';
import { SITE_GOALS_INTRO_MODAL_BANNER } from '@/js/modules/analytics-4/components/site-goals/notifications/IntroModalBanner';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import {
	EDIT_SCOPE,
	ENUM_CONVERSION_EVENTS,
	FORM_CUSTOM_DIMENSIONS_CREATE,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import { mockBrowserScrolling } from '@tests/js/mock-browser-utils';
import { fireEvent, render, waitFor } from '@tests/js/test-utils';
import {
	createTestRegistry,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	provideUserCapabilities,
	waitForDefaultTimeouts,
} from '@tests/js/utils';
import {
	mockSurveyEndpoints,
	surveyTriggerEndpoint,
} from '../../../../../../../tests/js/mock-survey-endpoints';
import SiteGoalsSelectionPanel from '.';

jest.mock( '@/js/googlesitekit/data/create-snapshot-store', () => ( {
	...jest.requireActual( '@/js/googlesitekit/data/create-snapshot-store' ),
	snapshotAllStores: jest.fn( () => Promise.resolve() ),
} ) );

describe( 'SiteGoalsSelectionPanel', () => {
	let registry: ReturnType< typeof createTestRegistry >;
	const ecommerceGoalDriverCheckboxSelector =
		'input[id^="site-goals-selection-"]:not([id^="site-goals-selection-visitor-engagement-"])[id$="-ecommerce"]';

	mockBrowserScrolling();

	beforeEach( () => {
		registry = createTestRegistry();

		provideSiteInfo( registry );
		provideUserAuthentication( registry );
		provideUserCapabilities( registry );
		provideSiteInfo( registry );
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				connected: true,
			},
		] );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [
				ENUM_CONVERSION_EVENTS.PURCHASE,
				ENUM_CONVERSION_EVENTS.ADD_TO_CART,
				ENUM_CONVERSION_EVENTS.CONTACT,
			] );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetSiteGoalsSettings( {} );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetSettings( { availableCustomDimensions: [] } );
		// Default to the breakdown notice being hidden (intro modal not yet
		// dismissed); individual tests opt in by dismissing the intro modal.
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

		registry
			.dispatch( CORE_UI )
			.setValue( SITE_GOALS_SELECTION_PANEL_OPENED_KEY, true );
	} );

	it( 'renders both goal-type lists', async () => {
		const { getByRole } = render( <SiteGoalsSelectionPanel />, {
			registry,
		} );

		await waitForDefaultTimeouts();

		expect(
			getByRole( 'button', { name: 'Online store performance' } )
		).toBeInTheDocument();
		expect(
			getByRole( 'button', { name: 'Lead generation performance' } )
		).toBeInTheDocument();
	} );

	it( 'collapses and expands a goal-type list', async () => {
		const { getByRole } = render( <SiteGoalsSelectionPanel />, {
			registry,
		} );

		await waitForDefaultTimeouts();

		const ecommerceToggle = getByRole( 'button', {
			name: 'Online store performance',
		} );

		fireEvent.click( ecommerceToggle );

		expect(
			document.querySelector(
				'#site-goals-selection-topTrafficChannels-ecommerce'
			)
		).not.toBeInTheDocument();

		fireEvent.click( ecommerceToggle );

		await waitFor( () => {
			expect(
				document.querySelector(
					'#site-goals-selection-topTrafficChannels-ecommerce'
				)
			).toBeInTheDocument();
		} );
	} );

	it( 'closes the panel when close button is clicked', async () => {
		render( <SiteGoalsSelectionPanel />, {
			registry,
		} );

		await waitForDefaultTimeouts();

		const closeButtonElement = document.querySelector(
			'.googlesitekit-selection-panel-header__close'
		) as Element;
		fireEvent.click( closeButtonElement );

		expect(
			registry
				.select( CORE_UI )
				.getValue( SITE_GOALS_SELECTION_PANEL_OPENED_KEY )
		).toBe( false );
	} );

	it( 'updates staged selection for one goal type only', async () => {
		render( <SiteGoalsSelectionPanel />, {
			registry,
		} );

		await waitForDefaultTimeouts();

		const ecommerceTopTrafficCheckbox = document.querySelector(
			'#site-goals-selection-topTrafficChannels-ecommerce'
		) as Element;

		fireEvent.click( ecommerceTopTrafficCheckbox );

		const selectedDrivers = registry
			.select( CORE_FORMS )
			.getValue( SITE_GOALS_SELECTION_FORM, SITE_GOALS_SELECTED_DRIVERS );

		expect( selectedDrivers[ GOAL_TYPES.ECOMMERCE ] ).not.toContain(
			GOAL_DRIVER_IDS.TOP_TRAFFIC_CHANNELS
		);
		expect( selectedDrivers[ GOAL_TYPES.LEAD ] ).toContain(
			GOAL_DRIVER_IDS.TOP_TRAFFIC_CHANNELS
		);
	} );

	it( 'renders visitor engagement items for ecommerce', async () => {
		const { getByText } = render( <SiteGoalsSelectionPanel />, {
			registry,
		} );

		await waitForDefaultTimeouts();

		expect( getByText( 'Visitor engagement' ) ).toBeInTheDocument();
		expect( getByText( 'Products added to cart' ) ).toBeInTheDocument();
		expect(
			document.querySelector(
				'#site-goals-selection-visitor-engagement-add_to_cart-ecommerce'
			)
		).toBeChecked();
	} );

	it( 'does not render visitor engagement items when ecommerce secondary events are not detected', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [
				ENUM_CONVERSION_EVENTS.PURCHASE,
				ENUM_CONVERSION_EVENTS.CONTACT,
			] );

		const { queryByText } = render( <SiteGoalsSelectionPanel />, {
			registry,
		} );

		await waitForDefaultTimeouts();

		expect( queryByText( 'Visitor engagement' ) ).not.toBeInTheDocument();
		expect(
			queryByText( 'Products added to cart' )
		).not.toBeInTheDocument();
	} );

	it( 'does not render visitor engagement items when add_to_cart is the primary ecommerce event', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [
				ENUM_CONVERSION_EVENTS.ADD_TO_CART,
				ENUM_CONVERSION_EVENTS.CONTACT,
			] );

		const { queryByText } = render( <SiteGoalsSelectionPanel />, {
			registry,
		} );

		await waitForDefaultTimeouts();

		// "Products added to cart" also appears in the Primary Action row when
		// `add_to_cart` is primary. Scope the assertion to the visitor-engagement item.
		expect( queryByText( 'Visitor engagement' ) ).not.toBeInTheDocument();
		expect(
			document.querySelector(
				'#site-goals-selection-visitor-engagement-add_to_cart-ecommerce'
			)
		).not.toBeInTheDocument();
	} );

	it( 'updates staged visitor engagement selection for ecommerce', async () => {
		render( <SiteGoalsSelectionPanel />, {
			registry,
		} );

		await waitForDefaultTimeouts();

		fireEvent.click(
			document.querySelector(
				'#site-goals-selection-visitor-engagement-add_to_cart-ecommerce'
			) as Element
		);

		const selectedVisitorEngagement = registry
			.select( CORE_FORMS )
			.getValue(
				SITE_GOALS_SELECTION_FORM,
				SITE_GOALS_SELECTED_VISITOR_ENGAGEMENT
			);

		expect(
			selectedVisitorEngagement[ GOAL_TYPES.ECOMMERCE ]
		).not.toContain( 'add_to_cart' );
		expect( selectedVisitorEngagement[ GOAL_TYPES.LEAD ] ).toEqual( [] );
	} );

	it( 'persists the saved goal driver selection to the module store on save', async () => {
		fetchMock.postOnce(
			new RegExp(
				'^/google-site-kit/v1/modules/analytics-4/data/save-site-goals-settings'
			),
			( _url, opts ) => ( {
				body: JSON.parse( opts.body as string ).data.settings,
				status: 200,
			} )
		);

		const { getByRole } = render( <SiteGoalsSelectionPanel />, {
			registry,
		} );

		await waitForDefaultTimeouts();

		fireEvent.click(
			document.querySelector(
				'#site-goals-selection-topTrafficChannels-ecommerce'
			) as Element
		);

		fireEvent.click(
			getByRole( 'button', {
				name: /apply changes|save selection/i,
			} )
		);

		await waitFor( () => {
			const goalDrivers = registry
				.select( MODULES_ANALYTICS_4 )
				.getSiteGoalsGoalDrivers();

			expect( goalDrivers[ GOAL_TYPES.ECOMMERCE ] ).not.toContain(
				GOAL_DRIVER_IDS.TOP_TRAFFIC_CHANNELS
			);
		} );
	} );

	it( 'persists the saved visitor engagement selection to the module store on save', async () => {
		fetchMock.postOnce(
			new RegExp(
				'^/google-site-kit/v1/modules/analytics-4/data/save-site-goals-settings'
			),
			( _url, opts ) => ( {
				body: JSON.parse( opts.body as string ).data.settings,
				status: 200,
			} )
		);

		const { getByRole } = render( <SiteGoalsSelectionPanel />, {
			registry,
		} );

		await waitForDefaultTimeouts();

		fireEvent.click(
			document.querySelector(
				'#site-goals-selection-visitor-engagement-add_to_cart-ecommerce'
			) as Element
		);

		fireEvent.click(
			getByRole( 'button', {
				name: /apply changes|save selection/i,
			} )
		);

		await waitFor( () => {
			const visitorEngagement = registry
				.select( MODULES_ANALYTICS_4 )
				.getSiteGoalsVisitorEngagement();

			expect( visitorEngagement[ GOAL_TYPES.ECOMMERCE ] ).not.toContain(
				'add_to_cart'
			);
		} );
	} );

	it( 'does not render ineligible goal-type lists', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.PURCHASE ] );

		const { getByRole, queryByRole } = render(
			<SiteGoalsSelectionPanel />,
			{
				registry,
			}
		);

		await waitForDefaultTimeouts();

		expect(
			getByRole( 'button', { name: 'Online store performance' } )
		).toBeInTheDocument();
		expect(
			queryByRole( 'button', { name: 'Lead generation performance' } )
		).not.toBeInTheDocument();
	} );

	it( 'shows min selection notice and disables save when a goal type has no selected drivers', async () => {
		const { getByRole, getByText } = render( <SiteGoalsSelectionPanel />, {
			registry,
		} );

		await waitForDefaultTimeouts();

		document
			.querySelectorAll( ecommerceGoalDriverCheckboxSelector )
			.forEach( ( checkboxElement ) => {
				const checkbox = checkboxElement as HTMLInputElement;
				if ( checkbox.checked ) {
					fireEvent.click( checkbox );
				}
			} );

		expect( getByText( 'Select at least 1 metric' ) ).toBeInTheDocument();
		expect(
			getByRole( 'button', { name: /apply changes|save selection/i } )
		).toBeDisabled();
	} );

	it( 'shows "Purchase" as the ecommerce key action', async () => {
		const { findByText } = render( <SiteGoalsSelectionPanel />, {
			registry,
		} );

		expect( await findByText( 'Purchase' ) ).toBeInTheDocument();
	} );

	it( 'shows "Form completion" as the lead key action', async () => {
		const { findByText } = render( <SiteGoalsSelectionPanel />, {
			registry,
		} );

		expect( await findByText( 'Form completion' ) ).toBeInTheDocument();
	} );

	it( 'shows "Products added to cart" for ecommerce add_to_cart', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ 'add_to_cart', 'contact' ] );

		const { findByText } = render( <SiteGoalsSelectionPanel />, {
			registry,
		} );

		expect(
			await findByText( 'Products added to cart' )
		).toBeInTheDocument();
	} );

	it( 'dispatches an up vote for the ecommerce key action on thumbs-up click', async () => {
		mockSurveyEndpoints();

		const { findAllByRole } = render( <SiteGoalsSelectionPanel />, {
			registry,
		} );

		const upButtons = await findAllByRole( 'button', {
			name: 'Yes, this was helpful',
		} );

		fireEvent.click( upButtons[ 0 ] );

		await waitFor( () =>
			expect( fetchMock ).toHaveFetched( surveyTriggerEndpoint, {
				body: {
					data: {
						triggerID:
							'vote:site_goals_primary_action_panel_online_store:up',
					},
				},
			} )
		);
	} );

	it( 'dispatches a down vote for the lead key action on thumbs-down click', async () => {
		mockSurveyEndpoints();

		const { findAllByRole } = render( <SiteGoalsSelectionPanel />, {
			registry,
		} );

		const downButtons = await findAllByRole( 'button', {
			name: 'No, this was not helpful',
		} );

		fireEvent.click( downButtons[ 1 ] );

		await waitFor( () =>
			expect( fetchMock ).toHaveFetched( surveyTriggerEndpoint, {
				body: {
					data: {
						triggerID:
							'vote:site_goals_primary_action_panel_lead_generation:down',
					},
				},
			} )
		);
	} );

	it( 'shows max selection notice and disables save while allowing selection over six', async () => {
		const { getByRole, getByText } = render( <SiteGoalsSelectionPanel />, {
			registry,
		} );

		await waitForDefaultTimeouts();

		document
			.querySelectorAll( ecommerceGoalDriverCheckboxSelector )
			.forEach( ( checkboxElement ) => {
				const checkbox = checkboxElement as HTMLInputElement;
				if ( ! checkbox.checked ) {
					fireEvent.click( checkbox );
				}
			} );

		expect( getByText( 'Select up to 6 metrics' ) ).toBeInTheDocument();
		expect(
			getByRole( 'button', { name: /apply changes|save selection/i } )
		).toBeDisabled();
		expect(
			document.querySelectorAll(
				`${ ecommerceGoalDriverCheckboxSelector }:checked`
			).length
		).toBe(
			document.querySelectorAll( ecommerceGoalDriverCheckboxSelector )
				.length
		);
	} );

	it( 'shows a custom dimensions warning when Top Authors is selected and the author dimension is missing', async () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
			availableCustomDimensions: [],
		} );

		const { getByText } = render( <SiteGoalsSelectionPanel />, {
			registry,
		} );

		await waitForDefaultTimeouts();

		fireEvent.click(
			document.querySelector(
				'#site-goals-selection-topAuthors-ecommerce'
			) as Element
		);

		expect(
			getByText(
				'The "Top authors driving sales" metric you\'ve selected requires more data tracking. To enable it, you will be directed to update your Analytics property. Complete the setup and save your selection.'
			)
		).toBeInTheDocument();
		expect( getByText( 'Set up' ) ).toBeInTheDocument();
	} );

	it( 'does not show a custom dimensions warning when the author dimension is available', async () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			availableCustomDimensions: [ 'googlesitekit_post_author' ],
		} );

		const { queryByText } = render( <SiteGoalsSelectionPanel />, {
			registry,
		} );

		await waitForDefaultTimeouts();

		fireEvent.click(
			document.querySelector(
				'#site-goals-selection-topAuthors-ecommerce'
			) as Element
		);

		expect(
			queryByText(
				'The "Top authors driving sales" metric you\'ve selected requires more data tracking. To enable it, you will be directed to update your Analytics property. Complete the setup and save your selection.'
			)
		).not.toBeInTheDocument();
		expect( queryByText( 'Set up' ) ).not.toBeInTheDocument();
	} );

	it( 'starts the custom dimensions setup flow when setup is clicked without edit scope', async () => {
		( snapshotAllStores as jest.Mock ).mockClear();

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
			availableCustomDimensions: [],
		} );

		const { getByRole } = render( <SiteGoalsSelectionPanel />, {
			registry,
		} );

		await waitForDefaultTimeouts();

		fireEvent.click(
			document.querySelector(
				'#site-goals-selection-topAuthors-ecommerce'
			) as Element
		);

		fireEvent.click( getByRole( 'button', { name: 'Set up' } ) );

		expect( snapshotAllStores ).toHaveBeenCalledWith( registry );
		expect(
			registry
				.select( CORE_FORMS )
				.getValue( FORM_CUSTOM_DIMENSIONS_CREATE, 'customDimensions' )
		).toEqual( [ 'googlesitekit_post_author' ] );
		expect(
			registry
				.select( CORE_FORMS )
				.getValue( FORM_CUSTOM_DIMENSIONS_CREATE, 'autoSubmit' )
		).toBe( true );
		await waitFor( () => {
			expect(
				registry.select( CORE_USER ).getPermissionScopeError()
			).toMatchObject( {
				data: {
					scopes: [ EDIT_SCOPE ],
					skipModal: true,
				},
			} );
		} );
	} );

	it( 'preserves staged selection after returning from custom dimensions OAuth', async () => {
		registry.dispatch( CORE_FORMS ).setValues( SITE_GOALS_SELECTION_FORM, {
			[ SITE_GOALS_SELECTED_DRIVERS ]: {
				[ GOAL_TYPES.ECOMMERCE ]: [
					GOAL_DRIVER_IDS.TOP_TRAFFIC_CHANNELS,
					GOAL_DRIVER_IDS.TOP_AUTHORS,
				],
				[ GOAL_TYPES.LEAD ]: [],
			},
		} );
		registry
			.dispatch( CORE_FORMS )
			.setValues( FORM_CUSTOM_DIMENSIONS_CREATE, {
				autoSubmit: true,
				customDimensions: [ 'googlesitekit_post_author' ],
			} );

		render( <SiteGoalsSelectionPanel />, {
			registry,
		} );

		await waitForDefaultTimeouts();

		expect(
			registry
				.select( CORE_FORMS )
				.getValue(
					SITE_GOALS_SELECTION_FORM,
					SITE_GOALS_SELECTED_DRIVERS
				)
		).toEqual( {
			[ GOAL_TYPES.ECOMMERCE ]: [
				GOAL_DRIVER_IDS.TOP_TRAFFIC_CHANNELS,
				GOAL_DRIVER_IDS.TOP_AUTHORS,
			],
			[ GOAL_TYPES.LEAD ]: [],
		} );
	} );

	it( 'shows the custom dimensions warning after syncing stale dimensions with edit scope', async () => {
		provideUserAuthentication( registry, {
			grantedScopes: [ EDIT_SCOPE ],
		} );
		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			propertyID: '12345',
			availableCustomDimensions: [ 'googlesitekit_post_author' ],
		} );
		fetchMock.postOnce(
			new RegExp(
				'^/google-site-kit/v1/modules/analytics-4/data/sync-custom-dimensions'
			),
			{
				body: [],
				status: 200,
			}
		);

		const { getByText } = render( <SiteGoalsSelectionPanel />, {
			registry,
		} );

		await waitForDefaultTimeouts();

		fireEvent.click(
			document.querySelector(
				'#site-goals-selection-topAuthors-ecommerce'
			) as Element
		);

		await waitFor( () => {
			expect(
				getByText(
					'The "Top authors driving sales" metric you\'ve selected requires more data tracking. To enable it, you will be directed to update your Analytics property. Complete the setup and save your selection.'
				)
			).toBeInTheDocument();
		} );
	} );

	it( 'creates the author custom dimension when setup is clicked with edit scope', async () => {
		provideUserAuthentication( registry, {
			grantedScopes: [ EDIT_SCOPE ],
		} );
		registry.dispatch( CORE_USER ).receiveGetKeyMetricsSettings( {
			widgetSlugs: [],
			isWidgetHidden: false,
		} );
		registry.dispatch( CORE_USER ).receiveGetUserInputSettings( {
			purpose: { values: [], scope: 'site' },
			postFrequency: { values: [], scope: 'user' },
			goals: { values: [], scope: 'user' },
		} );
		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			propertyID: '12345',
			availableCustomDimensions: [],
		} );
		fetchMock.postOnce(
			new RegExp(
				'^/google-site-kit/v1/modules/analytics-4/data/create-custom-dimension'
			),
			{
				body: {
					parameterName: 'googlesitekit_post_author',
					displayName: 'WordPress Post Author',
					description:
						'Created by Site Kit: WordPress name of the post author',
					scope: 'EVENT',
				},
				status: 200,
			}
		);
		fetchMock.postOnce(
			new RegExp(
				'^/google-site-kit/v1/modules/analytics-4/data/sync-custom-dimensions'
			),
			{
				body: [ 'googlesitekit_post_author' ],
				status: 200,
			}
		);

		const { getByRole } = render( <SiteGoalsSelectionPanel />, {
			registry,
		} );

		await waitForDefaultTimeouts();

		fireEvent.click(
			document.querySelector(
				'#site-goals-selection-topAuthors-ecommerce'
			) as Element
		);

		fireEvent.click( getByRole( 'button', { name: 'Set up' } ) );

		await waitFor( () => {
			expect( fetchMock ).toHaveFetchedTimes( 2 );
		} );

		expect(
			registry.select( CORE_USER ).getPermissionScopeError()
		).toBeNull();
		expect(
			registry
				.select( MODULES_ANALYTICS_4 )
				.getAvailableCustomDimensions()
		).toEqual( [ 'googlesitekit_post_author' ] );
		expect(
			registry
				.select( CORE_FORMS )
				.getValue(
					SITE_GOALS_SELECTION_FORM,
					SITE_GOALS_SELECTED_DRIVERS
				)
		).toMatchObject( {
			[ GOAL_TYPES.ECOMMERCE ]: expect.arrayContaining( [
				GOAL_DRIVER_IDS.TOP_AUTHORS,
			] ),
		} );
	} );

	it( 'defers the breakdown tooltip until the panel is closed, sharing dismissal with the widgets', async () => {
		// Aggregated state so the breakdown notice is rendered in the panel.
		registry
			.dispatch( CORE_USER )
			.receiveGetDismissedItems( [ SITE_GOALS_INTRO_MODAL_BANNER ] );
		fetchMock.postOnce(
			new RegExp( '^/google-site-kit/v1/core/user/data/dismiss-item' ),
			{ body: [ SITE_GOALS_BREAKDOWN_NOTICE ], status: 200 }
		);

		const { getAllByText } = render( <SiteGoalsSelectionPanel />, {
			registry,
		} );

		await waitForDefaultTimeouts();

		fireEvent.click( getAllByText( 'No thanks' )[ 0 ] );

		// While the panel is open the tooltip must not be shown yet.
		expect(
			registry.select( CORE_UI ).getValue( 'admin-screen-tooltip' )
		).toBeUndefined();

		// Dismissal is shared with the widgets via the single slug.
		await waitFor( () => {
			expect(
				registry
					.select( CORE_USER )
					.isItemDismissed( SITE_GOALS_BREAKDOWN_NOTICE )
			).toBe( true );
		} );

		fireEvent.click(
			document.querySelector(
				'.googlesitekit-selection-panel-header__close'
			) as Element
		);

		// Once the panel closes the deferred tooltip is shown.
		await waitFor( () => {
			expect(
				registry.select( CORE_UI ).getValue( 'admin-screen-tooltip' )
			).toMatchObject( { isTooltipVisible: true } );
		} );
	} );
} );
