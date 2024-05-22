/**
 * AdsModuleSetupCTAWidget Component Stories.
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
import { provideModules } from '../../../../../../tests/js/utils';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import AdsModuleSetupCTAWidget from './AdsModuleSetupCTAWidget';
import { ADS_MODULE_SETUP_BANNER_PROMPT_DISMISSED_KEY } from '../../datastore/constants';
import { WEEK_IN_SECONDS } from '../../../../util';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';

function Template() {
	return <AdsModuleSetupCTAWidget />;
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';
Default.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( [] );
	},
};
Default.scenario = {
	label: 'Modules/Ads/Components/Dashboard/AdsModuleSetupCTAWidget/Default',
	delay: 250,
};

export const AfterOneDismissal = Template.bind( {} );
AfterOneDismissal.storyName = 'After It Was Dismissed Once';
AfterOneDismissal.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {
			[ ADS_MODULE_SETUP_BANNER_PROMPT_DISMISSED_KEY ]: {
				expires: 0,
				count: 1,
			},
		} );
	},
};
AfterOneDismissal.scenario = {
	label: 'Modules/Ads/Components/Dashboard/AdsModuleSetupCTAWidget/AfterOneDismissal',
	delay: 250,
};

export default {
	title: 'Modules/Ads/Components/Dashboard/AdsModuleSetupCTAWidget',
	decorators: [
		( Story, { args } ) => {
			const setupRegistry = ( registry ) => {
				provideModules( registry, [
					{
						slug: 'ads',
						active: false,
					},
				] );

				args?.setupRegistry( registry );

				fetchMock.postOnce(
					new RegExp(
						'^/google-site-kit/v1/core/user/data/dismiss-prompt'
					),
					{
						body: {
							[ ADS_MODULE_SETUP_BANNER_PROMPT_DISMISSED_KEY ]: {
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
