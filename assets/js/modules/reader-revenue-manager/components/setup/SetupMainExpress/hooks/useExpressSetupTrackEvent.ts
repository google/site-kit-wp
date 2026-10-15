/**
 * Reader Revenue Manager express setup `useExpressSetupTrackEvent` hook.
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
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { trackEvent } from '@/js/util';
import useExpressSetupEventCategory from './useExpressSetupEventCategory';

/**
 * Returns a function that tracks a GA event in the express setup of the
 * current CTA.
 *
 * Outside a CTA setup flow, the returned function tracks nothing.
 *
 * @since n.e.x.t
 *
 * @return {Function} Function that takes the event name and an optional label, and returns a promise that settles once the event is tracked.
 */
export default function useExpressSetupTrackEvent(): (
	action: string,
	label?: string
) => Promise< unknown > {
	const eventCategory = useExpressSetupEventCategory();

	return useCallback(
		( action: string, label?: string ) =>
			eventCategory
				? trackEvent( eventCategory, action, label )
				: Promise.resolve(),
		[ eventCategory ]
	);
}
