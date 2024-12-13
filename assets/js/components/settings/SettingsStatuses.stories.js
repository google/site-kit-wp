/**
 * SettingsStatuses component stories.
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
import SettingsStatuses from './SettingsStatuses';

function Template( args ) {
	return (
		<div className="googlesitekit-plugin">
			<div className="googlesitekit-settings-module">
				<SettingsStatuses { ...args } />
			</div>
		</div>
	);
}

export const Default = Template.bind( null );
Default.storyName = 'Default';
Default.args = {
	statuses: [
		{
			label: 'Label 1',
			status: true,
		},
		{
			label: 'Label 2',
			status: false,
		},
	],
};

export const LoadingValue = Template.bind( null );
LoadingValue.storyName = 'Loading Value';
LoadingValue.args = {
	statuses: [
		{
			label: 'Label 1',
			status: undefined,
		},
		{
			label: 'Label 2',
			status: false,
		},
	],
};

export default {
	title: 'Components/SettingsStatuses',
	component: SettingsStatuses,
};
