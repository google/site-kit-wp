/**
 * Reader Revenue Manager SettingsEdit component stories.
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
 * Internal dependencies
 */
import {
	createTestRegistry,
	WithTestRegistry,
} from '../../../../../../tests/js/utils';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import PublicationOnboardingStateNotice from './PublicationOnboardingStateNotice';
import {
	MODULES_READER_REVENUE_MANAGER,
	PUBLICATION_ONBOARDING_STATES,
} from '../../datastore/constants';

const { PENDING_VERIFICATION, ONBOARDING_ACTION_REQUIRED } =
	PUBLICATION_ONBOARDING_STATES;

function Template( { setupRegistry = async () => {}, ...args } ) {
	const setupRegistryCallback = async ( registry ) => {
		await setupRegistry( registry );
	};

	return (
		<WithRegistrySetup func={ setupRegistryCallback }>
			<PublicationOnboardingStateNotice { ...args } />
		</WithRegistrySetup>
	);
}

export const PendingVerification = Template.bind( {} );
PendingVerification.storyName = 'PendingVerification';
PendingVerification.args = {
	setupRegistry: async ( registry ) => {
		await registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.setPublicationOnboardingState( PENDING_VERIFICATION );
	},
};
PendingVerification.scenario = {
	label: 'Modules/ReaderRevenueManager/Common/PublicationOnboardingStateNotice/PendingVerification',
};

export const ActionRequired = Template.bind( {} );
ActionRequired.storyName = 'ActionRequired';
ActionRequired.args = {
	setupRegistry: async ( registry ) => {
		await registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.setPublicationOnboardingState( ONBOARDING_ACTION_REQUIRED );
	},
};
ActionRequired.scenario = {
	label: 'Modules/ReaderRevenueManager/Common/PublicationOnboardingStateNotice/ActionRequired',
};

export default {
	title: 'Modules/ReaderRevenueManager/Common/PublicationOnboardingStateNotice',
	decorators: [
		( Story ) => {
			const registry = createTestRegistry();

			return (
				<WithTestRegistry registry={ registry }>
					<Story />
				</WithTestRegistry>
			);
		},
	],
};
