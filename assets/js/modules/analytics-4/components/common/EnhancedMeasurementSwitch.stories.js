/**
 * EnhancedMeasurementSwitch Component Stories.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import EnhancedMeasurementSwitch from './EnhancedMeasurementSwitch';

function Template( args ) {
	return <EnhancedMeasurementSwitch { ...args } />;
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';
Default.scenario = {};

export const Disabled = Template.bind( {} );
Disabled.args = {
	disabled: true,
};
Disabled.scenario = {};

export const StreamAlreadyEnabled = Template.bind( {} );
StreamAlreadyEnabled.args = {
	isEnhancedMeasurementAlreadyEnabled: true,
};
StreamAlreadyEnabled.scenario = {};

export const Loading = Template.bind( {} );
Loading.args = {
	loading: true,
};
Loading.scenario = {};

export default {
	title: 'Modules/Analytics4/Components/EnhancedMeasurementSwitch',
	component: EnhancedMeasurementSwitch,
};
