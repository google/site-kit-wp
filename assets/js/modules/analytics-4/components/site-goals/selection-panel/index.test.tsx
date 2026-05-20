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
import SiteGoalsSelectionPanel from './index';
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
import { CORE_FORMS } from '@/js/googlesitekit/datastore/forms/constants';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import {
	GOAL_DRIVER_IDS,
	GOAL_TYPES,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers';
import {
	SITE_GOALS_EFFECTIVE_DRIVERS,
	SITE_GOALS_SELECTED_DRIVERS,
	SITE_GOALS_SELECTION_FORM,
	SITE_GOALS_SELECTION_PANEL_OPENED_KEY,
} from '@/js/modules/analytics-4/components/site-goals/constants';

describe( 'SiteGoalsSelectionPanel', () => {
	let registry: ReturnType< typeof createTestRegistry >;

	beforeEach( () => {
		registry = createTestRegistry();

		provideUserAuthentication( registry );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ 'purchase', 'contact' ] );

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

	it( 'does not render ineligible goal-type lists', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ 'purchase' ] );

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
} );
