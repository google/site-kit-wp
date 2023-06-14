/**
 * AdBlockingRecoveryToggle Component Stories.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import { provideModules } from '../../../../../../tests/js/utils';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import {
	AD_BLOCKING_RECOVERY_SETUP_STATUS_TAG_PLACED,
	MODULES_ADSENSE,
} from '../../datastore/constants';
import { ACCOUNT_STATUS_READY, SITE_STATUS_READY } from '../../util';
import AdBlockingRecoveryToggle from './AdBlockingRecoveryToggle';

const Template = () => <AdBlockingRecoveryToggle />;

const validSettings = {
	accountID: 'pub-12345678',
	clientID: 'ca-pub-12345678',
	useSnippet: false,
	accountStatus: ACCOUNT_STATUS_READY,
	siteStatus: SITE_STATUS_READY,
	adBlockingRecoverySetupStatus: AD_BLOCKING_RECOVERY_SETUP_STATUS_TAG_PLACED,
};

export const Ready = Template.bind( {} );
Ready.storyName = 'Ready';
Ready.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( MODULES_ADSENSE )
			.receiveGetSettings( validSettings );
	},
};
Ready.parameters = {
	features: [ 'adBlockerDetection' ],
};

export const WithAdBlockingRecoveryTagEnabled = Template.bind( {} );
WithAdBlockingRecoveryTagEnabled.storyName =
	'With Ad Blocking Recovery Tag Enabled';
WithAdBlockingRecoveryTagEnabled.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( MODULES_ADSENSE ).receiveGetSettings( {
			...validSettings,
			useAdBlockerDetectionSnippet: true,
			useAdBlockerDetectionErrorSnippet: false,
		} );
	},
};
WithAdBlockingRecoveryTagEnabled.parameters = {
	features: [ 'adBlockerDetection' ],
};

export const WithBothTogglesEnabled = Template.bind( {} );
WithBothTogglesEnabled.storyName = 'With Both The Toggles Enabled';
WithBothTogglesEnabled.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( MODULES_ADSENSE ).receiveGetSettings( {
			...validSettings,
			useAdBlockerDetectionSnippet: true,
			useAdBlockerDetectionErrorSnippet: true,
		} );
	},
};
WithBothTogglesEnabled.parameters = {
	features: [ 'adBlockerDetection' ],
};

export default {
	title: 'Modules/AdSense/Components/AdBlockingRecoveryToggle',
	decorators: [
		( Story, { args } ) => {
			const setupRegistry = ( registry ) => {
				provideModules( registry, [
					{
						active: true,
						connected: true,
						slug: 'adsense',
					},
				] );

				args?.setupRegistry( registry );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
