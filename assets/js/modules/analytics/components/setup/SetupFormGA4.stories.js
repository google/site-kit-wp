/**
 * SetupFormGA4 component stories.
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
import { MODULES_ANALYTICS } from '../../datastore/constants';
import { MODULES_ANALYTICS_4 } from '../../../analytics-4/datastore/constants';
import {
	provideModules,
	provideModuleRegistrations,
	provideSiteInfo,
} from '../../../../../../tests/js/utils';
import ModuleSetup from '../../../../components/setup/ModuleSetup';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import * as fixtures from '../../datastore/__fixtures__';
import * as ga4Fixtures from '../../../analytics-4/datastore/__fixtures__';

const { accountSummaries, webDataStreamsBatch } = ga4Fixtures;
const accounts = accountSummaries;
const properties = accounts[ 1 ].propertySummaries;
const accountID = accounts[ 1 ]._id;
const propertyID = properties[ 0 ]._id;

function Template() {
	return <ModuleSetup moduleSlug="analytics" />;
}

export const WithoutEnableUAToggle = Template.bind( null );
WithoutEnableUAToggle.storyName = 'Without Enable UA Toggle';
WithoutEnableUAToggle.scenario = {
	label: 'Modules/Analytics/Setup/SetupFormGA4/WithoutEnableUAToggle',
	delay: 250,
};

export const WithEnableUAToggle = Template.bind( null );
WithEnableUAToggle.storyName = 'With Enable UA Toggle';
WithEnableUAToggle.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			registry
				.dispatch( MODULES_ANALYTICS )
				.receiveGetProperties( fixtures.propertiesProfiles.properties, {
					accountID,
				} );
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<Story />
			</WithRegistrySetup>
		);
	},
];
WithEnableUAToggle.scenario = {
	label: 'Modules/Analytics/Setup/SetupFormGA4/WithEnableUAToggle',
	delay: 250,
};

export default {
	title: 'Modules/Analytics/Setup/SetupFormGA4',
	decorators: [
		( Story ) => {
			const setupRegistry = ( registry ) => {
				provideModules( registry, [
					{
						slug: 'analytics',
						active: true,
						connected: true,
					},
					{
						slug: 'analytics-4',
						active: true,
						connected: true,
					},
				] );

				provideSiteInfo( registry );
				provideModuleRegistrations( registry );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetSettings( {} );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetExistingTag( null );
				registry.dispatch( MODULES_ANALYTICS ).receiveGetSettings( {
					adsConversionID: '',
				} );
				registry
					.dispatch( MODULES_ANALYTICS )
					.receiveGetExistingTag( null );
				registry
					.dispatch( MODULES_ANALYTICS )
					.receiveGetProperties( [], { accountID } );
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
					.dispatch( MODULES_ANALYTICS )
					.selectAccount( accountID );
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
