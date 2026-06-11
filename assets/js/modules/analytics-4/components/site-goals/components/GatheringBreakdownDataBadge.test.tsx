/**
 * Site Goals GatheringBreakdownDataBadge tests.
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
import { SITE_GOALS_BREAKDOWN_CUSTOM_DIMENSIONS } from '@/js/modules/analytics-4/components/site-goals/constants';
import { GOAL_TYPES } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { render } from '@tests/js/test-utils';
import {
	createTestRegistry,
	provideModules,
	provideUserAuthentication,
} from '@tests/js/utils';
import GatheringBreakdownDataBadge from './GatheringBreakdownDataBadge';

describe( 'GatheringBreakdownDataBadge', () => {
	let registry: WPDataRegistry;

	function seedAvailableCustomDimensions(
		availableCustomDimensions: string[]
	) {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetSettings( { availableCustomDimensions } );
	}

	function seedGatheringData( gatheringData: boolean ) {
		SITE_GOALS_BREAKDOWN_CUSTOM_DIMENSIONS.forEach( ( customDimension ) => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveIsCustomDimensionGatheringData( {
					customDimension,
					gatheringData,
				} );
		} );
	}

	beforeEach( () => {
		registry = createTestRegistry();
		provideUserAuthentication( registry );
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
			},
		] );
	} );

	it( 'renders when the section breakdown dimension exists and is gathering data', () => {
		seedAvailableCustomDimensions( SITE_GOALS_BREAKDOWN_CUSTOM_DIMENSIONS );
		seedGatheringData( true );

		const { getByText } = render(
			<GatheringBreakdownDataBadge goalType={ GOAL_TYPES.LEAD } />,
			{ registry }
		);

		expect( getByText( 'Gathering data' ) ).toBeInTheDocument();
	} );

	it( 'renders the widget variant label', () => {
		seedAvailableCustomDimensions( SITE_GOALS_BREAKDOWN_CUSTOM_DIMENSIONS );
		seedGatheringData( true );

		const { getByText } = render(
			<GatheringBreakdownDataBadge
				goalType={ GOAL_TYPES.LEAD }
				variant="widget"
			/>,
			{ registry }
		);

		expect( getByText( 'Gathering breakdown data' ) ).toBeInTheDocument();
	} );

	it( 'does not render when the section breakdown dimension does not exist', () => {
		seedAvailableCustomDimensions( [] );
		seedGatheringData( true );

		const { container } = render(
			<GatheringBreakdownDataBadge goalType={ GOAL_TYPES.LEAD } />,
			{ registry }
		);

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'does not render when the dimension exists but is no longer gathering data', () => {
		seedAvailableCustomDimensions( SITE_GOALS_BREAKDOWN_CUSTOM_DIMENSIONS );
		seedGatheringData( false );

		const { container } = render(
			<GatheringBreakdownDataBadge goalType={ GOAL_TYPES.LEAD } />,
			{ registry }
		);

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'does not render while the available custom dimensions are syncing', () => {
		seedAvailableCustomDimensions( SITE_GOALS_BREAKDOWN_CUSTOM_DIMENSIONS );
		seedGatheringData( true );
		// A scheduled sync sets a timeout ID, which marks the dimensions as
		// syncing until it resolves.
		registry.dispatch( MODULES_ANALYTICS_4 ).setSyncTimeoutID( 1 );

		const { container } = render(
			<GatheringBreakdownDataBadge goalType={ GOAL_TYPES.LEAD } />,
			{ registry }
		);

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'does not render while the gathering data state is still resolving', () => {
		seedAvailableCustomDimensions( SITE_GOALS_BREAKDOWN_CUSTOM_DIMENSIONS );
		// Mark the gathering data resolution as in progress so the selector
		// returns undefined without triggering a network request.
		SITE_GOALS_BREAKDOWN_CUSTOM_DIMENSIONS.forEach( ( customDimension ) => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.startResolution( 'isCustomDimensionGatheringData', [
					customDimension,
				] );
		} );

		const { container } = render(
			<GatheringBreakdownDataBadge goalType={ GOAL_TYPES.LEAD } />,
			{ registry }
		);

		expect( container ).toBeEmptyDOMElement();
	} );
} );
