/**
 * Analytics 4 SettingsForm component stories.
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
 * External dependencies
 */
import fetchMock from 'fetch-mock';

/**
 * Internal dependencies
 */
import SettingsForm from './SettingsForm';
import { Cell, Grid, Row } from '../../../../material-components';
import { MODULES_ANALYTICS_4 } from '../../datastore/constants';
import { provideModules } from '../../../../../../tests/js/utils';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import * as fixtures from '../../datastore/__fixtures__';

const {
	accountSummaries,
	webDataStreamsBatch,
	defaultEnhancedMeasurementSettings,
} = fixtures;
const accounts = accountSummaries.accountSummaries;
const properties = accounts[ 1 ].propertySummaries;
const accountID = accounts[ 1 ]._id;
const propertyID = properties[ 0 ]._id;
const webDataStreams = webDataStreamsBatch[ propertyID ];
const webDataStreamID = webDataStreamsBatch[ propertyID ][ 0 ]._id;
const measurementID =
	// eslint-disable-next-line sitekit/acronym-case
	webDataStreamsBatch[ propertyID ][ 0 ].webStreamData.measurementId;

function Template( args ) {
	return (
		<div className="googlesitekit-layout">
			<div className="googlesitekit-settings-module googlesitekit-settings-module--active googlesitekit-settings-module--analytics-4">
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

export const Default = Template.bind( null );
Default.storyName = 'Default';
Default.scenario = {
	label: 'Modules/Analytics4/Settings/SettingsEdit/Default',
	delay: 250,
};

export const EnhancedMeasurementSwitch = Template.bind( null );
EnhancedMeasurementSwitch.storyName = 'With enhanced measurement switch';
EnhancedMeasurementSwitch.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveGetEnhancedMeasurementSettings(
					{},
					{
						propertyID,
						webDataStreamID,
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

export const WithFirstPartyModeEnabled = Template.bind( null );
WithFirstPartyModeEnabled.storyName = 'With first party mode enabled';
WithFirstPartyModeEnabled.parameters = {
	features: [ 'firstPartyMode' ],
};
WithFirstPartyModeEnabled.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			const fpmServerRequirementsEndpoint = new RegExp(
				'^/google-site-kit/v1/core/site/data/fpm-server-requirement-status'
			);

			fetchMock.get( fpmServerRequirementsEndpoint, {
				body: {
					isEnabled: true,
					isFPMHealthy: true,
					isScriptAccessEnabled: true,
				},
			} );

			registry.dispatch( CORE_SITE ).receiveGetFirstPartyModeSettings( {
				isEnabled: true,
				isFPMHealthy: true,
				isScriptAccessEnabled: true,
			} );
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<Story />
			</WithRegistrySetup>
		);
	},
];
WithFirstPartyModeEnabled.scenario = {};

export const WithFirstPartyModeDisabled = Template.bind( null );
WithFirstPartyModeDisabled.storyName = 'With first party mode disabled';
WithFirstPartyModeDisabled.parameters = {
	features: [ 'firstPartyMode' ],
};
WithFirstPartyModeDisabled.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			const fpmServerRequirementsEndpoint = new RegExp(
				'^/google-site-kit/v1/core/site/data/fpm-server-requirement-status'
			);

			fetchMock.get( fpmServerRequirementsEndpoint, {
				body: {
					isEnabled: true,
					isFPMHealthy: false,
					isScriptAccessEnabled: false,
				},
			} );

			registry.dispatch( CORE_SITE ).receiveGetFirstPartyModeSettings( {
				isEnabled: true,
				isFPMHealthy: false,
				isScriptAccessEnabled: false,
			} );
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<Story />
			</WithRegistrySetup>
		);
	},
];
WithFirstPartyModeDisabled.scenario = {};

export const WithoutModuleAccess = Template.bind( null );
WithoutModuleAccess.storyName = 'Without module access';
WithoutModuleAccess.args = {
	hasModuleAccess: false,
};

export const PropertyNotAvailable = Template.bind( null );
PropertyNotAvailable.storyName = 'Property not available';
PropertyNotAvailable.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetAccountSummaries(
				accountSummaries.map( ( acct ) => ( {
					...acct,
					propertySummaries: [],
				} ) )
			);
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<Story />
			</WithRegistrySetup>
		);
	},
];

export const WebDataStreamNotAvailable = Template.bind( null );
WebDataStreamNotAvailable.storyName = 'Web data stream not available';
WebDataStreamNotAvailable.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetWebDataStreams(
				{},
				{
					propertyID,
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

export const WithExistingTagMatch = Template.bind( null );
WithExistingTagMatch.storyName =
	'With existing tag matching the measurement ID';
WithExistingTagMatch.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveGetExistingTag( measurementID );
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<Story />
			</WithRegistrySetup>
		);
	},
];

export const WithExistingTagNoMatch = Template.bind( null );
WithExistingTagNoMatch.storyName =
	'With existing tag not matching the measurement ID';
WithExistingTagNoMatch.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveGetExistingTag( 'G-123456789' );
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<Story />
			</WithRegistrySetup>
		);
	},
];

export const IceEnabled = Template.bind( null );
IceEnabled.storyName = 'With ICE Enabled';
IceEnabled.scenario = {
	label: 'Modules/Analytics4/Settings/SettingsEdit/ICE',
	delay: 250,
};
IceEnabled.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			global._googlesitekitDashboardSharingData = {
				settings: {},
				roles: [],
			};

			provideModules( registry, [
				{
					slug: 'analytics-4',
					active: true,
					connected: true,
					owner: { login: 'analytics_4-owner-username' },
				},
			] );

			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveGetAccountSummaries( accountSummaries );

			registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
				accountID,
				propertyID,
				webDataStreamID,
				measurementID,
				useSnippet: true,
				anonymizeIP: true,
				trackingDisabled: [ 'loggedinUsers' ],
			} );

			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveGetWebDataStreams( webDataStreams, {
					propertyID,
				} );

			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveGetEnhancedMeasurementSettings(
					{
						...defaultEnhancedMeasurementSettings,
					},
					{
						propertyID,
						webDataStreamID,
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

export default {
	title: 'Modules/Analytics4/Settings/SettingsEdit',
	decorators: [
		( Story, { parameters } ) => {
			const setupRegistry = ( registry ) => {
				global._googlesitekitDashboardSharingData = {
					settings: {},
					roles: [],
				};

				provideModules( registry, [
					{
						slug: 'analytics-4',
						active: true,
						connected: true,
						owner: { login: 'analytics_4-owner-username' },
					},
				] );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetAccountSummaries( accountSummaries );

				registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
					accountID,
					propertyID,
					webDataStreamID,
					measurementID,
					useSnippet: true,
					anonymizeIP: true,
					trackingDisabled: [ 'loggedinUsers' ],
				} );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetWebDataStreams( webDataStreams, {
						propertyID,
					} );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetEnhancedMeasurementSettings(
						{
							...defaultEnhancedMeasurementSettings,
						},
						{
							propertyID,
							webDataStreamID,
						}
					);
			};

			return (
				<WithRegistrySetup
					func={ setupRegistry }
					features={ parameters.features || [] }
				>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
	args: {
		hasModuleAccess: true,
	},
};
