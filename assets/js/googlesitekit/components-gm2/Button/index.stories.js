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
import Button from '@/js/googlesitekit/components-gm2/Button';
import HelpIcon from '@/svg/icons/help.svg';

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
	className: 'googlesitekit-vrt-button-hover',
};
HoverButton.parameters = {
	pseudo: { hover: true },
};

export const DefaultButtonFocus = Template.bind( {} );
DefaultButtonFocus.storyName = 'Default Button Focus';
DefaultButtonFocus.args = {
	...DefaultButton.args,
	children: 'Default Button Focus',
	className:
		'googlesitekit-vrt-button-focus mdc-ripple-upgraded--background-focused',
};
DefaultButtonFocus.parameters = {
	pseudo: { focus: true },
};

export const LinkButton = Template.bind( {} );
LinkButton.storyName = 'Default Button Link';
LinkButton.args = {
	children: 'Default Button Link',
	href: '#',
};

export const LinkButtonHover = Template.bind( {} );
LinkButtonHover.storyName = 'Default Button Link Hover';
LinkButtonHover.args = {
	...LinkButton.args,
	children: 'Default Button Link Hover',
	className: 'googlesitekit-vrt-button-hover',
};
LinkButtonHover.parameters = {
	pseudo: { hover: true },
};

export const LinkButtonFocus = Template.bind( {} );
LinkButtonFocus.storyName = 'Default Button Link Focus';
LinkButtonFocus.args = {
	...LinkButton.args,
	children: 'Default Button Link Focus',
	className:
		'googlesitekit-vrt-button-focus mdc-ripple-upgraded--background-focused',
};
LinkButtonFocus.parameters = {
	pseudo: { focus: true },
};

export const DangerButton = Template.bind( {} );
DangerButton.storyName = 'Danger Button';
DangerButton.args = {
	children: 'Danger Button',
	danger: true,
};

export const DangerButtonHover = Template.bind( {} );
DangerButtonHover.storyName = 'Danger Button Hover';
DangerButtonHover.args = {
	...DangerButton.args,
	children: 'Danger Button Hover',
	className: 'googlesitekit-vrt-button-hover',
};
DangerButtonHover.parameters = {
	pseudo: { hover: true },
};

export const DangerButtonFocus = Template.bind( {} );
DangerButtonFocus.storyName = 'Danger Button Focus';
DangerButtonFocus.args = {
	...DangerButton.args,
	children: 'Danger Button Focus',
	className:
		'googlesitekit-vrt-button-focus mdc-ripple-upgraded--background-focused',
};
DangerButtonFocus.parameters = {
	pseudo: { focus: true },
};

export const DisabledButton = Template.bind( {} );
DisabledButton.storyName = 'Disabled Button';
DisabledButton.args = {
	...DefaultButton.args,
	children: 'Disabled Button',
	disabled: true,
};

export const DisabledDangerButton = Template.bind( {} );
DisabledDangerButton.storyName = 'Disabled Danger Button';
DisabledDangerButton.args = {
	...DangerButton.args,
	children: 'Disabled Danger Button',
	disabled: true,
};

export const TertiaryButton = Template.bind( {} );
TertiaryButton.storyName = 'Tertiary Button';
TertiaryButton.args = {
	children: 'Tertiary Button',
	tertiary: true,
};

export const TertiaryButtonHover = Template.bind( {} );
TertiaryButtonHover.storyName = 'Tertiary Button Hover';
TertiaryButtonHover.args = {
	...TertiaryButton.args,
	children: 'Tertiary Button Hover',
	className: 'googlesitekit-vrt-button-hover',
};
TertiaryButtonHover.parameters = {
	pseudo: { hover: true },
};

export const TertiaryButtonFocus = Template.bind( {} );
TertiaryButtonFocus.storyName = 'Tertiary Button Focus';
TertiaryButtonFocus.args = {
	...TertiaryButton.args,
	children: 'Tertiary Button Focus',
	className:
		'googlesitekit-vrt-button-focus mdc-ripple-upgraded--background-focused',
};
TertiaryButtonFocus.parameters = {
	pseudo: { focus: true },
};

export const DisabledTertiaryButton = Template.bind( {} );
DisabledTertiaryButton.storyName = 'Disabled Tertiary Button';
DisabledTertiaryButton.args = {
	...TertiaryButton.args,
	children: 'Disabled Tertiary Button',
	disabled: true,
};

export const IconButton = Template.bind( {} );
IconButton.storyName = 'Icon Button with Tooltip';
IconButton.args = {
	icon: <HelpIcon width="20" height="20" />,
	'aria-label': 'Help',
	className: 'googlesitekit-button--icon',
};

export const IconButtonHover = Template.bind( {} );
IconButtonHover.storyName = 'Icon Button Hover';
IconButtonHover.args = {
	...IconButton.args,
	className: 'googlesitekit-button--icon googlesitekit-vrt-button-hover',
};
IconButtonHover.parameters = {
	pseudo: { hover: true },
};

export const IconButtonFocus = Template.bind( {} );
IconButtonFocus.storyName = 'Icon Button Focus';
IconButtonFocus.args = {
	...IconButton.args,
	className:
		'googlesitekit-button--icon googlesitekit-vrt-button-focus mdc-ripple-upgraded--background-focused',
};
IconButtonFocus.parameters = {
	pseudo: { focus: true },
};

export const DisabledIconButton = Template.bind( {} );
DisabledIconButton.storyName = 'Disabled Icon Button';
DisabledIconButton.args = {
	...IconButton.args,
	disabled: true,
};

export const CalloutButton = Template.bind( {} );
CalloutButton.storyName = 'Callout Button';
CalloutButton.args = {
	children: 'Callout Button',
	callout: true,
};

export const CalloutButtonHover = Template.bind( {} );
CalloutButtonHover.storyName = 'Callout Button Hover';
CalloutButtonHover.args = {
	...CalloutButton.args,
	children: 'Callout Button Hover',
	className: 'googlesitekit-vrt-button-hover',
};
CalloutButtonHover.parameters = {
	pseudo: { hover: true },
};

export const CalloutButtonFocus = Template.bind( {} );
CalloutButtonFocus.storyName = 'Callout Button Focus';
CalloutButtonFocus.args = {
	...CalloutButton.args,
	children: 'Callout Button Focus',
	className:
		'googlesitekit-vrt-button-focus mdc-ripple-upgraded--background-focused',
};
CalloutButtonFocus.parameters = {
	pseudo: { focus: true },
};

export const DisabledCalloutButton = Template.bind( {} );
DisabledCalloutButton.storyName = 'Disabled Callout Button';
DisabledCalloutButton.args = {
	...CalloutButton.args,
	children: 'Disabled Callout Button',
	disabled: true,
};

export const CalloutWarningButton = Template.bind( {} );
CalloutWarningButton.storyName = 'Callout Warning Button';
CalloutWarningButton.args = {
	children: 'Callout Warning',
	callout: true,
	calloutStyle: 'warning',
};

export const CalloutWarningButtonHover = Template.bind( {} );
CalloutWarningButtonHover.storyName = 'Callout Warning Button Hover';
CalloutWarningButtonHover.args = {
	...CalloutWarningButton.args,
	children: 'Callout Warning Button Hover',
	className: 'googlesitekit-vrt-button-hover',
};
CalloutWarningButtonHover.parameters = {
	pseudo: { hover: true },
};

export const CalloutWarningButtonFocus = Template.bind( {} );
CalloutWarningButtonFocus.storyName = 'Callout Warning Button Focus';
CalloutWarningButtonFocus.args = {
	...CalloutWarningButton.args,
	children: 'Callout Warning Button Focus',
	className:
		'googlesitekit-vrt-button-focus mdc-ripple-upgraded--background-focused',
};
CalloutWarningButtonFocus.parameters = {
	pseudo: { focus: true },
};

export const DisabledCalloutWarningButton = Template.bind( {} );
DisabledCalloutWarningButton.storyName = 'Disabled Callout Warning Button';
DisabledCalloutWarningButton.args = {
	...CalloutWarningButton.args,
	children: 'Disabled Warning Callout Button',
	disabled: true,
};

export const CalloutErrorButton = Template.bind( {} );
CalloutErrorButton.storyName = 'Callout Error Button';
CalloutErrorButton.args = {
	children: 'Callout Error Button',
	callout: true,
	calloutStyle: 'error',
};

export const CalloutErrorButtonHover = Template.bind( {} );
CalloutErrorButtonHover.storyName = 'Callout Error Button Hover';
CalloutErrorButtonHover.args = {
	...CalloutErrorButton.args,
	children: 'Callout Error Button Hover',
	className: 'googlesitekit-vrt-button-hover',
};
CalloutErrorButtonHover.parameters = {
	pseudo: { hover: true },
};

export const CalloutErrorButtonFocus = Template.bind( {} );
CalloutErrorButtonFocus.storyName = 'Callout Error Button Focus';
CalloutErrorButtonFocus.args = {
	...CalloutErrorButton.args,
	children: 'Callout Error Button Focus',
	className:
		'googlesitekit-vrt-button-focus mdc-ripple-upgraded--background-focused',
};
CalloutErrorButtonFocus.parameters = {
	pseudo: { focus: true },
};

export const DisabledCalloutErrorButton = Template.bind( {} );
DisabledCalloutErrorButton.storyName = 'Disabled Callout Error Button';
DisabledCalloutErrorButton.args = {
	...CalloutErrorButton.args,
	children: 'Disabled Error Callout Button',
	disabled: true,
};

export function VRTStory() {
	const buttonStories = [
		DefaultButton,
		HoverButton,
		DefaultButtonFocus,
		DisabledButton,
		LinkButton,
		LinkButtonHover,
		LinkButtonFocus,
		DangerButton,
		DangerButtonHover,
		DangerButtonFocus,
		DisabledDangerButton,
		TertiaryButton,
		TertiaryButtonHover,
		TertiaryButtonFocus,
		DisabledTertiaryButton,
		CalloutButton,
		CalloutButtonHover,
		CalloutButtonFocus,
		DisabledCalloutButton,
		CalloutWarningButton,
		CalloutWarningButtonHover,
		CalloutWarningButtonFocus,
		DisabledCalloutWarningButton,
		CalloutErrorButton,
		CalloutErrorButtonHover,
		CalloutErrorButtonFocus,
		DisabledCalloutErrorButton,
		IconButton,
		IconButtonHover,
		IconButtonFocus,
		DisabledIconButton,
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
	// Target only the base Icon Button: the hover/focus VRT stories share
	// the icon class but must keep using CSS-forced pseudo-states, not the
	// real pointer hover used to open the tooltip on the default variant.
	hoverSelector:
		'.googlesitekit-button--icon:not(.googlesitekit-vrt-button-hover):not(.googlesitekit-vrt-button-focus):not(:disabled)',
	postInteractionWait: 3000,
	onReadyScript: 'mouse.js',
};
VRTStory.parameters = {
	pseudo: {
		hover: [ '.googlesitekit-vrt-button-hover' ],
		focus: [ '.googlesitekit-vrt-button-focus' ],
	},
};

export default {
	title: 'Components/Button',
	component: Button,
};
