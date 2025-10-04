/**
 * SetupUsingProxyWithSignIn StepHint component stories.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import StepHint from './index';

function Template( args ) {
	return <StepHint { ...args } />;
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';
Default.args = {
	leadingText: 'Why is this required?',
	tooltipText:
		'Site Kit needs to connect to your Google account to access data from Google products like Search Console or Analytics and display it on your dashboard.',
};

export default {
	title: 'Setup/StepHint',
	component: StepHint,
	decorators: [
		( Story ) => (
			<div className="googlesitekit-setup">
				<Story />
			</div>
		),
	],
};
