/**
 * SubtleNotification Component Stories.
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
import SubtleNotification from './SubtleNotification';

function Template( { ...args } ) {
	return <SubtleNotification { ...args } />;
}

export const Success = Template.bind( {} );
Success.storyName = 'Success';
Success.args = {
	title: 'Success! Your Conversion Tracking ID was added to your site',
	dismissLabel: 'Ok, got it',
};

export const SuccessWithDescription = Template.bind( {} );
SuccessWithDescription.storyName = 'Success - With Description';
SuccessWithDescription.args = {
	title: 'Success! Your Conversion Tracking ID was added to your site',
	description: 'You can now track conversions for your Ads campaigns',
	dismissLabel: 'Ok, got it',
};

export const SuccessWithCTA = Template.bind( {} );
SuccessWithCTA.storyName = 'Success - With CTA';
SuccessWithCTA.args = {
	title: 'Success! Your Conversion Tracking ID was added to your site',
	description: 'You can now track conversions for your Ads campaigns',
	dismissLabel: 'Ok, got it',
	ctaLabel: 'Learn more',
};

export const SuccessWithExternalCTA = Template.bind( {} );
SuccessWithExternalCTA.storyName = 'Success - With External CTA';
SuccessWithExternalCTA.args = {
	title: 'Success! Your Conversion Tracking ID was added to your site',
	description: 'You can now track conversions for your Ads campaigns',
	dismissLabel: 'Ok, got it',
	ctaLabel: 'Learn more',
	ctaLink: 'https://sitekit.withgoogle.com/documentation',
	isCTALinkExternal: true,
};

export const Warning = Template.bind( {} );
Warning.storyName = 'Warning';
Warning.args = {
	title: 'Warning! Your Conversion Tracking ID was not added to your site',
	dismissLabel: 'Ok, got it',
	variant: 'warning',
};

export const WarningWithDescription = Template.bind( {} );
WarningWithDescription.storyName = 'Warning - With Description';
WarningWithDescription.args = {
	title: 'Warning! Your Conversion Tracking ID was not added to your site',
	description: 'You cannot track conversions for your Ads campaigns',
	dismissLabel: 'Ok, got it',
	variant: 'warning',
};

export const WarningWithCTA = Template.bind( {} );
WarningWithCTA.storyName = 'Warning - With CTA';
WarningWithCTA.args = {
	title: 'Warning! Your Conversion Tracking ID was not added to your site',
	description: 'You cannot track conversions for your Ads campaigns',
	dismissLabel: 'Ok, got it',
	ctaLabel: 'Learn more',
	variant: 'warning',
};

export const WarningWithExternalCTA = Template.bind( {} );
WarningWithExternalCTA.storyName = 'Warning - With External CTA';
WarningWithExternalCTA.args = {
	title: 'Warning! Your Conversion Tracking ID was not added to your site',
	description: 'You cannot track conversions for your Ads campaigns',
	dismissLabel: 'Ok, got it',
	ctaLabel: 'Learn more',
	ctaLink: 'https://sitekit.withgoogle.com/documentation',
	isCTALinkExternal: true,
	variant: 'warning',
};

export default {
	title: 'Components/Notifications/SubtleNotification',
	component: SubtleNotification,
};
