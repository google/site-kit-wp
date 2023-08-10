/**
 * Site Kit by Google, Copyright 2023 Google LLC
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
import AwardSVG from '../../../../svg/graphics/award.svg';
import BannerNotification from './index';

function Template( { ...args } ) {
	return <BannerNotification { ...args } />;
}

export const WithImage = Template.bind( {} );
WithImage.storyName = 'With Image';
WithImage.args = {
	id: 'notification-id',
	title: 'Congrats on your first post!',
	description: 'We sent your sitemap to Googlebot.',
	learnMore: 'Learn more',
	dismiss: 'OK, Got it!',
	format: 'small',
	SmallImageSVG: AwardSVG,
	type: 'win-success',
};
WithImage.scenario = {
	label: 'Components/BannerNotification',
};

export const WithNoImage = Template.bind( {} );
WithNoImage.storyName = 'With No Image';
WithNoImage.args = {
	id: 'notification-id',
	title: 'Your Site is Now Registered!',
	description: 'Congrats your site is registered with Search Console!',
	dismiss: 'OK, Got it!',
	learnMoreURL: 'http://google.com',
	learnMoreLabel: 'Learn more',
	learnMoreDescription: 'about the particular win',
	format: 'small',
	type: 'win-success',
};

export const WithError = Template.bind( {} );
WithError.storyName = 'With Error';
WithError.args = {
	id: 'notification-id',
	title: 'AMP Validation Error',
	description: 'There are validation errors that need to be fixed.',
	learnMoreURL: 'http://google.com',
	learnMore: 'View Search Console report',
	learnMoreLabel: 'View Search Console',
	learnMoreDescription: 'report',
	dismiss: 'Dismiss',
	format: 'small',
	type: 'win-error',
};

export const WithWarnign = Template.bind( {} );
WithWarnign.storyName = 'With Warning';
WithWarnign.args = {
	id: 'notification-id',
	title: 'Index Warning',
	description: 'Indexed, though blocked by robots.txt.',
	learnMoreURL: 'http://google.com',
	learnMoreLabel: 'Learn more',
	dismiss: 'Dismiss',
	format: 'small',
	ctaLink: 'http://google.com',
	ctaLabel: 'Validate',
	type: 'win-warning',
};

export const WithElementDescription = Template.bind( {} );
WithElementDescription.storyName = 'With Element Description';
WithElementDescription.args = {
	id: 'notification-id',
	title: 'Index Warning',
	description: <p>This description is a React element.</p>,
	learnMoreURL: 'http://google.com',
	learnMoreLabel: 'Learn more',
	dismiss: 'Dismiss',
	format: 'small',
	ctaLink: 'http://google.com',
	ctaLabel: 'Validate',
	type: 'win-warning',
};

export const WithBadge = Template.bind( {} );
WithBadge.storyName = 'With Badge';
WithBadge.args = {
	id: 'notification-id',
	title: 'Congrats on your first post!',
	description: 'We sent your sitemap to Googlebot.',
	learnMore: 'Learn more',
	dismiss: 'OK, Got it!',
	format: 'small',
	SmallImageSVG: AwardSVG,
	type: 'win-success',
	badgeLabel: 'New',
};

export const Rounded = Template.bind( {} );
Rounded.storyName = 'With Rounded Corners';
Rounded.args = {
	id: 'notification-id',
	title: 'Congrats on your first post!',
	description: 'We sent your sitemap to Googlebot.',
	learnMore: 'Learn more',
	dismiss: 'OK, Got it!',
	format: 'small',
	SmallImageSVG: AwardSVG,
	type: 'win-success',
	rounded: true,
};

export const WithFooter = Template.bind( {} );
WithFooter.storyName = 'With Footer';
WithFooter.args = {
	id: 'notification-id',
	title: 'Congrats on your first post!',
	description: 'We sent your sitemap to Googlebot.',
	learnMore: 'Learn more',
	dismiss: 'OK, Got it!',
	format: 'small',
	SmallImageSVG: AwardSVG,
	type: 'win-success',
	footer: (
		<p>
			Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed commodo
			urna vitae commodo sollicitudin. Quisque vitae faucibus eros, eu
			faucibus eros. Phasellus malesuada sapien eu leo sagittis, ut
			iaculis purus aliquam. Cras quis lorem placerat, convallis urna ut,
			euismod eros. In non quam sit amet augue placerat aliquam id et est.
		</p>
	),
};

export const WithSecondaryPane = Template.bind( {} );
WithSecondaryPane.storyName = 'With Secondary Pane';
WithSecondaryPane.args = {
	id: 'notification-id',
	title: 'Congrats on your first post!',
	description: 'We sent your sitemap to Googlebot.',
	learnMore: 'Learn more',
	dismiss: 'OK, Got it!',
	format: 'small',
	SmallImageSVG: AwardSVG,
	type: 'win-success',
	secondaryPane: (
		<p>
			Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed commodo
			urna vitae commodo sollicitudin. Quisque vitae faucibus eros, eu
			faucibus eros. Phasellus malesuada sapien eu leo sagittis, ut
			iaculis purus aliquam. Cras quis lorem placerat, convallis urna ut,
			euismod eros. In non quam sit amet augue placerat aliquam id et est.
		</p>
	),
};

export default {
	title: 'Components/BannerNotification',
	component: BannerNotification,
};
