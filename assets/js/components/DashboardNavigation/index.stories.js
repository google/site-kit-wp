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
import DashboardNavigation from './';
import { Provider as ViewContextProvider } from '../Root/ViewContextContext';
import { CORE_WIDGETS } from '../../googlesitekit/widgets/datastore/constants';
import { CONTEXT_MAIN_DASHBOARD_MONETIZATION } from '../../googlesitekit/widgets/default-contexts';
import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '../../googlesitekit/constants';
import { freezeFetch } from '../../../../tests/js/utils';
import { setupDefaultChips } from './test-utils';

const Template = ( { setupRegistry = () => {}, viewContext, ...args } ) => (
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
	viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
};

export const LoadingDashboardNavigation = Template.bind( {} );
LoadingDashboardNavigation.storyName = 'Loading State';
LoadingDashboardNavigation.args = {
	setupRegistry: () => {
		freezeFetch(
			new RegExp( '^/google-site-kit/v1/core/modules/data/list' )
		);
	},
	viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
};

export const MonetizationHiddenDashboardNavigation = Template.bind( {} );
MonetizationHiddenDashboardNavigation.storyName = 'Monetization Hidden State';
MonetizationHiddenDashboardNavigation.args = {
	setupRegistry: ( registry ) => {
		setupDefaultChips( registry );
	},
	viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
};

export default {
	title: 'Components/DashboardNavigation',
	component: DashboardNavigation,
};
