/**
 * Google Tag Gateway Toggle component stories.
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
import { freezeFetch } from '../../../../tests/js/utils';
import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';
import GoogleTagGatewayToggle from './GoogleTagGatewayToggle';

function Template() {
	return (
		<div className="googlesitekit-module-settings-group">
			<GoogleTagGatewayToggle />
		</div>
	);
}

const serverRequirementStatusEndpoint = new RegExp(
	'^/google-site-kit/v1/core/site/data/gtg-server-requirement-status'
);
const gtgSettingsEndpoint = new RegExp(
	'^/google-site-kit/v1/core/site/data/gtg-settings'
);

const defaultServerRequirementStatus = {
	isEnabled: true,
	isGTGHealthy: true,
	isScriptAccessEnabled: true,
};

const defaultGTGSettings = {
	isEnabled: false,
	isGTGHealthy: true,
	isScriptAccessEnabled: true,
};

export const Default = Template.bind( {} );
Default.storyName = 'Default';
Default.args = {
	setupRegistry: () => {
		fetchMock.getOnce( serverRequirementStatusEndpoint, {
			body: defaultServerRequirementStatus,
			status: 200,
		} );
	},
};
Default.scenario = {};

export const ServerRequirementsFail = Template.bind( {} );
ServerRequirementsFail.storyName = 'Server requirements fail';
ServerRequirementsFail.args = {
	setupRegistry: () => {
		fetchMock.getOnce( serverRequirementStatusEndpoint, {
			body: {
				isEnabled: false,
				isGTGHealthy: false,
				isScriptAccessEnabled: false,
			},
			status: 200,
		} );
	},
};
ServerRequirementsFail.scenario = {};

export const ServerRequirementsLoading = Template.bind( {} );
ServerRequirementsLoading.storyName = 'Server requirements loading';
ServerRequirementsLoading.args = {
	setupRegistry: () => {
		freezeFetch( serverRequirementStatusEndpoint );
	},
};

export default {
	title: 'Components/Google Tag Gateway/GoogleTagGatewayToggle',
	component: GoogleTagGatewayToggle,
	decorators: [
		( Story, { args } ) => {
			fetchMock.reset();
			// The toggle also resolves Google Tag Gateway settings via
			// CORE_SITE; provide a shared mock so each story variant
			// doesn't need to repeat it.
			fetchMock.get( gtgSettingsEndpoint, {
				body: defaultGTGSettings,
				status: 200,
			} );
			return (
				<WithRegistrySetup
					func={ ( registry ) => args.setupRegistry?.( registry ) }
				>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
