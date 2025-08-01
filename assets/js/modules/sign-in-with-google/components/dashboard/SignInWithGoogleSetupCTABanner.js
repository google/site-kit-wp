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
import { useMount } from 'react-use';

/**
 * WordPress dependencies
 */
import { __, _x, sprintf } from '@wordpress/i18n';
import { useCallback, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { MODULE_SLUG_SIGN_IN_WITH_GOOGLE } from '../../constants';
import useActivateModuleCallback from '../../../../hooks/useActivateModuleCallback';
import SetupCTA from '../../../../googlesitekit/notifications/components/layout/SetupCTA';
import BannerSVGDesktop from '@/svg/graphics/banner-sign-in-with-google-setup-cta.svg?url';
import BannerSVGMobile from '@/svg/graphics/banner-sign-in-with-google-setup-cta-mobile.svg?url';

export default function SignInWithGoogleSetupCTABanner( { id, Notification } ) {
	const [ isSaving, setIsSaving ] = useState( false );

	const learnMoreURL = useSelect( ( select ) => {
		return select( CORE_SITE ).getDocumentationLinkURL(
			MODULE_SLUG_SIGN_IN_WITH_GOOGLE
		);
	} );

	const { triggerSurvey } = useDispatch( CORE_USER );
	useMount( () => {
		triggerSurvey( 'view_siwg_setup_cta' );
	} );

	const onSetupActivate = useActivateModuleCallback(
		MODULE_SLUG_SIGN_IN_WITH_GOOGLE
	);

	const onSetupCallback = useCallback( () => {
		setIsSaving( true );
		onSetupActivate();
	}, [ onSetupActivate, setIsSaving ] );

	return (
		<Notification>
			<SetupCTA
				notificationID={ id }
				title={ sprintf(
					/* translators: %s: Sign in with Google service name */
					__(
						'Boost onboarding, security, and trust on your site using %s',
						'google-site-kit'
					),
					_x(
						'Sign in with Google',
						'Service name',
						'google-site-kit'
					)
				) }
				description={ sprintf(
					/* translators: %s: Sign in with Google service name */
					__(
						'Provide your site visitors with a simple, secure, and personalized experience by adding a %s button to your login page.',
						'google-site-kit'
					),
					_x(
						'Sign in with Google',
						'Service name',
						'google-site-kit'
					)
				) }
				learnMoreLink={ {
					href: learnMoreURL,
				} }
				ctaButton={ {
					label: sprintf(
						/* translators: %s: Sign in with Google service name */
						__( 'Set up %s', 'google-site-kit' ),
						_x(
							'Sign in with Google',
							'Service name',
							'google-site-kit'
						)
					),
					onClick: onSetupCallback,
					inProgress: isSaving,
					dismissOnClick: true,
					dismissOptions: {
						skipHidingFromQueue: true,
					},
				} }
				dismissButton={ {
					label: __( 'Maybe later', 'google-site-kit' ),
					disabled: isSaving,
				} }
				svg={ {
					desktop: BannerSVGDesktop,
					mobile: BannerSVGMobile,
					verticalPosition: 'bottom',
				} }
			/>
		</Notification>
	);
}

SignInWithGoogleSetupCTABanner.propTypes = {
	id: PropTypes.string,
	Notification: PropTypes.elementType,
};
