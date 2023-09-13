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
import { FORM_SETUP, MODULES_ANALYTICS } from '../../datastore/constants';
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
import { CORE_FORMS } from '../../../../googlesitekit/datastore/forms/constants';

function Template() {
	return <ModuleSetup moduleSlug="analytics" />;
}

const { accounts, properties, profiles } = fixtures.accountsPropertiesProfiles;
const accountID = accounts[ 0 ].id;
const propertyID = properties[ 0 ].id;

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

export const WithUAMatchingTag = Template.bind( null );
WithUAMatchingTag.storyName = 'With UA Enabled, matching UA property selected';
WithUAMatchingTag.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			registry
				.dispatch( MODULES_ANALYTICS )
				.receiveGetProperties( properties, {
					accountID,
				} );
			registry
				.dispatch( MODULES_ANALYTICS )
				.receiveGetExistingTag( propertyID );

			registry
				.dispatch( MODULES_ANALYTICS )
				.receiveGetProfiles( profiles, {
					accountID,
					propertyID,
				} );
			registry.dispatch( MODULES_ANALYTICS ).selectProperty(
				properties[ 0 ].id,
				// eslint-disable-next-line sitekit/acronym-case
				properties[ 0 ].internalWebPropertyId
			);
			registry.dispatch( CORE_FORMS ).setValues( FORM_SETUP, {
				enableUA: true,
			} );
			registry.dispatch( MODULES_ANALYTICS ).setUseSnippet( true );
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<Story />
			</WithRegistrySetup>
		);
	},
];
WithUAMatchingTag.scenario = {
	label: 'Modules/Analytics/Setup/SetupFormGA4/WithUAMatchingTag',
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
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetProperties( ga4Fixtures.properties, {
						accountID,
					} );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetWebDataStreamsBatch(
						ga4Fixtures.webDataStreamsBatchSetup,
						{
							propertyIDs: Object.keys(
								ga4Fixtures.webDataStreamsBatchSetup
							),
						}
					);

				registry.dispatch( MODULES_ANALYTICS ).receiveGetSettings( {
					adsConversionID: '',
					canUseSnippet: true,
				} );
				registry
					.dispatch( MODULES_ANALYTICS )
					.receiveGetExistingTag( null );
				registry
					.dispatch( MODULES_ANALYTICS )
					.receiveGetAccounts( accounts );
				registry
					.dispatch( MODULES_ANALYTICS )
					.receiveGetProperties( [], { accountID } );

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
