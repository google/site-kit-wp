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
import { MODULES_ANALYTICS_4 } from '../../modules/analytics-4/datastore/constants';
import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';
import SettingsCardConsentMode from './SettingsCardConsentMode';
import { freezeFetch, provideModules } from '../../../../tests/js/utils';

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
	label: 'ConsentMode/SettingsCardConsentMode/Default',
};

export const WithAdsConnected = Template.bind( {} );
WithAdsConnected.storyName = 'WithAdsConnected';
WithAdsConnected.args = {
	setupRegistry: ( registry ) => {
		// Set consent mode to disabled in order to show the additional Ads related notice.
		registry.dispatch( CORE_SITE ).setConsentModeEnabled( false );

		registry
			.dispatch( CORE_SITE )
			.receiveGetConsentAPIInfo( { hasConsentAPI: true } );

		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			adsConversionID: 'AW-123456789',
		} );

		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			// Set the following to default, as otherwise if it is set to
			// undefined, the `core/site` `isAdsConnected` selector will
			// return undefined.
			adsLinked: false,
			googleTagContainerDestinationIDs: null,
		} );
	},
};
WithAdsConnected.scenario = {
	label: 'ConsentMode/SettingsCardConsentMode/WithAdsConnected',
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
	label: 'ConsentMode/SettingsCardConsentMode/WithoutConsentAPI',
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
	label: 'ConsentMode/SettingsCardConsentMode/WithConsentAPINotActivated',
};

export const Loading = Template.bind( {} );
Loading.storyName = 'Loading';
Loading.args = {
	setupRegistry: () => {
		freezeFetch(
			new RegExp( '^/google-site-kit/v1/core/site/data/consent-api-info' )
		);
	},
};
Loading.decorators = [
	( Story ) => {
		// Ensure the animation is paused for VRT tests to correctly capture the loading state.
		return (
			<div className="googlesitekit-vrt-animation-paused">
				<Story />
			</div>
		);
	},
];
Loading.scenario = {
	label: 'ConsentMode/SettingsCardConsentMode/Loading',
};

export default {
	title: 'Consent Mode/SettingsCardConsentMode',
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

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetSettings( {} );

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
