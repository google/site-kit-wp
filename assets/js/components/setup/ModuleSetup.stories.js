/**
 * ModuleSetup Component Stories.
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
import { withQuery } from '@storybook/addon-queryparams';

import {
	provideModules,
	provideSiteInfo,
	provideModuleRegistrations,
} from '../../../../tests/js/utils';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';
import { Provider as ViewContextProvider } from '@/js/components/Root/ViewContextContext';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '@/js/googlesitekit/constants';
import ModuleSetup from './ModuleSetup';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import * as analyticsFixtures from '@/js/modules/analytics-4/datastore/__fixtures__';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';

function Template( props ) {
	return (
		<ViewContextProvider value={ VIEW_CONTEXT_MAIN_DASHBOARD }>
			<ModuleSetup { ...props } />
		</ViewContextProvider>
	);
}

function provideAnalytics4( registry ) {
	const { accountSummaries, webDataStreamsBatch } = analyticsFixtures;
	const accounts = accountSummaries.accountSummaries;
	const properties = accounts[ 1 ].propertySummaries;
	const accountID = accounts[ 1 ]._id;
	const propertyID = properties[ 0 ]._id;

	provideModules( registry, [
		{
			slug: MODULE_SLUG_ANALYTICS_4,
			active: false,
			connected: false,
		},
	] );

	registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
		adsConversionID: '',
	} );
	registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetExistingTag( null );
	registry
		.dispatch( MODULES_ANALYTICS_4 )
		.receiveGetAccountSummaries( accountSummaries );
	registry
		.dispatch( MODULES_ANALYTICS_4 )
		.receiveGetProperty( properties[ 0 ], {
			propertyID,
		} );
	registry
		.dispatch( MODULES_ANALYTICS_4 )
		.receiveGetWebDataStreamsBatch( webDataStreamsBatch, {
			propertyIDs: [ propertyID ],
		} );

	registry.dispatch( MODULES_ANALYTICS_4 ).selectAccount( accountID );

	registry.dispatch( CORE_SITE ).receiveGetConversionTrackingSettings( {
		enabled: false,
	} );
}

export const AnalyticsDefault = Template.bind( {} );
AnalyticsDefault.storyName = 'Analytics Default';
AnalyticsDefault.args = {
	setupRegistry: provideAnalytics4,
	moduleSlug: MODULE_SLUG_ANALYTICS_4,
};

export const AnalyticsInitialSetupFlow = Template.bind( {} );
AnalyticsInitialSetupFlow.storyName = 'Analytics 4 Initial Setup Flow';
AnalyticsInitialSetupFlow.args = {
	setupRegistry: provideAnalytics4,
	moduleSlug: MODULE_SLUG_ANALYTICS_4,
};
AnalyticsInitialSetupFlow.parameters = {
	features: [ 'setupFlowRefresh' ],
	query: {
		showProgress: 'true',
	},
};

export default {
	title: 'Setup / Module',
	decorators: [
		withQuery,
		( Story, { args } ) => {
			function setupRegistry( registry ) {
				provideSiteInfo( registry );
				provideModuleRegistrations( registry );

				args?.setupRegistry?.( registry );
			}

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
	parameters: { padding: 0 },
};
