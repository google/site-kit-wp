/**
 * Link Component Stories.
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
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import PencilIcon from './../../svg/icons/pencil-alt.svg';
import Link from './Link';
import VisuallyHidden from './VisuallyHidden';

function Template( args ) {
	const { children, ...rest } = args;
	return (
		<p>
			<Link { ...rest }>{ children }</Link>
		</p>
	);
}

export const Default = Template.bind( {} );
Default.args = {
	href: 'http://google.com',
	children: 'Default Link',
};

export const DefaultLinkHovered = Template.bind( {} );
DefaultLinkHovered.args = {
	href: 'http://google.com',
	children: 'VRT: Default Link Hovered',
	className: 'googlesitekit-cta-link--hover',
};

export const Secondary = Template.bind( {} );
Secondary.args = {
	href: 'http://google.com',
	children: 'Secondary Link',
	secondary: true,
};

export const SecondaryLinkHovered = Template.bind( {} );
SecondaryLinkHovered.args = {
	href: 'http://google.com',
	children: 'VRT: Secondary Link Hovered',
	className: 'googlesitekit-cta-link--hover',
	secondary: true,
};

export const LinkButton = Template.bind( {} );
LinkButton.args = {
	onClick: () => {},
	children: 'Default Link Button',
};

export const LinkButtonHovered = Template.bind( {} );
LinkButtonHovered.args = {
	onClick: () => {},
	children: 'Default Link Button Hovered',
	className: 'googlesitekit-cta-link--hover',
};

export const LinkButtonWithIconPrefix = Template.bind( {} );
LinkButtonWithIconPrefix.args = {
	onClick: () => {},
	children: 'Default Link Button With Icon Prefix',
	leadingIcon: <PencilIcon width={ 18 } height={ 18 } />,
};

export const LinkButtonWithIconPrefixHovered = Template.bind( {} );
LinkButtonWithIconPrefixHovered.args = {
	onClick: () => {},
	children: 'VRT: Default Link Button With Icon Prefix Hovered',
	className: 'googlesitekit-cta-link--hover',
	leadingIcon: <PencilIcon width={ 18 } height={ 18 } />,
};

export const LinkButtonWithIconSuffix = Template.bind( {} );
LinkButtonWithIconSuffix.args = {
	onClick: () => {},
	children: 'Default Link Button With Icon Suffix',
	trailingIcon: <PencilIcon width={ 18 } height={ 18 } />,
};

export const LinkButtonWithIconSuffixHovered = Template.bind( {} );
LinkButtonWithIconSuffixHovered.args = {
	onClick: () => {},
	children: 'VRT: Default Link Button With Icon Suffix Hovered',
	className: 'googlesitekit-cta-link--hover',
	trailingIcon: <PencilIcon width={ 18 } height={ 18 } />,
};

export const SecondaryLinkButton = Template.bind( {} );
SecondaryLinkButton.args = {
	onClick: () => {},
	children: 'Secondary Link Button',
	secondary: true,
};

export const SecondaryLinkButtonHovered = Template.bind( {} );
SecondaryLinkButtonHovered.args = {
	onClick: () => {},
	children: 'VRT: Secondary Link Button Hovered',
	className: 'googlesitekit-cta-link--hover',
	secondary: true,
};

export const SecondaryLinkButtonWithIconPrefix = Template.bind( {} );
SecondaryLinkButtonWithIconPrefix.args = {
	onClick: () => {},
	children: 'Secondary Link Button With Icon',
	leadingIcon: <PencilIcon width={ 18 } height={ 18 } />,
	secondary: true,
};

export const SecondaryLinkButtonWithIconPrefixHovered = Template.bind( {} );
SecondaryLinkButtonWithIconPrefixHovered.args = {
	onClick: () => {},
	children: 'VRT: Secondary Link Button With Icon Hovered',
	className: 'googlesitekit-cta-link--hover',
	leadingIcon: <PencilIcon width={ 18 } height={ 18 } />,
	secondary: true,
};

export const SmallLink = Template.bind( {} );
SmallLink.args = {
	href: 'http://google.com',
	children: 'Small Link',
	small: true,
};

export const InverseLink = Template.bind( {} );
InverseLink.args = {
	href: 'http://google.com',
	children: 'Inverse Link',
	inverse: true,
};

export const BackLink = Template.bind( {} );
BackLink.args = {
	href: 'http://google.com',
	children: 'Back Link',
	back: true,
};

export const ExternalLink = Template.bind( {} );
ExternalLink.args = {
	href: 'http://google.com',
	children: 'External Link',
	external: true,
};

export const ExternalLinkWithVisuallyHiddenContent = Template.bind( {} );
ExternalLinkWithVisuallyHiddenContent.args = {
	href: 'http://google.com',
	children: (
		<Fragment>
			External <VisuallyHidden>I am hiding </VisuallyHidden>
			Link with VisuallyHidden content
		</Fragment>
	),
	external: true,
};

export const AllCapsLink = Template.bind( {} );
AllCapsLink.args = {
	href: 'http://google.com',
	children: 'All Caps Link',
	caps: true,
};

export const AllCapsLinkWithArrow = Template.bind( {} );
AllCapsLinkWithArrow.args = {
	href: 'http://google.com',
	children: 'All Caps Link With Arrow',
	caps: true,
	arrow: true,
};

export const InverseAllCapsLinkWithArrow = Template.bind( {} );
InverseAllCapsLinkWithArrow.args = {
	href: 'http://google.com',
	children: 'Inverse All Caps Link With Arrow',
	caps: true,
	arrow: true,
	inverse: true,
};

export const DangerLink = Template.bind( {} );
DangerLink.args = {
	href: 'http://google.com',
	children: 'Danger Link',
	danger: true,
};

export const DisabledLink = Template.bind( {} );
DisabledLink.args = {
	href: 'http://google.com',
	children: 'Disabled Link',
	disabled: true,
};

export function VRTStory() {
	const linkStories = [
		Default,
		DefaultLinkHovered,
		Secondary,
		SecondaryLinkHovered,
		LinkButton,
		LinkButtonHovered,
		LinkButtonWithIconPrefix,
		LinkButtonWithIconPrefixHovered,
		LinkButtonWithIconSuffix,
		LinkButtonWithIconSuffixHovered,
		SecondaryLinkButton,
		SecondaryLinkButtonHovered,
		SecondaryLinkButtonWithIconPrefix,
		SecondaryLinkButtonWithIconPrefixHovered,
		SmallLink,
		InverseLink,
		BackLink,
		ExternalLink,
		ExternalLinkWithVisuallyHiddenContent,
		AllCapsLink,
		AllCapsLinkWithArrow,
		InverseAllCapsLinkWithArrow,
		DangerLink,
		DisabledLink,
	];

	return (
		<div>
			{ linkStories.map( ( Story, index ) => (
				<p key={ index }>
					<Story { ...Story.args } />
				</p>
			) ) }
		</div>
	);
}
VRTStory.storyName = 'All Links VRT';
VRTStory.scenario = {
	hoverSelector: '.googlesitekit-cta-link--hover',
	postInteractionWait: 1000,
	onReadyScript: 'mouse.js',
};

export default {
	title: 'Components/Link',
	component: Link,
};
