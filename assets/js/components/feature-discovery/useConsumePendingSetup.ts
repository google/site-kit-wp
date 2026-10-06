/**
 * Consume pending setup hook.
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
import { useEffect, useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useDispatch } from 'googlesitekit-data';
import { CORE_FEATURE_DISCOVERY } from '@/js/googlesitekit/datastore/feature-discovery/constants';
import { consumePendingSetup } from '@/js/googlesitekit/feature-discovery/pending-setup';

/**
 * Consumes the pending setup record, if any, once when the hub mounts, and
 * stores it so the hub can return the user to the tab they set out from.
 *
 * This is the only place the record is consumed, so reloading or revisiting
 * the hub afterwards can't route the user again.
 *
 * @since n.e.x.t
 *
 * @return {boolean} `true` once the record has been consumed and stored.
 */
export default function useConsumePendingSetup(): boolean {
	const { receivePendingSetup } = useDispatch( CORE_FEATURE_DISCOVERY );
	const [ hasConsumed, setHasConsumed ] = useState( false );
	const hasStartedRef = useRef( false );

	useEffect( () => {
		// Guard against the effect running twice (e.g. in strict mode), where
		// the second read would find nothing and overwrite the first's result.
		if ( hasStartedRef.current ) {
			return;
		}

		hasStartedRef.current = true;

		consumePendingSetup().then( ( pendingSetup ) => {
			receivePendingSetup( pendingSetup );
			setHasConsumed( true );
		} );
	}, [ receivePendingSetup ] );

	return hasConsumed;
}
