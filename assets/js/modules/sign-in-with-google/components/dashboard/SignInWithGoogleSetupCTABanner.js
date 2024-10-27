/**
 * Sign in with Google Setup CTA Banner component.
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
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import useActivateModuleCallback from '../../../../hooks/useActivateModuleCallback';
import NotificationWithSVG from '../../../../googlesitekit/notifications/components/layout/NotificationWithSVG';
import Description from '../../../../googlesitekit/notifications/components/common/Description';
import LearnMoreLink from '../../../../googlesitekit/notifications/components/common/LearnMoreLink';
import ActionsCTALinkDismiss from '../../../../googlesitekit/notifications/components/common/ActionsCTALinkDismiss';
import DesktopSVG from '../../../../../svg/graphics/sign-in-with-google-setup-cta-desktop.svg';
import TabletSVG from '../../../../../svg/graphics/sign-in-with-google-setup-cta-tablet.svg';
import MobileSVG from '../../../../../svg/graphics/sign-in-with-google-setup-cta-mobile.svg';

export default function SignInWithGoogleSetupCTABanner( { id, Notification } ) {
	const learnMoreURL = useSelect( ( select ) => {
		return select( CORE_SITE ).getDocumentationLinkURL(
			'sign-in-with-google'
		);
	} );

	const onSetupActivate = useActivateModuleCallback( 'sign-in-with-google' );

	return (
		<Notification>
			<NotificationWithSVG
				title={ __(
					'Boost onboarding, security, and trust on your site using Sign in with Google',
					'google-site-kit'
				) }
				description={
					<Description
						className="googlesitekit-setup-cta-banner__description"
						text={ __(
							'Provide your site visitors with a simple, secure, and personalised experience by adding a Sign in with Google button to your login page.',
							'google-site-kit'
						) }
						learnMoreLink={
							<LearnMoreLink
								id={ id }
								label={ __( 'Learn more', 'google-site-kit' ) }
								url={ learnMoreURL }
							/>
						}
					/>
				}
				actions={
					<ActionsCTALinkDismiss
						id={ id }
						className="googlesitekit-setup-cta-banner__actions-wrapper"
						ctaLabel={ __(
							'Set up Sign in with Google',
							'google-site-kit'
						) }
						onCTAClick={ onSetupActivate }
						dismissLabel={ __( 'Maybe later', 'google-site-kit' ) }
					/>
				}
				DesktopSVG={ DesktopSVG }
				TabletSVG={ TabletSVG }
				MobileSVG={ MobileSVG }
			/>
		</Notification>
	);
}

SignInWithGoogleSetupCTABanner.propTypes = {
	id: PropTypes.string,
	Notification: PropTypes.elementType,
};
