/**
 * JoyrideTooltip Component Stories.
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
import { Button } from 'googlesitekit-components';
import JoyrideTooltip from './JoyrideTooltip';

function Template( args ) {
	return <JoyrideTooltip { ...args } />;
}

export const DefaultTooltip = Template.bind( {} );
DefaultTooltip.storyName = 'Default Tooltip';
DefaultTooltip.args = {
	title: 'Tooltip title',
	content:
		'This is an example of some Tooltip content, to be displayed in the Tooltip content area.',
	dismissLabel: 'Got it',
	target: '.target',
};
DefaultTooltip.scenario = {
	label: 'Global/JoyrideTooltip/DefaultTooltip',
	delay: 1000,
};

export default {
	title: 'Components/JoyrideTooltip',
	component: JoyrideTooltip,
	decorators: [
		( Story ) => {
			return (
				<div>
					<Button className="target">A button</Button>
					<Story />
				</div>
			);
		},
	],
};
