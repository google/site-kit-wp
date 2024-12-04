/**
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
import { useDispatch } from 'googlesitekit-data';
import useNotificationEvents from '../../hooks/useNotificationEvents';
import { CORE_NOTIFICATIONS } from '../../datastore/constants';
import { Button } from 'googlesitekit-components';

export default function Dismiss( {
	id,
	primary = true,
	dismissLabel = __( 'OK, Got it!', 'google-site-kit' ),
	dismissExpires = 0,
	disabled,
	onDismiss = () => {},
	gaTrackingEventArgs,
	dismissOptions,
} ) {
	const trackEvents = useNotificationEvents( id );

	const { dismissNotification } = useDispatch( CORE_NOTIFICATIONS );

	const handleDismiss = async ( event ) => {
		await onDismiss?.( event );
		trackEvents.dismiss(
			gaTrackingEventArgs?.label,
			gaTrackingEventArgs?.value
		);
		dismissNotification( id, {
			...dismissOptions,
			expiresInSeconds: dismissExpires,
		} );
	};

	return (
		<Button
			tertiary={ ! primary }
			onClick={ handleDismiss }
			disabled={ disabled }
		>
			{ dismissLabel }
		</Button>
	);
}

Dismiss.propTypes = {
	id: PropTypes.string,
	primary: PropTypes.bool,
	dismissLabel: PropTypes.string,
	dismissExpires: PropTypes.number,
	disabled: PropTypes.bool,
	onDismiss: PropTypes.func,
	gaTrackingEventArgs: PropTypes.shape( {
		label: PropTypes.string,
		value: PropTypes.string,
	} ),
};
