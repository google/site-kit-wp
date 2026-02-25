/**
 * `useForwardableParams` hook.
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
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useQueryArg from '@/js/hooks/useQueryArg';

/**
 * Gets splash/auth params that should be forwarded to dashboard URLs.
 *
 * @since n.e.x.t
 *
 * @return {Object} Forwardable query params.
 */
export default function useForwardableParams() {
	const [ notification ] = useQueryArg( 'notification' );
	const [ panel ] = useQueryArg( 'panel' );

	return useMemo( () => {
		const params = {};

		if ( notification ) {
			params.notification = notification;
		}

		if ( panel ) {
			params.panel = panel;
		}

		return params;
	}, [ notification, panel ] );
}
