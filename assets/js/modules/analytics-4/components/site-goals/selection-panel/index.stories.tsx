/**
 * Site Goals Selection Panel stories.
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
import { Provider as ViewContextProvider } from '@/js/components/Root/ViewContextContext';
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '@/js/googlesitekit/constants';
import { CORE_FORMS } from '@/js/googlesitekit/datastore/forms/constants';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	SITE_GOALS_BREAKDOWN_CUSTOM_DIMENSIONS,
	SITE_GOALS_DEFAULT_SELECTED_DRIVERS,
	SITE_GOALS_DEFAULT_SELECTED_VISITOR_ENGAGEMENT,
	SITE_GOALS_SELECTED_DRIVERS,
	SITE_GOALS_SELECTED_VISITOR_ENGAGEMENT,
	SITE_GOALS_SELECTION_FORM,
	SITE_GOALS_SELECTION_PANEL_OPENED_KEY,
} from '@/js/modules/analytics-4/components/site-goals/constants';
import { SITE_GOALS_INTRO_MODAL_BANNER } from '@/js/modules/analytics-4/components/site-goals/notifications/IntroModalBanner';
import {
	ENUM_CONVERSION_EVENTS,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import { Story } from '@/js/types/Story';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import SiteGoalsSelectionPanel from './index';

interface TemplateProps {
	setupRegistry?: ( registry: WPDataRegistry ) => void;
	viewContext?: string;
}

function setupDefaultRegistry( registry: WPDataRegistry ) {
	registry
		.dispatch( MODULES_ANALYTICS_4 )
		.setDetectedEvents( [
			ENUM_CONVERSION_EVENTS.PURCHASE,
			ENUM_CONVERSION_EVENTS.ADD_TO_CART,
			ENUM_CONVERSION_EVENTS.CONTACT,
		] );

	registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSiteGoalsSettings( {
		goalDrivers: SITE_GOALS_DEFAULT_SELECTED_DRIVERS,
		visitorEngagement: SITE_GOALS_DEFAULT_SELECTED_VISITOR_ENGAGEMENT,
	} );

	// Aggregated state so the breakdown notice renders above each section.
	registry
		.dispatch( MODULES_ANALYTICS_4 )
		.receiveGetSettings( { availableCustomDimensions: [] } );
	registry
		.dispatch( CORE_USER )
		.receiveGetDismissedItems( [ SITE_GOALS_INTRO_MODAL_BANNER ] );

	registry.dispatch( CORE_FORMS ).setValues( SITE_GOALS_SELECTION_FORM, {
		[ SITE_GOALS_SELECTED_DRIVERS ]: SITE_GOALS_DEFAULT_SELECTED_DRIVERS,
		[ SITE_GOALS_SELECTED_VISITOR_ENGAGEMENT ]:
			SITE_GOALS_DEFAULT_SELECTED_VISITOR_ENGAGEMENT,
	} );

	registry
		.dispatch( CORE_UI )
		.setValue( SITE_GOALS_SELECTION_PANEL_OPENED_KEY, true );
}

function Template( {
	setupRegistry = setupDefaultRegistry,
	viewContext,
}: TemplateProps ) {
	return (
		<WithRegistrySetup func={ setupRegistry }>
			<ViewContextProvider
				value={ viewContext || VIEW_CONTEXT_MAIN_DASHBOARD }
			>
				<SiteGoalsSelectionPanel />
			</ViewContextProvider>
		</WithRegistrySetup>
	);
}

export const Default = Template.bind( {} ) as Story< TemplateProps >;
Default.scenario = {};

export const GatheringBreakdownData = Template.bind(
	{}
) as Story< TemplateProps >;
GatheringBreakdownData.storyName = 'Gathering breakdown data';
GatheringBreakdownData.args = {
	setupRegistry: ( registry ) => {
		setupDefaultRegistry( registry );

		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			availableCustomDimensions: SITE_GOALS_BREAKDOWN_CUSTOM_DIMENSIONS,
		} );
		SITE_GOALS_BREAKDOWN_CUSTOM_DIMENSIONS.forEach( ( customDimension ) => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveIsCustomDimensionGatheringData( {
					customDimension,
					gatheringData: true,
				} );
		} );
	},
};

export const ViewOnly = Template.bind( {} ) as Story< TemplateProps >;
ViewOnly.storyName = 'View-only user';
ViewOnly.args = {
	viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
};

export default {
	title: 'Modules/Analytics4/Components/Site Goals/SelectionPanel',
	component: SiteGoalsSelectionPanel,
};
