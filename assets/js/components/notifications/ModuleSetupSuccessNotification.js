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
import NoticeNotification from '../../googlesitekit/notifications/components/layout/NoticeNotification';
import { TYPES } from '../Notice/constants';
import useQueryArg from '../../hooks/useQueryArg';
import useViewContext from '../../hooks/useViewContext';

export default function ModuleSetupSuccessNotification( { id, Notification } ) {
	const [ , setNotification ] = useQueryArg( 'notification' );
	const [ slug, setSlug ] = useQueryArg( 'slug' );

	const module = useSelect( ( select ) =>
		select( CORE_MODULES ).getModule( slug )
	);

	const connectMoreServicesURL = useSelect( ( select ) =>
		select( CORE_SITE ).getConnectMoreServicesURL()
	);

	const onDismiss = () => {
		setNotification( undefined );
		setSlug( undefined );
	};

	// Since the notification ID here is generic (`setup-success-notification-module`),
	// it will be helpful to track individual module notifications uniquely as we do for
	// other Setup Success Notifications.
	const viewContext = useViewContext();
	const gaTrackingEventArgs = {
		category: `${ viewContext }_setup-success-notification-${ module?.slug }`,
	};

	return (
		<Notification gaTrackingEventArgs={ gaTrackingEventArgs }>
			<NoticeNotification
				notificationID={ id }
				type={ TYPES.SUCCESS }
				gaTrackingEventArgs={ gaTrackingEventArgs }
				title={ sprintf(
					/* translators: %s: module name */
					__(
						'Congrats on completing the setup for %s!',
						'google-site-kit'
					),
					module?.name
				) }
				description={ __(
					'Connect more services to see more stats.',
					'google-site-kit'
				) }
				dismissButton={ {
					onClick: onDismiss,
				} }
				ctaButton={ {
					label: __( 'Go to Settings', 'google-site-kit' ),
					href: connectMoreServicesURL,
				} }
			/>
		</Notification>
	);
}

ModuleSetupSuccessNotification.propTypes = {
	id: PropTypes.string.isRequired,
	Notification: PropTypes.elementType.isRequired,
};
