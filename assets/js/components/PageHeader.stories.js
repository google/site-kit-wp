/**
 * Page Header Stories.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
	return (
		<div>
			<p>
				<PageHeader { ...args } />
			</p>
		</div>
	);
}

export const Connected = Template.bind( {} );
Connected.args = {
	title: 'Module Page Title',
	status: 'connected',
	statusText: 'Analytics is connected',
};

export const NotConnectedWithIcon = Template.bind( {} );
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

export default {
	title: 'Global/PageHeader',
	component: PageHeader,
};
