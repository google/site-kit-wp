/**
 * OfflineNotification Component Stories.
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
} from '../../../../tests/js/utils';
import OfflineNotification from './OfflineNotification';
import { CORE_UI } from '../../googlesitekit/datastore/ui/constants';

function Template() {
	return <OfflineNotification />;
}

export const Site = Template.bind( {} );
Site.storyName = 'Offline Notification';
Site.scenario = {
	label: 'Global/OfflineNotification',
};

export default {
	title: 'Components/OfflineNotification',
	component: OfflineNotification,
	decorators: [
		( Story ) => {
			const registry = createTestRegistry();

			registry.dispatch( CORE_UI ).setIsOnline( false );

			return (
				<WithTestRegistry registry={ registry }>
					<Story />
				</WithTestRegistry>
			);
		},
	],
};
