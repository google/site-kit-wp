/**
 * Notification Component Stories.
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
 * External dependencies
 */
import { storiesOf } from '@storybook/react';
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { provideModuleRegistrations, provideSiteInfo, WithTestRegistry } from '../tests/js/utils';
import UserInputSuccessNotification from '../assets/js/components/notifications/UserInputSuccessNotification';
import ModulesList from '../assets/js/components/ModulesList';
import Notification from '../assets/js/components/legacy-notifications/notification';
import UserInputPromptNotification from '../assets/js/components/notifications/UserInputPromptNotification';
import { CORE_USER } from '../assets/js/googlesitekit/datastore/user/constants';
import { MODULES_ADSENSE } from '../assets/js/modules/adsense/datastore/constants';
import { CORE_MODULES } from '../assets/js/googlesitekit/modules/datastore/constants';
import { withConnected } from '../assets/js/googlesitekit/modules/datastore/__fixtures__';
import SuccessGreenSVG from '../assets/svg/success-green.svg';
import AwardSVG from '../assets/svg/award.svg';

storiesOf( 'Global/Notifications', module )
	.add( 'Module Setup Complete', () => {
		const setupRegistry = ( registry ) => {
			registry.dispatch( CORE_MODULES ).receiveGetModules( withConnected( 'search-console', 'analytics', 'pagespeed-insights' ) );
			provideModuleRegistrations( registry );
			registry.dispatch( MODULES_ADSENSE ).receiveIsAdBlockerActive( false );
		};

		return (
			<WithTestRegistry callback={ setupRegistry }>
				<Notification
					id="notification-id"
					title={ __( 'Congrats on completing the setup for Analytics!', 'google-site-kit' ) }
					WinImageSVG={ SuccessGreenSVG }
					dismiss={ __( 'OK, Got it!', 'google-site-kit' ) }
					format="large"
					type="win-success"
				>
					<ModulesList
						moduleSlugs={ [ 'search-console', 'adsense', 'analytics', 'pagespeed-insights' ] }
					/>
				</Notification>
			</WithTestRegistry>
		);
	}, {
		padding: 0,
	} )
	.add( 'Small with Image', () => (
		<Notification
			id="notification-id"
			title={ __( 'Congrats on your first post!', 'google-site-kit' ) }
			description={ __( 'We sent your sitemap to Googlebot.', 'google-site-kit' ) }
			learnMore={ __( 'Learn more', 'google-site-kit' ) }
			dismiss={ __( 'OK, Got it!', 'google-site-kit' ) }
			format="small"
			SmallImageSVG={ AwardSVG }
			type="win-success"
		/>
	), {
		padding: 0,
	} )
	.add( 'Small with No Image', () => (
		<Notification
			id="notification-id"
			title={ __( 'Your Site is Now Registered!', 'google-site-kit' ) }
			description={ __( 'Congrats your site is registered with Search Console!', 'google-site-kit' ) }
			dismiss={ __( 'OK, Got it!', 'google-site-kit' ) }
			learnMoreURL="http://google.com"
			learnMoreLabel={ __( 'Learn More', 'google-site-kit' ) }
			learnMoreDescription={ __( 'about the particular win', 'google-site-kit' ) }
			format="small"
			type="win-success"
		/>
	), {
		padding: 0,
	} )
	.add( 'Small with Error', () => (
		<Notification
			id="notification-id"
			title={ __( 'AMP Validation Error', 'google-site-kit' ) }
			description={ __( 'There are validation errors that need to be fixed.', 'google-site-kit' ) }
			learnMoreURL="http://google.com"
			learnMore={ __( 'View Search Console report', 'google-site-kit' ) }
			learnMoreLabel={ __( 'View Search Console', 'google-site-kit' ) }
			learnMoreDescription={ __( 'report', 'google-site-kit' ) }
			dismiss={ __( 'Dismiss', 'google-site-kit' ) }
			format="small"
			type="win-error"
		/>
	), {
		padding: 0,
	} )
	.add( 'Small with Warning', () => (
		<Notification
			id="notification-id"
			title={ __( 'Index Warning', 'google-site-kit' ) }
			description={ __( 'Indexed, though blocked by robots.text.', 'google-site-kit' ) }
			learnMoreURL="http://google.com"
			learnMoreLabel={ __( 'Learn more', 'google-site-kit' ) }
			dismiss={ __( 'Dismiss', 'google-site-kit' ) }
			format="small"
			ctaLink="http://google.com"
			ctaLabel={ __( 'Validate', 'google-site-kit' ) }
			type="win-warning"
			pageIndex="First detected: 2/13/18"
		/>
	), {
		padding: 0,
	} )
	.add( 'User Input Prompt Notification', () => {
		const setupRegistry = ( registry ) => {
			registry.dispatch( CORE_USER ).receiveUserInputState( 'missing' );
			provideSiteInfo( registry );
		};

		return (
			<WithTestRegistry callback={ setupRegistry }>
				<UserInputPromptNotification />
			</WithTestRegistry>
		);
	}, {
		padding: 0,
	} )
	.add( 'User Input Success Notification', () => (
		<UserInputSuccessNotification />
	), {
		padding: 0,
	} );
