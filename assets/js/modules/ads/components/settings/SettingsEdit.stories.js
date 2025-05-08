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
Default.scenario = {
	label: 'Modules/Ads/Settings/SettingsEdit/Default',
	delay: 500,
};
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
						slug: 'ads',
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
PaxConnected.scenario = {
	label: 'Modules/Ads/Settings/SettingsEdit/PAX',
	delay: 500,
};
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
IceEnabled.scenario = {
	label: 'Modules/Ads/Settings/SettingsEdit/ICE',
	delay: 500,
};
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
IcePaxEnabled.scenario = {
	label: 'Modules/Ads/Settings/SettingsEdit/ICE_PAX',
	delay: 500,
};
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

export const FirstPartyModeEnabled = Template.bind( null );
FirstPartyModeEnabled.storyName = 'FirstPartyModeEnabled';
FirstPartyModeEnabled.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			const fpmServerRequirementsEndpoint = new RegExp(
				'^/google-site-kit/v1/core/site/data/fpm-server-requirement-status'
			);

			const fpmSettings = {
				isEnabled: true,
				isFPMHealthy: true,
				isScriptAccessEnabled: true,
			};

			fetchMock.getOnce( fpmServerRequirementsEndpoint, {
				body: fpmSettings,
			} );

			registry
				.dispatch( CORE_SITE )
				.receiveGetFirstPartyModeSettings( fpmSettings );
		};

		return (
			<WithTestRegistry
				callback={ setupRegistry }
				features={ [ 'firstPartyMode' ] }
			>
				<Story />
			</WithTestRegistry>
		);
	},
];

export const FirstPartyModeDisabledWithWarning = Template.bind( null );
FirstPartyModeDisabledWithWarning.storyName =
	'FirstPartyModeDisabledWithWarning';
FirstPartyModeDisabledWithWarning.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			const fpmServerRequirementsEndpoint = new RegExp(
				'^/google-site-kit/v1/core/site/data/fpm-server-requirement-status'
			);

			const fpmSettings = {
				isEnabled: true,
				isFPMHealthy: false,
				isScriptAccessEnabled: false,
			};

			fetchMock.getOnce( fpmServerRequirementsEndpoint, {
				body: fpmSettings,
			} );

			registry
				.dispatch( CORE_SITE )
				.receiveGetFirstPartyModeSettings( fpmSettings );
		};

		return (
			<WithTestRegistry
				callback={ setupRegistry }
				features={ [ 'firstPartyMode' ] }
			>
				<Story />
			</WithTestRegistry>
		);
	},
];
