/**
 * AdBlockingRecoveryApp Component Stories.
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
import WithRegistrySetup from '../../../../../../../tests/js/WithRegistrySetup';
import { provideSiteInfo } from '../../../../../../../tests/js/utils';
import {
	ENUM_AD_BLOCKING_RECOVERY_SETUP_STATUS,
	MODULES_ADSENSE,
	AD_BLOCKING_RECOVERY_SETUP_CREATE_MESSAGE_CTA_CLICKED,
} from '../../../datastore/constants';
import { CORE_UI } from '../../../../../googlesitekit/datastore/ui/constants';
import AdBlockingRecoveryApp from '.';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';

function Template() {
	return <AdBlockingRecoveryApp />;
}

export const StepOne = Template.bind( {} );
StepOne.storyName = 'Step 1';
StepOne.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( MODULES_ADSENSE ).setSettings( {
			adBlockingRecoverySetupStatus: '',
		} );
	},
};
StepOne.scenario = {
	label: 'Modules/AdSense/AdBlockingRecoveryApp/Ad Blocking Recovery Setup Step Place Tags',
	delay: 250,
};

export const StepTwo = Template.bind( {} );
StepTwo.storyName = 'Step 2';
StepTwo.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( MODULES_ADSENSE ).setSettings( {
			adBlockingRecoverySetupStatus:
				ENUM_AD_BLOCKING_RECOVERY_SETUP_STATUS.TAG_PLACED,
		} );
	},
};
StepTwo.scenario = {
	label: 'Modules/AdSense/AdBlockingRecoveryApp/Ad Blocking Recovery Setup Step Create Message',
	delay: 250,
};

export const StepTwoAfterCTAClick = Template.bind( {} );
StepTwoAfterCTAClick.storyName = 'Step 2 - After CTA Click';
StepTwoAfterCTAClick.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( MODULES_ADSENSE ).setSettings( {
			adBlockingRecoverySetupStatus:
				ENUM_AD_BLOCKING_RECOVERY_SETUP_STATUS.TAG_PLACED,
		} );

		registry.dispatch( CORE_UI ).setValues( {
			[ AD_BLOCKING_RECOVERY_SETUP_CREATE_MESSAGE_CTA_CLICKED ]: true,
		} );
	},
};
StepTwoAfterCTAClick.scenario = {
	label: 'Modules/AdSense/AdBlockingRecoveryApp/Ad Blocking Recovery Setup Step Create Message After CTA Click',
};

export const StepTwoSetupConfirmed = Template.bind( {} );
StepTwoSetupConfirmed.storyName = 'Step 2 - Setup Confirmed';
StepTwoSetupConfirmed.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( MODULES_ADSENSE ).setSettings( {
			adBlockingRecoverySetupStatus:
				ENUM_AD_BLOCKING_RECOVERY_SETUP_STATUS.SETUP_CONFIRMED,
		} );

		registry.dispatch( CORE_UI ).setValues( {
			[ AD_BLOCKING_RECOVERY_SETUP_CREATE_MESSAGE_CTA_CLICKED ]: true,
		} );
	},
};
StepTwoSetupConfirmed.scenario = {
	label: 'Modules/AdSense/AdBlockingRecoveryApp/Ad Blocking Recovery Setup Confirmed',
};

export default {
	title: ' Modules/AdSense/Components/Setup/AdBlockingRecoveryApp',
	decorators: [
		( Story, { args } ) => {
			const setupRegistry = ( registry ) => {
				provideSiteInfo( registry );

				registry
					.dispatch( CORE_USER )
					.receiveIsAdBlockerActive( false );

				args.setupRegistry?.( registry );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
	parameters: { padding: 0 },
};
