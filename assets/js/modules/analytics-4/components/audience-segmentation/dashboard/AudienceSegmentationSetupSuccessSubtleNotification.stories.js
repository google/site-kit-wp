/**
 * AudienceSegmentationSetupSuccessSubtleNotification Component Stories.
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
import { Provider as ViewContextProvider } from '../../../../../components/Root/ViewContextContext';
import AudienceSegmentationSetupSuccessSubtleNotification from './AudienceSegmentationSetupSuccessSubtleNotification';
import WithRegistrySetup from '../../../../../../../tests/js/WithRegistrySetup';
import { MODULES_ANALYTICS_4 } from '../../../../../modules/analytics-4/datastore/constants';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../../../../googlesitekit/constants';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';

function Template() {
	return (
		<ViewContextProvider value={ VIEW_CONTEXT_MAIN_DASHBOARD }>
			<AudienceSegmentationSetupSuccessSubtleNotification />
		</ViewContextProvider>
	);
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';
Default.scenario = {
	label: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/AudienceSegmentationSetupSuccessSubtleNotification',
};

export default {
	title: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/AudienceSegmentationSetupSuccessSubtleNotification',
	decorators: [
		( Story ) => {
			const setupRegistry = ( registry ) => {
				registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetAudienceSettings( {
						configuredAudiences: [ 'audienceA', 'audienceB' ],
					} );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
