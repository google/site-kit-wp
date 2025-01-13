/**
 * SettingsApp stories.
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
import SettingsApp from './SettingsApp';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../googlesitekit/constants';
import { Provider as ViewContextProvider } from '../Root/ViewContextContext';

function Template() {
	return (
		<ViewContextProvider value={ VIEW_CONTEXT_MAIN_DASHBOARD }>
			<SettingsApp />
		</ViewContextProvider>
	);
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';
Default.scenario = {
	label: 'Settings/Settings Tabs',
	delay: 3000, // Wait for tabs to animate.
};

export default {
	title: 'Components/SettingsApp',
	component: SettingsApp,
};
