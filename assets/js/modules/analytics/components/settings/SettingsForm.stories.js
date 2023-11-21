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
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS } from '../../datastore/constants';
import { MODULES_ANALYTICS_4 } from '../../../analytics-4/datastore/constants';
import { GA4_AUTO_SWITCH_DATE } from '../../..//analytics-4/constants';
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

export const WithoutUAToggleGA4Enabled = Template.bind( null );
WithoutUAToggleGA4Enabled.storyName = 'Settings w/o UA toggle, GA4 enabled';
WithoutUAToggleGA4Enabled.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			registry
				.dispatch( MODULES_ANALYTICS )
				.receiveGetProperties( [], { accountID } );
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<Story />
			</WithRegistrySetup>
		);
	},
];
WithoutUAToggleGA4Enabled.scenario = {
	label: 'Modules/Analytics/Settings/SettingsEdit/WithoutUAToggleGA4Enabled',
	delay: 250,
};

export const PropertyNotAvailable = Template.bind( null );
PropertyNotAvailable.storyName =
	'Settings w/ selected GA4 property not available';
PropertyNotAvailable.args = {
	hasAnalyticsAccess: true,
	hasAnalytics4Access: true,
};
PropertyNotAvailable.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetProperties( [], {
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
PropertyNotAvailable.scenario = {
	label: 'Modules/Analytics/Settings/SettingsEdit/PropertyNotAvailable',
	delay: 250,
};

export const WebDataStreamNotAvailable = Template.bind( null );
WebDataStreamNotAvailable.storyName =
	'Settings w/ selected GA4 webDataStream not available';
WebDataStreamNotAvailable.args = {
	hasAnalyticsAccess: true,
	hasAnalytics4Access: true,
};
WebDataStreamNotAvailable.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveGetWebDataStreamsBatch(
					{ 1000: [] },
					{
						propertyIDs: [ '1000' ],
					}
				);
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<Story />
			</WithRegistrySetup>
		);
	},
];
WebDataStreamNotAvailable.scenario = {
	label: 'Modules/Analytics/Settings/SettingsEdit/WebDataStreamNotAvailable',
	delay: 250,
};

export const WithoutUAAndGA4AccessGA4NotConnected = Template.bind( null );
WithoutUAAndGA4AccessGA4NotConnected.storyName =
	'Settings w/o UA access, GA4 not connected';
WithoutUAAndGA4AccessGA4NotConnected.args = {
	hasAnalyticsAccess: false,
	hasAnalytics4Access: true, // if GA4 is not connected, hasAnalytics4Access is assumed true
};
WithoutUAAndGA4AccessGA4NotConnected.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			provideModules( registry, [
				{
					slug: 'analytics',
					active: true,
					connected: true,
					owner: { login: 'analytics-owner-username' },
				},
				{
					slug: 'analytics-4',
					active: true,
					connected: false,
				},
			] );
			registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<Story />
			</WithRegistrySetup>
		);
	},
];

export const WithoutUAAndGA4AccessFallbackOwnerName = Template.bind( null );
WithoutUAAndGA4AccessFallbackOwnerName.storyName =
	'Settings w/o UA access, GA4 not connected, fallback owner name';
WithoutUAAndGA4AccessFallbackOwnerName.args = {
	hasAnalyticsAccess: false,
	hasAnalytics4Access: true, // if GA4 is not connected, hasAnalytics4Access is assumed true
};
WithoutUAAndGA4AccessFallbackOwnerName.decorators = [
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
					connected: false,
				},
			] );
			registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<Story />
			</WithRegistrySetup>
		);
	},
];

export const WithoutUAAndGA4AccessGA4Connected = Template.bind( null );
WithoutUAAndGA4AccessGA4Connected.storyName =
	'Settings w/o UA and GA4 access, GA4 connected';
WithoutUAAndGA4AccessGA4Connected.args = {
	hasAnalyticsAccess: false,
	hasAnalytics4Access: false,
};

export const WithoutUAAccessGA4Connected = Template.bind( null );
WithoutUAAccessGA4Connected.storyName = 'Settings w/o UA access, GA4 connected';
WithoutUAAccessGA4Connected.args = {
	hasAnalyticsAccess: false,
	hasAnalytics4Access: true,
};

export const WithoutGA4AccessGA4Connected = Template.bind( null );
WithoutGA4AccessGA4Connected.storyName =
	'Settings w/o GA4 access, GA4 connected';
WithoutGA4AccessGA4Connected.args = {
	hasAnalyticsAccess: true,
	hasAnalytics4Access: false,
};

export const OwnedSettingsChanged = Template.bind( null );
OwnedSettingsChanged.storyName = 'Owned Settings Changed';
OwnedSettingsChanged.args = {
	hasAnalyticsAccess: true,
	hasAnalytics4Access: true,
};

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
WithGA4Tag.scenario = {
	label: 'Modules/Analytics/Settings/SettingsEdit/WithGA4Tag',
	delay: 250,
};

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

export const WithEnhancedMeasurementToggle = Template.bind( null );
WithEnhancedMeasurementToggle.storyName = 'With Enhanced Measurement Toggle';
WithEnhancedMeasurementToggle.args = {
	hasAnalyticsAccess: true,
	hasAnalytics4Access: true,
};

WithEnhancedMeasurementToggle.scenario = {
	label: 'Modules/Analytics/Settings/SettingsEdit/WithEnhancedMeasurementToggle',
	delay: 250,
};

export const PostGA4AutoSwitch = Template.bind( null );
PostGA4AutoSwitch.storyName = 'Post GA4 auto-switch';
PostGA4AutoSwitch.args = {
	hasAnalyticsAccess: true,
	hasAnalytics4Access: true,
};
PostGA4AutoSwitch.parameters = {};
PostGA4AutoSwitch.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			registry
				.dispatch( CORE_USER )
				.setReferenceDate( GA4_AUTO_SWITCH_DATE );
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<Story />
			</WithRegistrySetup>
		);
	},
];
PostGA4AutoSwitch.scenario = {
	label: 'Modules/Analytics/Settings/SettingsEdit/PostGA4AutoSwitch',
};

export default {
	title: 'Modules/Analytics/Settings/SettingsEdit',
	decorators: [
		( Story ) => {
			const setupRegistry = async ( registry ) => {
				global._googlesitekitDashboardSharingData = {
					settings: {},
					roles: [],
				};

				provideModules( registry, [
					{
						slug: 'analytics',
						active: true,
						connected: true,
						owner: { login: 'analytics-owner-username' },
					},
					{
						slug: 'analytics-4',
						active: true,
						connected: true,
						owner: { login: 'analytics_4-owner-username' },
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

				await registry
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
