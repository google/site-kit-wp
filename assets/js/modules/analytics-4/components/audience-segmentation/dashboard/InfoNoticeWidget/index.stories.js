/**
 * InfoNoticeWidget Component Stories.
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
 * Internal dependencies.
 */
import InfoNoticeWidget from '.';
import { AUDIENCE_INFO_NOTICE_SLUG, AUDIENCE_INFO_NOTICES } from './constant';

import {
	WithTestRegistry,
	createTestRegistry,
	provideModules,
	provideModuleRegistrations,
	provideUserInfo,
} from '../../../../../../../../tests/js/utils';

import WithRegistrySetup from '../../../../../../../../tests/js/WithRegistrySetup';
import { withWidgetComponentProps } from '../../../../../../googlesitekit/widgets/util';
import { CORE_USER } from '../../../../../../googlesitekit/datastore/user/constants';

const WidgetWithComponentProps =
	withWidgetComponentProps( 'InfoNoticeWidget' )( InfoNoticeWidget );

function Template( { setupRegistry = async () => {} } ) {
	const setupRegistryCallback = async ( registry ) => {
		provideModules( registry, [
			{
				active: true,
				connected: true,
				slug: 'analytics-4',
			},
		] );
		provideModuleRegistrations( registry );
		provideUserInfo( registry );
		await setupRegistry( registry );
	};
	return (
		<WithRegistrySetup func={ setupRegistryCallback }>
			<WidgetWithComponentProps />
		</WithRegistrySetup>
	);
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';
Default.scenario = {
	label: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/InfoNoticeWidget/Default',
};

export const Dismissed = Template.bind( {} );
Dismissed.storyName = 'Permanently Dismissed';
Dismissed.scenario = {
	label: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/InfoNoticeWidget/Dismissed',
};
Dismissed.args = {
	setupRegistry: async ( registry ) => {
		await registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {
			[ AUDIENCE_INFO_NOTICE_SLUG ]: {
				expires: 0,
				count: AUDIENCE_INFO_NOTICES.length,
			},
		} );
	},
};

export default {
	title: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/InfoNoticeWidget',
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
