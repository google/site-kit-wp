/**
 * SettingsCardKeyMetrics Component Stories.
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
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';
import SettingsCardConsentMode from './SettingsCardConsentMode';

function Template() {
	return <SettingsCardConsentMode />;
}

export const Default = Template.bind( {} );
Default.storyName = 'SettingsCardConsentMode';
Default.scenario = {
	label: 'ConsentMode/SettingsCardConsentMode',
	delay: 250,
};

export default {
	title: 'Consent Mode',
	decorators: [
		( Story ) => {
			const setupRegistry = ( registry ) => {
				// provideUserAuthentication( registry );
				registry
					.dispatch( CORE_SITE )
					.receiveGetConsentModeSettings( { enabled: true } );

				// Mock the consent mode endpoint to allow toggling the switch.
				fetchMock.post(
					RegExp( 'google-site-kit/v1/core/site/data/consent-mode' ),
					( url, { body } ) => {
						const { data } = JSON.parse( body );

						return { body: data.settings };
					}
				);
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
