/**
 * PublicationApprovedOverlayNotification component stories.
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
import PublicationApprovedOverlayNotification from './PublicationApprovedOverlayNotification';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import { CORE_UI } from '../../../../googlesitekit/datastore/ui/constants';
import {
	MODULES_READER_REVENUE_MANAGER,
	READER_REVENUE_MANAGER_MODULE_SLUG,
	UI_KEY_READER_REVENUE_MANAGER_SHOW_PUBLICATION_APPROVED_NOTIFICATION,
} from '../../datastore/constants';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../../../googlesitekit/constants';
import { Provider as ViewContextProvider } from '../../../../components/Root/ViewContextContext';
import { provideModules } from '../../../../../../tests/js/utils';

function Template() {
	return (
		<ViewContextProvider value={ VIEW_CONTEXT_MAIN_DASHBOARD }>
			<PublicationApprovedOverlayNotification />
		</ViewContextProvider>
	);
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';
Default.scenario = {
	label: 'Modules/ReaderRevenueManager/Components/PublicationApprovedOverlayNotification',
};

export default {
	title: 'Modules/ReaderRevenueManager/Components/PublicationApprovedOverlayNotification',
	decorators: [
		( Story, { args } ) => {
			const setupRegistry = ( registry ) => {
				provideModules( registry, [
					{
						slug: READER_REVENUE_MANAGER_MODULE_SLUG,
						active: true,
						connected: true,
						setupComplete: true,
					},
				] );

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetSettings( {
						publicationOnboardingState: 'ONBOARDING_COMPLETE',
						publicationOnboardingStateChanged: true,
					} );
				// Set the UI key to true to show the overlay notification.
				registry
					.dispatch( CORE_UI )
					.setValue(
						UI_KEY_READER_REVENUE_MANAGER_SHOW_PUBLICATION_APPROVED_NOTIFICATION,
						true
					);

				if ( args.setupRegistry ) {
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
