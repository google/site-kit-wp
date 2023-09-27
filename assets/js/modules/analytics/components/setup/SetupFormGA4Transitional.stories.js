/**
 * SetupFormGA4Transitional component stories.
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
import { createBuildAndReceivers } from '../../../../modules/tagmanager/datastore/__factories__/utils';
import * as fixtures from '../../datastore/__fixtures__';
import * as ga4Fixtures from '../../../analytics-4/datastore/__fixtures__';

const accounts = fixtures.accountsPropertiesProfiles.accounts.slice( 0, 1 );
const properties = [
	{
		...fixtures.accountsPropertiesProfiles.properties[ 0 ],
		websiteUrl: 'http://example.com', // eslint-disable-line sitekit/acronym-case
	},
	{
		...fixtures.accountsPropertiesProfiles.properties[ 1 ],
	},
];

const accountID = accounts[ 0 ].id;

function Template() {
	return <ModuleSetup moduleSlug="analytics" />;
}

export const WithoutExistingTag = Template.bind( null );
WithoutExistingTag.storyName = 'Without Existing Tags';
WithoutExistingTag.scenario = {
	label: 'Modules/Analytics/Setup/SetupFormGA4Transitional/WithoutExistingTag',
	delay: 250,
};

export const WithGA4ExistingTag = Template.bind( null );
WithGA4ExistingTag.storyName = 'With GA4 Tag, non-matching property selected';
WithGA4ExistingTag.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.selectProperty( ga4Fixtures.properties[ 1 ]._id );

			registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetExistingTag(
				// eslint-disable-next-line sitekit/acronym-case
				ga4Fixtures.webDataStreams[ 0 ].webStreamData.measurementId
			);

			registry.dispatch( MODULES_ANALYTICS_4 ).setUseSnippet( true );
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<Story />
			</WithRegistrySetup>
		);
	},
];

export const WithGA4AndUAExistingTag = Template.bind( null );
WithGA4AndUAExistingTag.storyName =
	'With Both Tags, both UA+GA4 matching selected properties';
WithGA4AndUAExistingTag.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			registry
				.dispatch( MODULES_ANALYTICS )
				.receiveGetExistingTag( properties[ 0 ].id );
			registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetExistingTag(
				// eslint-disable-next-line sitekit/acronym-case
				ga4Fixtures.webDataStreams[ 0 ].webStreamData.measurementId
			);

			registry.dispatch( MODULES_ANALYTICS ).setUseSnippet( false );
			registry.dispatch( MODULES_ANALYTICS_4 ).setUseSnippet( false );
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<Story />
			</WithRegistrySetup>
		);
	},
];
WithGA4AndUAExistingTag.scenario = {
	label: 'Modules/Analytics/Setup/SetupFormGA4Transitional/WithGA4AndUAExistingTag',
	delay: 250,
};

export const WithExistingGTMPropertyNonMatching = Template.bind( null );
WithExistingGTMPropertyNonMatching.storyName =
	'With GTM (UA) property that does not match the selected UA property ID';
WithExistingGTMPropertyNonMatching.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			const propertyID = properties[ 1 ].id;

			const { buildAndReceiveWebAndAMP } =
				createBuildAndReceivers( registry );
			buildAndReceiveWebAndAMP( {
				accountID,
				webPropertyID: propertyID,
				ampPropertyID: propertyID,
			} );
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<Story />
			</WithRegistrySetup>
		);
	},
];

export const WithExistingGTMPropertyMatching = Template.bind( null );
WithExistingGTMPropertyMatching.storyName =
	'With GTM (UA) property that does match the selected UA property ID';
WithExistingGTMPropertyMatching.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			const propertyID = properties[ 0 ].id;

			const { buildAndReceiveWebAndAMP } =
				createBuildAndReceivers( registry );
			buildAndReceiveWebAndAMP( {
				accountID,
				webPropertyID: propertyID,
				ampPropertyID: propertyID,
			} );
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<Story />
			</WithRegistrySetup>
		);
	},
];
WithExistingGTMPropertyMatching.scenario = {
	label: 'Modules/Analytics/Setup/SetupFormGA4Transitional/WithExistingGTMPropertyMatching',
	delay: 250,
};

export default {
	title: 'Modules/Analytics/Setup/SetupFormGA4Transitional',
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
					.receiveGetProperties( properties, { accountID } );
				registry
					.dispatch( MODULES_ANALYTICS )
					.receiveGetProfiles(
						fixtures.accountsPropertiesProfiles.profiles,
						{ accountID, propertyID: properties[ 0 ].id }
					);
				registry
					.dispatch( MODULES_ANALYTICS )
					.receiveGetProfiles(
						fixtures.accountsPropertiesProfiles.profiles,
						{ accountID, propertyID: properties[ 1 ].id }
					);

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
