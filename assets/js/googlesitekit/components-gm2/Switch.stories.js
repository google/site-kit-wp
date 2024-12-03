/**
 * Switch Component Stories.
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
import { Switch } from 'googlesitekit-components';

function Template( args ) {
	return <Switch { ...args } />;
}

export const Unswitched = Template.bind( {} );
Unswitched.args = {
	id: 'switch-story',
	label: 'Unswitched',
	hideLabel: false,
};

export const Switched = Template.bind( {} );
Switched.args = {
	id: 'switch-story',
	label: 'Switched',
	hideLabel: false,
	checked: true,
};

export const HiddenLabel = Template.bind( {} );
HiddenLabel.args = {
	id: 'switch-story',
	label: 'Hidden Label',
	checked: true,
};

export default {
	title: 'Components/Switch',
	component: Switch,
};
