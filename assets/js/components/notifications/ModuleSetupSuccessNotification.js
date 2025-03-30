/**
 * ModuleSetupSuccessNotification component.
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
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import SubtleNotification from '../../googlesitekit/notifications/components/layout/SubtleNotification';
import CTALinkSubtle from '../../googlesitekit/notifications/components/common/CTALinkSubtle';
import Dismiss from '../../googlesitekit/notifications/components/common/Dismiss';
import useQueryArg from '../../hooks/useQueryArg';

export default function ModuleSetupSuccessNotification( { id, Notification } ) {
	const [ , setNotification ] = useQueryArg( 'notification' );
	const [ slug, setSlug ] = useQueryArg( 'slug' );

	const module = useSelect( ( select ) =>
		select( CORE_MODULES ).getModule( slug )
	);

	const settingsAdminURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-settings' )
	);

	const onDismiss = () => {
		setNotification( undefined );
		setSlug( undefined );
	};

	return (
		<Notification>
			<SubtleNotification
				title={ sprintf(
					/* translators: %s: module name */
					__(
						'Congrats on completing the setup for %s',
						'google-site-kit'
					),
					module?.name
				) }
				description={ __(
					'Connect more services to see more stats.',
					'google-site-kit'
				) }
				dismissCTA={
					<Dismiss
						id={ id }
						primary={ false }
						dismissLabel={ __( 'Got it', 'google-site-kit' ) }
						onDismiss={ onDismiss }
					/>
				}
				additionalCTA={
					<CTALinkSubtle
						id={ id }
						ctaLabel={ __( 'Go to Settings', 'google-site-kit' ) }
						ctaLink={ `${ settingsAdminURL }#/connect-more-services` }
					/>
				}
			/>
		</Notification>
	);
}

ModuleSetupSuccessNotification.propTypes = {
	id: PropTypes.string.isRequired,
	Notification: PropTypes.elementType.isRequired,
};
