/**
 * `useNotificationEvents` hook.
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
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useViewContext from '../../../hooks/useViewContext';
import { trackEvent } from '../../../util';

export default function useNotificationEvents( id, category ) {
	const viewContext = useViewContext();
	const eventCategory = category ?? `${ viewContext }_${ id }`;

	const view = useCallback(
		( ...args ) => {
			return trackEvent( eventCategory, 'view_notification', ...args );
		},
		[ eventCategory ]
	);

	const confirm = useCallback(
		( ...args ) => {
			return trackEvent( eventCategory, 'confirm_notification', ...args );
		},
		[ eventCategory ]
	);

	const dismiss = useCallback(
		( ...args ) => {
			return trackEvent( eventCategory, 'dismiss_notification', ...args );
		},
		[ eventCategory ]
	);

	const clickLearnMore = useCallback(
		( ...args ) => {
			return trackEvent(
				eventCategory,
				'click_learn_more_link',
				...args
			);
		},
		[ eventCategory ]
	);

	return {
		view,
		confirm,
		dismiss,
		clickLearnMore,
	};
}
