/**
 * SetupSuccessSubtleNotification component.
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
import { __, _x, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import NoticeNotification from '@/js/googlesitekit/notifications/components/layout/NoticeNotification';
import { TYPES } from '@/js/components/Notice/constants';
import useQueryArg from '@/js/hooks/useQueryArg';
import { useSelect } from 'googlesitekit-data';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { MODULE_SLUG_SIGN_IN_WITH_GOOGLE } from '@/js/modules/sign-in-with-google/constants';

export default function SetupSuccessSubtleNotification( { id, Notification } ) {
	const [ , setNotification ] = useQueryArg( 'notification' );
	const [ , setSlug ] = useQueryArg( 'slug' );

	const siwgSettingsURL = useSelect( ( select ) =>
		select( CORE_SITE ).getModuleSettingsURL(
			MODULE_SLUG_SIGN_IN_WITH_GOOGLE
		)
	);

	function onDismiss() {
		setNotification( undefined );
		setSlug( undefined );
	}

	return (
		<Notification>
			<NoticeNotification
				notificationID={ id }
				type={ TYPES.SUCCESS }
				title={ sprintf(
					/* translators: %s: Sign in with Google service name */
					__( 'You successfully set up %s!', 'google-site-kit' ),
					_x(
						'Sign in with Google',
						'Service name',
						'google-site-kit'
					)
				) }
				description={ sprintf(
					/* translators: %s: Sign in with Google service name */
					__(
						'%s button was added to your site login page. You can customize the button appearance in settings.',
						'google-site-kit'
					),
					_x(
						'Sign in with Google',
						'Service name',
						'google-site-kit'
					)
				) }
				dismissButton={ {
					label: __( 'Maybe later', 'google-site-kit' ),
					onClick: onDismiss,
				} }
				ctaButton={ {
					label: __( 'Customize settings', 'google-site-kit' ),
					href: siwgSettingsURL,
				} }
			/>
		</Notification>
	);
}

SetupSuccessSubtleNotification.propTypes = {
	id: PropTypes.string.isRequired,
	Notification: PropTypes.elementType.isRequired,
};
