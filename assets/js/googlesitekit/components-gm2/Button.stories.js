/**
 * Button Component Stories.
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
import Button from './Button';
import HelpIcon from '../../../svg/icons/help.svg';

function Template( args ) {
	return <Button { ...args } />;
}

export const DefaultButton = Template.bind( {} );
DefaultButton.storyName = 'Default Button';
DefaultButton.args = {
	children: 'Default Button',
	href: '#',
};

export const HoverButton = Template.bind( {} );
HoverButton.storyName = 'Default Button Hover';
HoverButton.args = {
	children: 'Default Button Hover',
	className: 'googlesitekit-button--hover',
};

export const LinkButton = Template.bind( {} );
LinkButton.storyName = 'Default Button Link';
LinkButton.args = {
	children: 'Default Button Link',
	href: '#',
};

export const DangerButton = Template.bind( {} );
DangerButton.storyName = 'Danger Button';
DangerButton.args = {
	children: 'Danger Button',
	danger: true,
};

export const DisabledButton = Template.bind( {} );
DisabledButton.storyName = 'Disabled Button';
DisabledButton.args = {
	children: 'Disabled Button',
	disabled: true,
};

export const IconButton = Template.bind( {} );
IconButton.storyName = 'Icon Button with Tooltip';
IconButton.args = {
	icon: <HelpIcon width="20" height="20" />,
	'aria-label': 'Help',
	className: 'googlesitekit-button--icon',
};

export function VRTStory() {
	return (
		<div>
			<p>
				<DefaultButton { ...DefaultButton.args } />
			</p>
			<p>
				<LinkButton { ...LinkButton.args } />
			</p>
			<p>
				<DangerButton { ...DangerButton.args } />
			</p>
			<p>
				<DisabledButton { ...DisabledButton.args } />
			</p>
			<p>
				<IconButton { ...IconButton.args } />
			</p>
		</div>
	);
}
VRTStory.scenario = {
	label: 'Global/Buttons',
	hoverSelector: '.googlesitekit-button--icon',
	postInteractionWait: 3000,
	onReadyScript: 'mouse.js',
};

export default {
	title: 'Components/Button',
	component: Button,
};
