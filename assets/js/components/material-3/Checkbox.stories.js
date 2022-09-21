/**
 * Checkbox Component Stories.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import Checkbox from './Checkbox';

const Template = ( args ) => <Checkbox { ...args } />;

export const DefaultCheckbox = Template.bind( {} );
DefaultCheckbox.storyName = 'Default Checkbox';
DefaultCheckbox.args = {
	onChange: ( e ) => {
		global.console.log( e.target.value );
	},
	value: 'value-1',
};

export const CheckedCheckbox = Template.bind( {} );
CheckedCheckbox.storyName = 'Checked Checkbox';
CheckedCheckbox.args = {
	onChange: ( e ) => {
		global.console.log( e.target.value );
	},
	value: 'value-1',
	checked: true,
};

export const DisabledCheckbox = Template.bind( {} );
DisabledCheckbox.storyName = 'Disabled Checkbox';
DisabledCheckbox.args = {
	onChange: ( e ) => {
		global.console.log( e.target.value );
	},
	value: 'value-1',
	disabled: true,
};

export default {
	title: 'Components/Material 3/Checkbox',
	component: Checkbox,
};
