/**
 * Analytics SettingsView component stories.
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
import SettingsForm from './SettingsForm';
import { Cell, Grid, Row } from '../../../../material-components';
import { MODULES_ANALYTICS } from '../../datastore/constants';
import { MODULES_ANALYTICS_4 } from '../../../analytics-4/datastore/constants';
import { createBuildAndReceivers } from '../../../../modules/tagmanager/datastore/__factories__/utils';
import {
	provideModules,
	provideModuleRegistrations,
	provideSiteInfo,
} from '../../../../../../tests/js/utils';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import * as fixtures from '../../datastore/__fixtures__';
import * as ga4Fixtures from '../../../analytics-4/datastore/__fixtures__';

const account = fixtures.accountsPropertiesProfiles.accounts[ 0 ];
const properties = [
	{
		...fixtures.accountsPropertiesProfiles.properties[ 0 ],
		websiteUrl: 'http://example.com', // eslint-disable-line sitekit/acronym-case
	},
	{
		...fixtures.accountsPropertiesProfiles.properties[ 1 ],
	},
];

const accountID = account.id;

function Template( args ) {
	return (
		<div className="googlesitekit-layout">
			<div className="googlesitekit-settings-module googlesitekit-settings-module--active googlesitekit-settings-module--analytics">
				<div className="googlesitekit-setup-module">
					<div className="googlesitekit-settings-module__content googlesitekit-settings-module__content--open">
						<Grid>
							<Row>
								<Cell size={ 12 }>
									<SettingsForm { ...args } />
								</Cell>
							</Row>
						</Grid>
					</div>
				</div>
			</div>
		</div>
	);
}

export const WithGA4andUASnippet = Template.bind( null );
WithGA4andUASnippet.storyName = 'Settings w/ all switches';
WithGA4andUASnippet.scenario = {
	label: 'Modules/Analytics/Settings/SettingsEdit/WithGA4andUASnippet',
	delay: 250,
};

export const WithoutModuleAccess = Template.bind( null );
WithoutModuleAccess.storyName = 'Settings w/o module access';
WithoutModuleAccess.args = {
	hasAnalyticsAccess: false,
	hasAnalytics4Access: false,
};

export const OwnedSettingsChanged = Template.bind( null );
OwnedSettingsChanged.storyName = 'Owned Settings Changed';
OwnedSettingsChanged.args = {
	hasAnalyticsAccess: true,
	hasAnalytics4Access: true,
};
OwnedSettingsChanged.parameters = {
	features: [ 'dashboardSharing' ],
};

export const WithUATag = Template.bind( null );
WithUATag.storyName = 'With UA Tag, non-matching property selected';
WithUATag.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			registry.dispatch( MODULES_ANALYTICS ).selectProperty(
				properties[ 1 ].id,
				// eslint-disable-next-line sitekit/acronym-case
				properties[ 1 ].internalWebPropertyId
			);

			registry
				.dispatch( MODULES_ANALYTICS )
				.receiveGetExistingTag( properties[ 0 ].id );
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<Story />
			</WithRegistrySetup>
		);
	},
];

export const WithGA4Tag = Template.bind( null );
WithGA4Tag.storyName = 'With GA4 Tag, non-matching property selected';
WithGA4Tag.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.selectProperty( ga4Fixtures.properties[ 1 ]._id );

			registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetExistingTag(
				// eslint-disable-next-line sitekit/acronym-case
				ga4Fixtures.webDataStreams[ 0 ].webStreamData.measurementId
			);
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<Story />
			</WithRegistrySetup>
		);
	},
];

export const WithBothTags = Template.bind( null );
WithBothTags.storyName =
	'With Both Tags, both UA+GA4 matching selected properties';
WithBothTags.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			registry
				.dispatch( MODULES_ANALYTICS )
				.receiveGetExistingTag( properties[ 0 ].id );

			registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetExistingTag(
				// eslint-disable-next-line sitekit/acronym-case
				ga4Fixtures.webDataStreams[ 0 ].webStreamData.measurementId
			);
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<Story />
			</WithRegistrySetup>
		);
	},
];
WithBothTags.scenario = {
	label: 'Modules/Analytics/Settings/SettingsEdit/WithBothTags',
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
	label: 'Modules/Analytics/Settings/SettingsEdit/WithExistingGTMPropertyMatching',
	delay: 250,
};

export default {
	title: 'Modules/Analytics/Settings/SettingsEdit',
	decorators: [
		( Story ) => {
			const setupRegistry = ( registry ) => {
				provideModules( registry, [
					{
						slug: 'analytics',
						active: true,
						connected: true,
						owner: { login: 'test-owner-username' },
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
				registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
					useSnippet: true,
				} );

				registry.dispatch( MODULES_ANALYTICS ).receiveGetSettings( {
					useSnippet: true,
					canUseSnippet: true,
					anonymizeIP: true,
					trackingDisabled: [ 'loggedinUsers' ],
				} );
				registry
					.dispatch( MODULES_ANALYTICS )
					.receiveGetAccounts( [ account ] );
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
};
