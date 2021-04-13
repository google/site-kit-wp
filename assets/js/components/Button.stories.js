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

const Template = ( args ) => <Button { ...args } />;

export const DefaultButton = () => <Button>Default Button</Button>;
DefaultButton.storyName = 'Default Button';

export const LinkButton = Template.bind( {} );
LinkButton.storyName = 'Default Button Link';
LinkButton.args = {
	children: 'Default Button Link',
	href: 'http://google.com',
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

export const HoverButton = Template.bind( {} );
HoverButton.storyName = 'Default Button Hover';
HoverButton.args = {
	children: 'VRT: Default Button Hover',
	className: 'googlesitekit-button--hover',
	options: {
		hoverSelector: '.googlesitekit-button--hover',
		postInteractionWait: 3000, // Wait for shadows to animate.
		onReadyScript: 'mouse.js',
	},
};

export default {
	title: 'Components/Button',
	component: Button,
};
