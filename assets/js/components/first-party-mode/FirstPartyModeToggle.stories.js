/**
 * First Party Mode Toggle component stories.
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
import FirstPartyModeToggle from './FirstPartyModeToggle';
import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';

function Template() {
	return (
		<div className="googlesitekit-module-settings-group">
			<FirstPartyModeToggle />
		</div>
	);
}

const serverRequirementStatusEndpoint = new RegExp(
	'^/google-site-kit/v1/core/site/data/fpm-server-requirement-status'
);

export const Default = Template.bind( {} );
Default.storyName = 'Default';
Default.scenario = {};

export const ServerRequirementsFail = Template.bind( {} );
ServerRequirementsFail.storyName = 'Server requirements fail';
ServerRequirementsFail.args = {
	setupRegistry: () => {
		fetchMock.getOnce( serverRequirementStatusEndpoint, {
			body: {
				isEnabled: null,
				isFPMHealthy: false,
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
	title: 'Components/First Party Mode/FirstPartyModeToggle',
	component: FirstPartyModeToggle,
	decorators: [
		( Story, { args } ) => {
			fetchMock.reset();
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
