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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import NoticeNotification from '../../../../googlesitekit/notifications/components/layout/NoticeNotification';
import useQueryArg from '../../../../hooks/useQueryArg';
import { TYPES } from '../../../../components/Notice/constants';

export default function SetupSuccessSubtleNotification( { id, Notification } ) {
	const [ , setNotification ] = useQueryArg( 'notification' );
	const [ , setSlug ] = useQueryArg( 'slug' );

	const onDismiss = () => {
		setNotification( undefined );
		setSlug( undefined );
	};

	return (
		<Notification>
			<NoticeNotification
				notificationID={ id }
				type={ TYPES.SUCCESS }
				title={ __(
					'Success! Your Conversion ID was added to your site',
					'google-site-kit'
				) }
				description={ __(
					'You can now track conversions for your Ads campaigns',
					'google-site-kit'
				) }
				dismissButton={ {
					onClick: onDismiss,
				} }
			/>
		</Notification>
	);
}

SetupSuccessSubtleNotification.propTypes = {
	id: PropTypes.string.isRequired,
	Notification: PropTypes.elementType.isRequired,
};
