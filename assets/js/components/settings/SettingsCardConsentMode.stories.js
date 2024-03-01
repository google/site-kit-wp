/**
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
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { MODULES_ANALYTICS } from '../../modules/analytics/datastore/constants';
import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';
import SettingsCardConsentMode from './SettingsCardConsentMode';
import { provideModules } from '../../../../tests/js/utils';

function Template() {
	return <SettingsCardConsentMode />;
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';
Default.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( CORE_SITE )
			.receiveGetConsentAPIInfo( { hasConsentAPI: true } );
	},
};
Default.scenario = {
	label: 'ConsentMode/SettingsCardConsentMode',
};

export const WithAdsConnected = Template.bind( {} );
WithAdsConnected.storyName = 'WithAdsConnected';
WithAdsConnected.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( CORE_SITE )
			.receiveGetConsentAPIInfo( { hasConsentAPI: true } );

		registry
			.dispatch( MODULES_ANALYTICS )
			.setSettings( { adsConversionID: 'AW-123456789' } );
	},
};
WithAdsConnected.scenario = {
	label: 'ConsentMode/WithAdsConnected',
};

export const WithoutConsentAPI = Template.bind( {} );
WithoutConsentAPI.storyName = 'WithoutConsentAPI';
WithoutConsentAPI.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( CORE_SITE ).receiveGetConsentAPIInfo( {
			hasConsentAPI: false,
			wpConsentPlugin: {
				installed: false,
				activateURL:
					'http://example.com/wp-admin/plugins.php?action=activate&plugin=some-plugin',
				installURL:
					'http://example.com/wp-admin/update.php?action=install-plugin&plugin=some-plugin',
			},
		} );
	},
};
WithoutConsentAPI.scenario = {
	label: 'ConsentMode/WithoutConsentAPI',
};

export const WithConsentAPINotActivated = Template.bind( {} );
WithConsentAPINotActivated.storyName = 'WithConsentAPINotActivated';
WithConsentAPINotActivated.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( CORE_SITE ).receiveGetConsentAPIInfo( {
			hasConsentAPI: false,
			wpConsentPlugin: {
				installed: true,
				activateURL:
					'http://example.com/wp-admin/plugins.php?action=activate&plugin=some-plugin',
				installURL:
					'http://example.com/wp-admin/update.php?action=install-plugin&plugin=some-plugin',
			},
		} );
	},
};
WithConsentAPINotActivated.scenario = {
	label: 'ConsentMode/WithConsentAPINotActivated',
};

export default {
	title: 'Consent Mode',
	decorators: [
		( Story, { args } ) => {
			const setupRegistry = ( registry ) => {
				provideModules( registry, [
					{
						active: true,
						connected: true,
						slug: 'analytics-4',
					},
				] );

				registry
					.dispatch( CORE_SITE )
					.receiveGetConsentModeSettings( { enabled: true } );

				registry.dispatch( MODULES_ANALYTICS ).receiveGetSettings( {} );

				// Mock the consent mode endpoint to allow toggling the switch.
				fetchMock.post(
					RegExp( 'google-site-kit/v1/core/site/data/consent-mode' ),
					( url, { body } ) => {
						const { data } = JSON.parse( body );

						return { body: data.settings };
					}
				);

				if ( args.setupRegistry ) {
					args.setupRegistry( registry );
				}
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
