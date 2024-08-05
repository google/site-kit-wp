/**
 * Reader Revenue Manager SettingsView component stories.
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
import { provideModuleRegistrations } from '../../../../../../tests/js/utils';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import { MODULES_READER_REVENUE_MANAGER } from '../../datastore/constants';
import { publications } from '../../datastore/__fixtures__';
import SettingsView from './SettingsView';

function Template() {
	return <SettingsView />;
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';
Default.scenario = {};

export const WithPendingVerificationNotice = Template.bind( {} );
WithPendingVerificationNotice.storyName = 'WithPendingVerificationNotice';
WithPendingVerificationNotice.args = {
	setupRegistry: ( registry ) => {
		const publication = publications[ 1 ];
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			// eslint-disable-next-line sitekit/acronym-case
			.setPublicationID( publication.publicationId );
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.setPublicationOnboardingState( publication.onboardingState );
	},
};
WithPendingVerificationNotice.scenario = {};

export const WithActionRequiredNotice = Template.bind( {} );
WithActionRequiredNotice.storyName = 'WithActionRequiredNotice';
WithActionRequiredNotice.args = {
	setupRegistry: ( registry ) => {
		const publication = publications[ 2 ];
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			// eslint-disable-next-line sitekit/acronym-case
			.setPublicationID( publication.publicationId );
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.setPublicationOnboardingState( publication.onboardingState );
	},
};
WithActionRequiredNotice.scenario = {};

export default {
	title: 'Modules/ReaderRevenueManager/Settings/SettingsView',
	component: SettingsView,
	decorators: [
		( Story, { args } ) => {
			const setupRegistry = ( registry ) => {
				provideModuleRegistrations( registry, [
					{
						slug: 'reader-revenue-manager',
						active: true,
						connected: true,
					},
				] );

				const settings = {
					ownerID: 1,
					publicationID: 'ABCDEFGH',
					publicationOnboardingState: '',
					publicationOnboardingStateLastSyncedAtMs: 0,
				};

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetPublications( publications );

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetSettings( settings );

				if ( args?.setupRegistry ) {
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
