/**
 * ConsentModeSetupCTAWidget Component Stories.
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
import { provideModules } from '../../../../tests/js/utils';
import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4 } from '../../modules/analytics-4/datastore/constants';
import { WEEK_IN_SECONDS } from '../../util';
import ConsentModeSetupCTAWidget from './ConsentModeSetupCTAWidget';
import { CONSENT_MODE_SETUP_CTA_WIDGET_SLUG } from './constants';

function Template() {
	return <ConsentModeSetupCTAWidget />;
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';
Default.scenario = {
	label: 'ConsentMode/ConsentModeSetupCTAWidget/Default',
	delay: 250,
};

export default {
	title: 'Consent Mode/ConsentModeSetupCTAWidget',
	decorators: [
		( Story ) => {
			const setupRegistry = ( registry ) => {
				provideModules( registry, [
					{
						slug: 'analytics-4',
						active: true,
						connected: true,
					},
				] );

				registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
					adsConversionID: 'AW-123456789',
					// Set the following to default, as otherwise if it is set to
					// undefined, the `core/site` `isAdsConnected` selector will
					// return undefined.
					adsLinked: false,
					googleTagContainerDestinationIDs: null,
				} );

				registry
					.dispatch( CORE_SITE )
					.receiveGetConsentModeSettings( { enabled: false } );

				fetchMock.postOnce(
					new RegExp(
						'google-site-kit/v1/core/site/data/consent-mode'
					),
					{
						body: { enabled: true },
						status: 200,
					}
				);

				registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( [] );

				fetchMock.postOnce(
					new RegExp(
						'^/google-site-kit/v1/core/user/data/dismiss-prompt'
					),
					{
						body: {
							[ CONSENT_MODE_SETUP_CTA_WIDGET_SLUG ]: {
								expires: Date.now() / 1000 + WEEK_IN_SECONDS, // Provide a realistic value, although it's not used.
								count: 1,
							},
						},
						status: 200,
					}
				);
			};

			return (
				<div
					style={ {
						minHeight: '200px',
						display: 'flex',
						alignItems: 'center',
					} }
				>
					<div id="adminmenu">
						{ /* eslint-disable-next-line jsx-a11y/anchor-has-content */ }
						<a href="http://test.test/?page=googlesitekit-settings" />
					</div>
					<div style={ { flex: 1 } }>
						<WithRegistrySetup func={ setupRegistry }>
							<Story />
						</WithRegistrySetup>
					</div>
				</div>
			);
		},
	],
};
