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
 * Internal dependencies
 */
import { CORE_FORMS } from '@/js/googlesitekit/datastore/forms/constants';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import {
	SITE_GOALS_EFFECTIVE_DRIVERS,
	SITE_GOALS_EFFECTIVE_VISITOR_ENGAGEMENT,
	SITE_GOALS_SELECTED_DRIVERS,
	SITE_GOALS_SELECTED_VISITOR_ENGAGEMENT,
	SITE_GOALS_SELECTION_FORM,
	SITE_GOALS_SELECTION_PANEL_OPENED_KEY,
} from '@/js/modules/analytics-4/components/site-goals/constants';
import {
	GOAL_DRIVER_IDS,
	GOAL_TYPES,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers';
import {
	ENUM_CONVERSION_EVENTS,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import { mockBrowserScrolling } from '../../../../../../../tests/js/mock-browser-utils';
import {
	fireEvent,
	render,
	waitFor,
} from '../../../../../../../tests/js/test-utils';
import {
	createTestRegistry,
	provideUserAuthentication,
	waitForDefaultTimeouts,
} from '../../../../../../../tests/js/utils';
import SiteGoalsSelectionPanel from '.';

describe( 'SiteGoalsSelectionPanel', () => {
	let registry: ReturnType< typeof createTestRegistry >;
	const ecommerceGoalDriverCheckboxSelector =
		'input[id^="site-goals-selection-"]:not([id^="site-goals-selection-visitor-engagement-"])[id$="-ecommerce"]';

	mockBrowserScrolling();

	beforeEach( () => {
		registry = createTestRegistry();

		provideUserAuthentication( registry );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [
				ENUM_CONVERSION_EVENTS.PURCHASE,
				ENUM_CONVERSION_EVENTS.ADD_TO_CART,
				ENUM_CONVERSION_EVENTS.CONTACT,
			] );

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

		expect( queryByText( 'Visitor engagement' ) ).not.toBeInTheDocument();
		expect(
			queryByText( 'Products added to cart' )
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

	it( 'applies staged selection to effective selection on save', async () => {
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
			const effectiveDrivers = registry
				.select( CORE_FORMS )
				.getValue(
					SITE_GOALS_SELECTION_FORM,
					SITE_GOALS_EFFECTIVE_DRIVERS
				);

			expect( effectiveDrivers[ GOAL_TYPES.ECOMMERCE ] ).not.toContain(
				GOAL_DRIVER_IDS.TOP_TRAFFIC_CHANNELS
			);
		} );
	} );

	it( 'applies staged visitor engagement selection to effective selection on save', async () => {
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
			const effectiveVisitorEngagement = registry
				.select( CORE_FORMS )
				.getValue(
					SITE_GOALS_SELECTION_FORM,
					SITE_GOALS_EFFECTIVE_VISITOR_ENGAGEMENT
				);

			expect(
				effectiveVisitorEngagement[ GOAL_TYPES.ECOMMERCE ]
			).not.toContain( 'add_to_cart' );
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
		).toBe( 7 );
	} );
} );
