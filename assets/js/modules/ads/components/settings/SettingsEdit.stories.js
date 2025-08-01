/**
 * Ads SettingsEdit component stories.
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
import SettingsEdit from './SettingsEdit';
import { Cell, Grid, Row } from '../../../../material-components';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { MODULES_ADS } from '../../datastore/constants';
import { MODULE_SLUG_ADS } from '../../constants';
import {
	provideModules,
	WithTestRegistry,
} from '../../../../../../tests/js/utils';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';

function Template( args ) {
	return (
		<div className="googlesitekit-layout">
			<div className="googlesitekit-settings-module googlesitekit-settings-module--active googlesitekit-settings-module--ads">
				<div className="googlesitekit-setup-module">
					<div className="googlesitekit-settings-module__content googlesitekit-settings-module__content--open">
						<Grid>
							<Row>
								<Cell size={ 12 }>
									<SettingsEdit { ...args } />
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
Default.scenario = {};
Default.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			registry.dispatch( MODULES_ADS ).receiveGetSettings( {
				conversionID: 'AW-123456789',
			} );
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<Story />
			</WithRegistrySetup>
		);
	},
];

export default {
	title: 'Modules/Ads/Settings/SettingsEdit',
	decorators: [
		( Story ) => {
			const setupRegistry = ( registry ) => {
				provideModules( registry, [
					{
						slug: MODULE_SLUG_ADS,
						active: true,
						connected: true,
					},
				] );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};

export const PaxConnected = Template.bind( null );
PaxConnected.storyName = 'With PAX onboarding';
PaxConnected.scenario = {};
PaxConnected.parameters = {
	features: [ 'adsPax' ],
};
PaxConnected.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			// Unset the value set in the prrevious scenario.
			registry.dispatch( MODULES_ADS ).setConversionID( null );

			registry.dispatch( MODULES_ADS ).receiveGetSettings( {
				paxConversionID: 'AW-54321',
				extCustomerID: 'C-872756827HGFSD',
			} );
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
IceEnabled.scenario = {};
IceEnabled.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			// Unset the value set in the previous scenario.
			registry.dispatch( MODULES_ADS ).setConversionID( null );

			registry.dispatch( MODULES_ADS ).receiveGetSettings( {
				conversionID: 'AW-54321',
				paxConversionID: '',
				extCustomerID: '',
			} );
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<Story />
			</WithRegistrySetup>
		);
	},
];

export const IcePaxEnabled = Template.bind( null );
IcePaxEnabled.storyName = 'With ICE & PAX Enabled';
IcePaxEnabled.scenario = {};
IcePaxEnabled.parameters = {
	features: [ 'adsPax' ],
};
IcePaxEnabled.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			registry.dispatch( MODULES_ADS ).receiveGetSettings( {
				conversionID: '',
				paxConversionID: 'AW-54321',
				extCustomerID: 'C-23482345986',
			} );
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<Story />
			</WithRegistrySetup>
		);
	},
];

export const GTGEnabled = Template.bind( null );
GTGEnabled.storyName = 'With Google tag gateway enabled';
GTGEnabled.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			const gtgServerRequirementsEndpoint = new RegExp(
				'^/google-site-kit/v1/core/site/data/gtg-server-requirement-status'
			);

			const gtgSettings = {
				isEnabled: true,
				isGTGHealthy: true,
				isScriptAccessEnabled: true,
			};

			fetchMock.getOnce( gtgServerRequirementsEndpoint, {
				body: gtgSettings,
			} );

			registry
				.dispatch( CORE_SITE )
				.receiveGetGoogleTagGatewaySettings( gtgSettings );
		};

		return (
			<WithTestRegistry
				callback={ setupRegistry }
				features={ [ 'googleTagGateway' ] }
			>
				<Story />
			</WithTestRegistry>
		);
	},
];

export const GTGDisabledWithWarning = Template.bind( null );
GTGDisabledWithWarning.storyName =
	'With Google tag gateway disabled with warning';
GTGDisabledWithWarning.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			const gtgServerRequirementsEndpoint = new RegExp(
				'^/google-site-kit/v1/core/site/data/gtg-server-requirement-status'
			);

			const gtgSettings = {
				isEnabled: true,
				isGTGHealthy: false,
				isScriptAccessEnabled: false,
			};

			fetchMock.getOnce( gtgServerRequirementsEndpoint, {
				body: gtgSettings,
			} );

			registry
				.dispatch( CORE_SITE )
				.receiveGetGoogleTagGatewaySettings( gtgSettings );
		};

		return (
			<WithTestRegistry
				callback={ setupRegistry }
				features={ [ 'googleTagGateway' ] }
			>
				<Story />
			</WithTestRegistry>
		);
	},
];
