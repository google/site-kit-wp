/**
 * SiteKitSetupSuccessNotification component.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import SuccessGreenSVG from '../../../svg/graphics/success-green.svg';
import NotificationWithSmallerRightSVG from '../../googlesitekit/notifications/components/layout/NotificationWithSmallerRightSVG';
import Description from '../../googlesitekit/notifications/components/common/Description';
import LearnMoreLink from '../../googlesitekit/notifications/components/common/LearnMoreLink';
import Dismiss from '../../googlesitekit/notifications/components/common/Dismiss';
import useQueryArg from '../../hooks/useQueryArg';

export default function SiteKitSetupSuccessNotification( {
	id,
	Notification,
} ) {
	const settingsAdminURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-settings' )
	);

	const [ , setNotification ] = useQueryArg( 'notification' );

	const onDismiss = useCallback( () => {
		setNotification( undefined );
	}, [ setNotification ] );

	return (
		<Notification className="googlesitekit-publisher-win">
			<NotificationWithSmallerRightSVG
				title={ __(
					'Congrats on completing the setup for Site Kit!',
					'google-site-kit'
				) }
				description={
					<Description
						text={ __(
							'Connect more services to see more stats.',
							'google-site-kit'
						) }
						learnMoreLink={
							<LearnMoreLink
								id={ id }
								label={ __(
									'Go to Settings',
									'google-site-kit'
								) }
								url={ `${ settingsAdminURL }#/connect-more-services` }
								external={ false }
							/>
						}
					></Description>
				}
				actions={
					<Dismiss
						id={ id }
						dismissLabel={ __( 'OK, Got it!', 'google-site-kit' ) }
						onDismiss={ onDismiss }
					/>
				}
				SVG={ SuccessGreenSVG }
			/>
		</Notification>
	);
}

SiteKitSetupSuccessNotification.propTypes = {
	id: PropTypes.string.isRequired,
	Notification: PropTypes.elementType,
};
