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
import { AUDIENCE_INFO_NOTICE_SLUG } from './constants';
import { CORE_USER } from '../../../../../../googlesitekit/datastore/user/constants';
import { provideModules } from '../../../../../../../../tests/js/utils';
import WithRegistrySetup from '../../../../../../../../tests/js/WithRegistrySetup';
import { withWidgetComponentProps } from '../../../../../../googlesitekit/widgets/util';

const WidgetWithComponentProps =
	withWidgetComponentProps( 'InfoNoticeWidget' )( InfoNoticeWidget );

function Template() {
	return <WidgetWithComponentProps />;
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';
Default.scenario = {
	label: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/InfoNoticeWidget/Default',
};
Default.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( [] );
	},
};

export const FirstDismissal = Template.bind( {} );
FirstDismissal.storyName = 'Two weeks after first dismissal';
FirstDismissal.scenario = {
	label: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/InfoNoticeWidget/Dismissed',
};
FirstDismissal.args = {
	setupRegistry: async ( registry ) => {
		const timestamp = Math.floor( Date.now() / 1000 );
		await registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {
			[ AUDIENCE_INFO_NOTICE_SLUG ]: {
				expires: timestamp - 1,
				count: 1,
			},
		} );
	},
};

export const SecondDismissal = Template.bind( {} );
SecondDismissal.storyName = 'Two weeks after second dismissal';
SecondDismissal.scenario = {
	label: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/InfoNoticeWidget/Dismissed',
};
SecondDismissal.args = {
	setupRegistry: async ( registry ) => {
		const timestamp = Math.floor( Date.now() / 1000 );
		await registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {
			[ AUDIENCE_INFO_NOTICE_SLUG ]: {
				expires: timestamp - 1,
				count: 2,
			},
		} );
	},
};

export default {
	title: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/InfoNoticeWidget',
	decorators: [
		( Story, { args } ) => {
			const setupRegistry = async ( registry ) => {
				provideModules( registry, [
					{
						active: true,
						connected: true,
						slug: 'analytics-4',
					},
				] );
				await args?.setupRegistry( registry );
			};
			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
