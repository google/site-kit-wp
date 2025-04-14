/**
 * Tooltip Component Stories.
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
import Button from './Button';
import Tooltip from './Tooltip';

function Template( args ) {
	return <Tooltip { ...args } />;
}

export const DefaultTooltip = Template.bind( {} );
DefaultTooltip.storyName = 'Default Tooltip';
DefaultTooltip.args = {
	title: 'This is an example of Tooltip content.',
	children: <Button>A button</Button>,
	open: true,
};
DefaultTooltip.scenario = {
	delay: 250,
};

export default {
	title: 'Components/Tooltip',
	component: Tooltip,
};
