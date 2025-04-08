/**
 * AudienceSegmentationIntroductoryOverlayNotification component stories.
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
	provideModules,
	provideUserInfo,
} from '../../../../../../../tests/js/utils';
import WithRegistrySetup from '../../../../../../../tests/js/WithRegistrySetup';
import { Provider as ViewContextProvider } from '../../../../../components/Root/ViewContextContext';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../../../../googlesitekit/constants';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4 } from '../../../datastore/constants';
import AudienceSegmentationIntroductoryOverlayNotification from './AudienceSegmentationIntroductoryOverlayNotification';

function Template() {
	return <AudienceSegmentationIntroductoryOverlayNotification />;
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';

export default {
	title: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/AudienceSegmentationIntroductoryOverlayNotification',
	decorators: [
		( Story ) => {
			const setupRegistry = ( registry ) => {
				provideUserInfo( registry );
				provideModules( registry, [
					{
						slug: 'analytics-4',
						active: true,
						connected: true,
						setupComplete: true,
					},
				] );

				const userID = registry.select( CORE_USER ).getID();

				// User ID should be other than the one who setup the module.
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setAudienceSegmentationSetupCompletedBy( userID + 1 );

				registry.dispatch( CORE_USER ).receiveGetUserAudienceSettings( {
					configuredAudiences: [],
					isAudienceSegmentationWidgetHidden: false,
					didSetAudiences: true,
				} );
			};
			return (
				<WithRegistrySetup func={ setupRegistry }>
					<ViewContextProvider value={ VIEW_CONTEXT_MAIN_DASHBOARD }>
						<Story />
					</ViewContextProvider>
				</WithRegistrySetup>
			);
		},
	],
};
