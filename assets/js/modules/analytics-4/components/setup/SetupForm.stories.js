/**
 * SetupForm component stories.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { MODULES_ANALYTICS_4 } from '../../datastore/constants';
import {
	provideModules,
	provideModuleRegistrations,
	provideSiteInfo,
} from '../../../../../../tests/js/utils';
import ModuleSetup from '../../../../components/setup/ModuleSetup';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import * as fixtures from '../../datastore/__fixtures__';
import { Provider as ViewContextProvider } from '../../../../components/Root/ViewContextContext';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../../../googlesitekit/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';

const { accountSummaries, webDataStreamsBatch } = fixtures;
const accounts = accountSummaries.accountSummaries;
const properties = accounts[ 1 ].propertySummaries;
const accountID = accounts[ 1 ]._id;
const propertyID = properties[ 0 ]._id;

function Template() {
	return (
		<ViewContextProvider value={ VIEW_CONTEXT_MAIN_DASHBOARD }>
			<ModuleSetup moduleSlug="analytics-4" />
		</ViewContextProvider>
	);
}

export const Default = Template.bind( null );
Default.storyName = 'Default';
Default.scenario = {
	label: 'Modules/Analytics4/Setup/SetupForm/Default',
	delay: 250,
};

export default {
	title: 'Modules/Analytics4/Setup/SetupForm',
	decorators: [
		( Story ) => {
			const setupRegistry = ( registry ) => {
				provideModules( registry, [
					{
						slug: 'analytics-4',
						active: true,
						connected: true,
					},
				] );

				provideSiteInfo( registry );
				provideModuleRegistrations( registry );

				registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
					adsConversionID: '',
				} );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetExistingTag( null );

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

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.selectAccount( accountID );

				registry
					.dispatch( CORE_SITE )
					.receiveGetConversionTrackingSettings( {
						enabled: false,
					} );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
	parameters: { padding: 0 },
};
