/**
 * Page Header Stories.
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
import AnalyticsIcon from './../../svg/graphics/analytics.svg';
import PageHeader from './PageHeader';

function Template( args ) {
	return <PageHeader { ...args } />;
}

export const Connected = Template.bind( {} );
Connected.storyName = 'Connected';
Connected.args = {
	title: 'Module Page Title',
	status: 'connected',
	statusText: 'Analytics is connected',
};

export const NotConnectedWithIcon = Template.bind( {} );
NotConnectedWithIcon.storyName = 'Not Connected with Icon';
NotConnectedWithIcon.args = {
	title: 'Module Page Title with Icon',
	icon: (
		<AnalyticsIcon
			className="googlesitekit-page-header__icon"
			width={ 23 }
			height={ 26 }
		/>
	),
	status: 'not-connected',
	statusText: 'Analytics is not connected',
};

export function VRTStory() {
	return (
		<div>
			<p>
				<Connected { ...Connected.args } />
			</p>
			<p>
				<NotConnectedWithIcon { ...NotConnectedWithIcon.args } />
			</p>
		</div>
	);
}

VRTStory.storyName = 'All Page Headers VRT';
VRTStory.scenario = {
	label: 'Global/Page Headers',
};

export default {
	title: 'Global/Page Headers',
	component: PageHeader,
};
