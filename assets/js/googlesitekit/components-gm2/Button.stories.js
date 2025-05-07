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

export const TertiaryButton = Template.bind( {} );
TertiaryButton.storyName = 'Tertiary Button';
TertiaryButton.args = {
	children: 'Tertiary Button',
	tertiary: true,
};

export const IconButton = Template.bind( {} );
IconButton.storyName = 'Icon Button with Tooltip';
IconButton.args = {
	icon: <HelpIcon width="20" height="20" />,
	'aria-label': 'Help',
	className: 'googlesitekit-button--icon',
};

export const CalloutButton = Template.bind( {} );
CalloutButton.storyName = 'Callout Button';
CalloutButton.args = {
	children: 'Callout Button',
	callout: true,
};

export const DisabledCalloutButton = Template.bind( {} );
DisabledCalloutButton.storyName = 'Disabled Callout Button';
DisabledCalloutButton.args = {
	children: 'Disabled Callout Button',
	callout: true,
	disabled: true,
};

export const CalloutWarningButton = Template.bind( {} );
CalloutWarningButton.storyName = 'Callout Warning Button';
CalloutWarningButton.args = {
	children: 'Callout Warning',
	callout: true,
	calloutStyle: 'warning',
};

export const DisabledCalloutWarningButton = Template.bind( {} );
DisabledCalloutWarningButton.storyName = 'Disabled Callout Warning Button';
DisabledCalloutWarningButton.args = {
	children: 'Disabled Warning Callout Button',
	callout: true,
	calloutStyle: 'warning',
	disabled: true,
};

export const CalloutErrorButton = Template.bind( {} );
CalloutErrorButton.storyName = 'Callout Error Button';
CalloutErrorButton.args = {
	children: 'Callout Error Button',
	callout: true,
	calloutStyle: 'error',
};

export const DisabledCalloutErrorButton = Template.bind( {} );
DisabledCalloutErrorButton.storyName = 'Disabled Callout Error Button';
DisabledCalloutErrorButton.args = {
	children: 'Disabled Error Callout Button',
	callout: true,
	calloutStyle: 'error',
	disabled: true,
};

export function VRTStory() {
	const buttonStories = [
		DefaultButton,
		LinkButton,
		DangerButton,
		DisabledButton,
		TertiaryButton,
		CalloutButton,
		CalloutWarningButton,
		CalloutErrorButton,
		DisabledCalloutButton,
		DisabledCalloutWarningButton,
		DisabledCalloutErrorButton,
		IconButton,
	];

	return (
		<div>
			{ buttonStories.map( ( ButtonStory, index ) => (
				<p key={ index }>
					<ButtonStory { ...ButtonStory.args } />
				</p>
			) ) }
		</div>
	);
}
VRTStory.storyName = 'All Buttons VRT';
VRTStory.scenario = {
	hoverSelector: '.googlesitekit-button--icon',
	postInteractionWait: 3000,
	onReadyScript: 'mouse.js',
};

export default {
	title: 'Components/Button',
	component: Button,
};
