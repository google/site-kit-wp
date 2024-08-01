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
import { provideModuleRegistrations } from '../../../../../../tests/js/utils';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import SettingsEdit from './SettingsEdit';
import { publications } from '../../datastore/__fixtures__';
import {
	MODULES_READER_REVENUE_MANAGER,
	MODULE_SLUG,
} from '../../datastore/constants';
import { enabledFeatures } from '../../../../features';

function Template() {
	return <SettingsEdit />;
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';
Default.scenario = {};

export const PublicationSelected = Template.bind( {} );
PublicationSelected.storyName = 'PublicationSelected';
PublicationSelected.scenario = {};
PublicationSelected.args = {
	setupRegistry: ( registry ) => {
		const publication = publications[ 0 ];
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			// eslint-disable-next-line sitekit/acronym-case
			.setPublicationID( publication.publicationId );
	},
};

export const PublicationSelectedWithOnboardingStateNotice = Template.bind( {} );
PublicationSelectedWithOnboardingStateNotice.storyName =
	'PublicationSelectedWithOnboardingStateNotice';
PublicationSelectedWithOnboardingStateNotice.scenario = {};
PublicationSelectedWithOnboardingStateNotice.args = {
	setupRegistry: ( registry ) => {
		const publication = publications[ 1 ];
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			// eslint-disable-next-line sitekit/acronym-case
			.setPublicationID( publication.publicationId );
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			// eslint-disable-next-line sitekit/acronym-case
			.setPublicationOnboardingState( publication.onboardingState );
	},
};

export default {
	title: 'Modules/ReaderRevenueManager/Components/Settings/SettingsEdit',
	decorators: [
		( Story, { args } ) => {
			const setupRegistry = ( registry ) => {
				enabledFeatures.add( 'rrmModule' );
				const extraData = [
					{
						slug: MODULE_SLUG,
						active: true,
						connected: true,
					},
				];

				provideModuleRegistrations( registry, extraData );

				const settings = {
					ownerID: 1,
					// eslint-disable-next-line sitekit/acronym-case
					publicationID: '',
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
