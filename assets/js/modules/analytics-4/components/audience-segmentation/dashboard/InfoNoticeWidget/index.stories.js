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
import WithRegistrySetup from '../../../../../../../../tests/js/WithRegistrySetup';
import { provideModules } from '../../../../../../../../tests/js/utils';
import { CORE_USER } from '../../../../../../googlesitekit/datastore/user/constants';
import { withWidgetComponentProps } from '../../../../../../googlesitekit/widgets/util';
import { availableAudiences } from '../../../../datastore/__fixtures__';
import { MODULES_ANALYTICS_4 } from '../../../../datastore/constants';
import { AUDIENCE_INFO_NOTICE_SLUG } from './constants';

const WidgetWithComponentProps =
	withWidgetComponentProps( 'InfoNoticeWidget' )( InfoNoticeWidget );

function Template() {
	return <WidgetWithComponentProps />;
}

const expires = Math.floor( Date.now() / 1000 ) - 1;

export const Default = Template.bind( {} );
Default.storyName = 'Default';
Default.scenario = {};
Default.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( [] );
	},
};

export const FirstDismissal = Template.bind( {} );
FirstDismissal.storyName = 'Two weeks after first dismissal';
FirstDismissal.scenario = {};
FirstDismissal.args = {
	setupRegistry: async ( registry ) => {
		await registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {
			[ AUDIENCE_INFO_NOTICE_SLUG ]: {
				expires,
				count: 1,
			},
		} );
	},
};

export const SecondDismissal = Template.bind( {} );
SecondDismissal.storyName = 'Two weeks after second dismissal';
SecondDismissal.scenario = {};
SecondDismissal.args = {
	setupRegistry: async ( registry ) => {
		await registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {
			[ AUDIENCE_INFO_NOTICE_SLUG ]: {
				expires,
				count: 2,
			},
		} );
	},
};

export const ThirdDismissal = Template.bind( {} );
ThirdDismissal.storyName = 'Two weeks after third dismissal';
ThirdDismissal.scenario = {};
ThirdDismissal.args = {
	setupRegistry: async ( registry ) => {
		await registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {
			[ AUDIENCE_INFO_NOTICE_SLUG ]: {
				expires,
				count: 3,
			},
		} );
	},
};

export const FourthDismissal = Template.bind( {} );
FourthDismissal.storyName = 'Two weeks after fourth dismissal';
FourthDismissal.scenario = {};
FourthDismissal.args = {
	setupRegistry: async ( registry ) => {
		await registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {
			[ AUDIENCE_INFO_NOTICE_SLUG ]: {
				expires,
				count: 4,
			},
		} );
	},
};

export const FifthDismissal = Template.bind( {} );
FifthDismissal.storyName = 'Two weeks after fifth dismissal';
FifthDismissal.scenario = {};
FifthDismissal.args = {
	setupRegistry: async ( registry ) => {
		await registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {
			[ AUDIENCE_INFO_NOTICE_SLUG ]: {
				expires,
				count: 5,
			},
		} );
	},
};

export const SixthDismissal = Template.bind( {} );
SixthDismissal.storyName = 'Two weeks after sixth dismissal';
SixthDismissal.scenario = {};
SixthDismissal.args = {
	setupRegistry: async ( registry ) => {
		await registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {
			[ AUDIENCE_INFO_NOTICE_SLUG ]: {
				expires,
				count: 6,
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
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetSettings( {} );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setAvailableAudiences( availableAudiences );

				registry.dispatch( CORE_USER ).receiveGetUserAudienceSettings( {
					configuredAudiences: [ 'properties/12345/audiences/1' ],
					isAudienceSegmentationWidgetHidden: false,
				} );
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
