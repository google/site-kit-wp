/**
 * `useRetriableNotificationDismissButtonLabel` hook.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { useMount } from 'react-use';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * Custom hook to generate the dismiss button label for "retriable"
 * notifications.
 *
 * When the main CTA for retriable notifications is clicked, it is "dismissed"
 * and the dismissalCount for that notification is incremented. This causes the
 * isNotificationDismissalFinal() selector to return true momentarily when the
 * dismissal count reaches its limit. This then causes the "Maybe later" label
 * to momentarily change to "Don't show again" before the notification is
 * dismissed. This hook uses local state to ensure that the dismiss button
 * label remains consistent for the user and doesn't change unexpectedly.
 *
 * @since n.e.x.t
 *
 * @param {Object}  options                  Options for the hook.
 * @param {boolean} options.isDismissalFinal Whether the dismissal is final or
 *                                           not.
 * @return {string} The button label text.
 */
export default function useRetriableNotificationDismissButtonLabel( {
	isDismissalFinal,
} = {} ) {
	const [ dismissLabel, setDismissLabel ] = useState(
		__( 'Maybe later', 'google-site-kit' )
	);

	useMount( () => {
		if ( true === isDismissalFinal ) {
			setDismissLabel( __( 'Don’t show again', 'google-site-kit' ) );
		}
	} );

	return dismissLabel;
}
