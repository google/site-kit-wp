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
// TODO: re-enable scenarios as part of follow up issue.
// DefaultTooltip.scenario = {
// 	delay: 200, // Slight delays are required to ensure the tooltip is fully rendered even with animations disabled.
// };

export const PlacementTooltip = Template.bind( {} );
PlacementTooltip.storyName = 'Tooltip with Custom Placement';
PlacementTooltip.args = {
	title: 'Tooltip with Bottom Placement',
	content: 'This tooltip is positioned at the bottom of the target element.',
	dismissLabel: 'Got it',
	target: '.target',
	placement: 'bottom',
};
// TODO: re-enable scenarios as part of follow up issue.
// PlacementTooltip.scenario = {
// 	delay: 200,
// };

export const MobileModalTooltip = Template.bind( {} );
MobileModalTooltip.storyName = 'Mobile Modal Tooltip';
MobileModalTooltip.args = {
	title: 'Mobile Modal Style Tooltip',
	content:
		'This tooltip is displayed as modals are displayed on mobile and tablet viewports targeting the body element with a visible overlay.',
	dismissLabel: 'Got it',
	target: 'body',
	placement: 'center',
	className: 'googlesitekit-tour-tooltip__modal_step',
	disableOverlay: false,
};
// TODO: re-enable scenarios as part of follow up issue.
// MobileModalTooltip.scenario = {
// 	delay: 200,
// };

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
	parameters: {
		padding: 'calc((100vh - 40px) / 2) calc((100vw - 88px) / 2)',
	},
};
