/**
 * Audience Creation Success Notice Component Stories.
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
import WithRegistrySetup from '../../../../../../../../tests/js/WithRegistrySetup';
import { CORE_UI } from '../../../../../../googlesitekit/datastore/ui/constants';
import AudienceCreationSuccessNotice from './AudienceCreationSuccessNotice';
import { AUDIENCE_CREATION_SUCCESS_NOTICE_SLUG } from './constants';

function Template() {
	return <AudienceCreationSuccessNotice />;
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';
Default.scenario = {
	label: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/AudienceCreationSuccessNotice/Default',
};

export default {
	title: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/AudienceCreationSuccessNotice',
	component: AudienceCreationSuccessNotice,
	decorators: [
		( Story ) => {
			const setupRegistry = ( registry ) => {
				registry
					.dispatch( CORE_UI )
					.setValue( AUDIENCE_CREATION_SUCCESS_NOTICE_SLUG, true );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
