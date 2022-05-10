/**
 * DashboardNavigation Component Stories.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import DashboardNavigation from './DashboardNavigation';
import { Provider as ViewContextProvider } from './Root/ViewContextContext';
import { CORE_WIDGETS } from '../googlesitekit/widgets/datastore/constants';
import {
	CONTEXT_MAIN_DASHBOARD_TRAFFIC,
	CONTEXT_MAIN_DASHBOARD_CONTENT,
	CONTEXT_MAIN_DASHBOARD_SPEED,
	CONTEXT_MAIN_DASHBOARD_MONETIZATION,
} from '../googlesitekit/widgets/default-contexts';
import WithRegistrySetup from '../../../tests/js/WithRegistrySetup';
import { VIEW_CONTEXT_DASHBOARD } from '../googlesitekit/constants';

/**
 * Dispatches required actions to registry to make sure widget contexts for Traffic, Content & Speed are active.
 *
 * @since 1.47.0
 *
 * @param {Object} registry The registry object.
 */
const setupDefaultChips = ( registry ) => {
	// Traffic
	registry.dispatch( CORE_WIDGETS ).registerWidgetArea( 'TrafficArea', {
		title: 'Traffic',
		subtitle: 'Traffic Widget Area',
		style: 'composite',
	} );
	registry
		.dispatch( CORE_WIDGETS )
		.assignWidgetArea( 'TrafficArea', CONTEXT_MAIN_DASHBOARD_TRAFFIC );
	registry.dispatch( CORE_WIDGETS ).registerWidget( 'TrafficWidget', {
		Component: () => <div>Traffic Widget</div>,
	} );
	registry
		.dispatch( CORE_WIDGETS )
		.assignWidget( 'TrafficWidget', 'TrafficArea' );

	// Content
	registry.dispatch( CORE_WIDGETS ).registerWidgetArea( 'ContentArea', {
		title: 'Content',
		subtitle: 'Content Widget Area',
		style: 'composite',
	} );
	registry
		.dispatch( CORE_WIDGETS )
		.assignWidgetArea( 'ContentArea', CONTEXT_MAIN_DASHBOARD_CONTENT );
	registry.dispatch( CORE_WIDGETS ).registerWidget( 'ContentWidget', {
		Component: () => <div>Content Widget</div>,
	} );
	registry
		.dispatch( CORE_WIDGETS )
		.assignWidget( 'ContentWidget', 'ContentArea' );

	// Speed
	registry.dispatch( CORE_WIDGETS ).registerWidgetArea( 'SpeedArea', {
		title: 'Speed',
		subtitle: 'Speed Widget Area',
		style: 'composite',
	} );
	registry
		.dispatch( CORE_WIDGETS )
		.assignWidgetArea( 'SpeedArea', CONTEXT_MAIN_DASHBOARD_SPEED );
	registry.dispatch( CORE_WIDGETS ).registerWidget( 'SpeedWidget', {
		Component: () => <div>Speed Widget</div>,
	} );
	registry
		.dispatch( CORE_WIDGETS )
		.assignWidget( 'SpeedWidget', 'SpeedArea' );
};

const Template = ( { setupRegistry, viewContext, ...args } ) => (
	<WithRegistrySetup func={ setupRegistry }>
		<ViewContextProvider value={ viewContext }>
			<DashboardNavigation { ...args } />
		</ViewContextProvider>
	</WithRegistrySetup>
);

export const DefaultDashboardNavigation = Template.bind( {} );
DefaultDashboardNavigation.storyName = 'Default State';
DefaultDashboardNavigation.args = {
	setupRegistry: ( registry ) => {
		setupDefaultChips( registry );
		// Monetization
		registry
			.dispatch( CORE_WIDGETS )
			.registerWidgetArea( 'MonetizationArea', {
				title: 'Monetization',
				subtitle: 'Monetization Widget Area',
				style: 'composite',
			} );
		registry
			.dispatch( CORE_WIDGETS )
			.assignWidgetArea(
				'MonetizationArea',
				CONTEXT_MAIN_DASHBOARD_MONETIZATION
			);
		registry
			.dispatch( CORE_WIDGETS )
			.registerWidget( 'MonetizationWidget', {
				Component: () => <div>Monetization Widget</div>,
			} );
		registry
			.dispatch( CORE_WIDGETS )
			.assignWidget( 'MonetizationWidget', 'MonetizationArea' );
	},
	viewContext: VIEW_CONTEXT_DASHBOARD,
};

export const MonetizationHiddenDashboardNavigation = Template.bind( {} );
MonetizationHiddenDashboardNavigation.storyName = 'Monetization Hidden State';
MonetizationHiddenDashboardNavigation.args = {
	setupRegistry: ( registry ) => {
		setupDefaultChips( registry );
	},
	viewContext: VIEW_CONTEXT_DASHBOARD,
};

export default {
	title: 'Components/DashboardNavigation',
	component: DashboardNavigation,
};
