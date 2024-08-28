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
import CustomCheckSVG from '../../../svg/icons/check_circle.svg';
import CustomWarningSVG from '../../../svg/icons/warning-v2.svg';

function Template( { ...args } ) {
	return <SubtleNotification onDismiss={ () => {} } { ...args } />;
}

export const Success = Template.bind( {} );
Success.storyName = 'Success';
Success.args = {
	title: 'Success! Your Conversion Tracking ID was added to your site',
	dismissLabel: 'Ok, got it',
};
Success.scenario = {};

export const SuccessWithDescription = Template.bind( {} );
SuccessWithDescription.storyName = 'Success With Description';
SuccessWithDescription.args = {
	title: 'Success! Your Conversion Tracking ID was added to your site',
	description: 'You can now track conversions for your Ads campaigns',
	dismissLabel: 'Ok, got it',
};
SuccessWithDescription.scenario = {};

export const SuccessWithCTA = Template.bind( {} );
SuccessWithCTA.storyName = 'Success With CTA';
SuccessWithCTA.args = {
	title: 'Success! Your Conversion Tracking ID was added to your site',
	description: 'You can now track conversions for your Ads campaigns',
	dismissLabel: 'Ok, got it',
	ctaLabel: 'Learn more',
};
SuccessWithCTA.scenario = {};

export const SuccessWithExternalCTA = Template.bind( {} );
SuccessWithExternalCTA.storyName = 'Success With External CTA';
SuccessWithExternalCTA.args = {
	title: 'Success! Your Conversion Tracking ID was added to your site',
	description: 'You can now track conversions for your Ads campaigns',
	dismissLabel: 'Ok, got it',
	ctaLabel: 'Learn more',
	ctaLink: 'https://sitekit.withgoogle.com/documentation',
	isCTALinkExternal: true,
};
SuccessWithExternalCTA.scenario = {};

export const SuccessWithCustomIcon = Template.bind( {} );
SuccessWithCustomIcon.storyName = 'Success With Custom Icon';
SuccessWithCustomIcon.args = {
	title: 'Success! Your Conversion Tracking ID was added to your site',
	description: 'You can now track conversions for your Ads campaigns',
	dismissLabel: 'Ok, got it',
	ctaLabel: 'Learn more',
	ctaLink: 'https://sitekit.withgoogle.com/documentation',
	isCTALinkExternal: true,
	Icon: CustomCheckSVG,
};
SuccessWithCustomIcon.scenario = {};

export const SuccessWithoutIcon = Template.bind( {} );
SuccessWithoutIcon.storyName = 'Success Without Icon';
SuccessWithoutIcon.args = {
	title: 'Success! Your Conversion Tracking ID was added to your site',
	dismissLabel: 'Ok, got it',
	ctaLabel: 'Learn more',
	ctaLink: 'https://sitekit.withgoogle.com/documentation',
	isCTALinkExternal: true,
	hideIcon: true,
};
SuccessWithoutIcon.scenario = {};

export const Warning = Template.bind( {} );
Warning.storyName = 'Warning';
Warning.args = {
	title: 'Warning! Your Conversion Tracking ID was not added to your site',
	dismissLabel: 'Ok, got it',
	variant: 'warning',
};
Warning.scenario = {};

export const WarningWithDescription = Template.bind( {} );
WarningWithDescription.storyName = 'Warning With Description';
WarningWithDescription.args = {
	title: 'Warning! Your Conversion Tracking ID was not added to your site',
	description: 'You cannot track conversions for your Ads campaigns',
	dismissLabel: 'Ok, got it',
	variant: 'warning',
};
WarningWithDescription.scenario = {};

export const WarningWithCTA = Template.bind( {} );
WarningWithCTA.storyName = 'Warning With CTA';
WarningWithCTA.args = {
	title: 'Warning! Your Conversion Tracking ID was not added to your site',
	description: 'You cannot track conversions for your Ads campaigns',
	dismissLabel: 'Ok, got it',
	ctaLabel: 'Learn more',
	variant: 'warning',
};
WarningWithCTA.scenario = {};

export const WarningWithExternalCTA = Template.bind( {} );
WarningWithExternalCTA.storyName = 'Warning With External CTA';
WarningWithExternalCTA.args = {
	title: 'Warning! Your Conversion Tracking ID was not added to your site',
	description: 'You cannot track conversions for your Ads campaigns',
	dismissLabel: 'Ok, got it',
	ctaLabel: 'Learn more',
	ctaLink: 'https://sitekit.withgoogle.com/documentation',
	isCTALinkExternal: true,
	variant: 'warning',
};
WarningWithExternalCTA.scenario = {};

export const WarningWithCustomIcon = Template.bind( {} );
WarningWithCustomIcon.storyName = 'Warning With Custom Icon';
WarningWithCustomIcon.args = {
	title: 'Warning! Your Conversion Tracking ID was not added to your site',
	description: 'You cannot track conversions for your Ads campaigns',
	dismissLabel: 'Ok, got it',
	ctaLabel: 'Learn more',
	ctaLink: 'https://sitekit.withgoogle.com/documentation',
	isCTALinkExternal: true,
	Icon: CustomWarningSVG,
	variant: 'warning',
};
WarningWithCustomIcon.scenario = {};

export const WarningWithoutIcon = Template.bind( {} );
WarningWithoutIcon.storyName = 'Warning Without Icon';
WarningWithoutIcon.args = {
	title: 'Warning! Your Conversion Tracking ID was added to your site',
	dismissLabel: 'Ok, got it',
	ctaLabel: 'Learn more',
	ctaLink: 'https://sitekit.withgoogle.com/documentation',
	isCTALinkExternal: true,
	variant: 'warning',
	hideIcon: true,
};
WarningWithoutIcon.scenario = {};

export const NonDismissible = Template.bind( {} );
NonDismissible.storyName = 'Non dismissible';
NonDismissible.args = {
	title: 'Success! Your Conversion Tracking ID was added to your site',
	description: 'You can now track conversions for your Ads campaigns',
	ctaLabel: 'Learn more',
	ctaLink: 'https://sitekit.withgoogle.com/documentation',
	isCTALinkExternal: true,
};

export default {
	title: 'Components/SubtleNotification',
	component: SubtleNotification,
};
