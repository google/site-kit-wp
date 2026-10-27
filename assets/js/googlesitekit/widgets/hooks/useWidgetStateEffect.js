/**
 * `useWidgetStateEffect` hook.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { useInstanceId } from '@wordpress/compose';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useDispatch } from 'googlesitekit-data';
import { CORE_WIDGETS } from '@/js/googlesitekit/widgets/datastore/constants';

export default function useWidgetStateEffect(
	widgetSlug,
	Component,
	metadata
) {
	const { setWidgetState, unsetWidgetState } = useDispatch( CORE_WIDGETS );
	// Pass the instance ID so the cleanup of an instance only unsets the
	// widget state it set itself, and not a newer one set by another
	// instance of the same widget (e.g. when `WidgetNull` remounts).
	const instanceID = useInstanceId( useWidgetStateEffect );

	useEffect( () => {
		setWidgetState( widgetSlug, Component, metadata, instanceID );
		return () => {
			unsetWidgetState( widgetSlug, Component, metadata, instanceID );
		};
	}, [
		widgetSlug,
		Component,
		metadata,
		instanceID,
		setWidgetState,
		unsetWidgetState,
	] );
}
