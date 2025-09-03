/**
 * OfflineNotification component.
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
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import Notice from '@/js/components/Notice';

function OfflineNotification() {
	const [ dismissed, setDismissed ] = useState( false );

	const isOnline = useSelect( ( select ) => select( CORE_UI ).getIsOnline() );

	useEffect( () => {
		if ( isOnline && dismissed ) {
			setDismissed( false );
		}
	}, [ isOnline, dismissed ] );

	return (
		<div aria-live="polite">
			{ ! isOnline && ! dismissed && (
				<Notice
					className="googlesitekit-notice-snackbar--bottom-right"
					type={ Notice.TYPES.WARNING }
					description={ __(
						'You are currently offline. Some features may not be available.',
						'google-site-kit'
					) }
					ctaButton={ {
						label: __( 'OK, Got it!', 'google-site-kit' ),
						onClick: () => setDismissed( true ),
					} }
				/>
			) }
		</div>
	);
}

export default OfflineNotification;
