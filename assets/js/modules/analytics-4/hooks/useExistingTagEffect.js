/**
 * GA4 useExistingTagEffect custom hook.
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
import { useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { MODULES_ANALYTICS_4 } from '../datastore/constants';

/**
 * Toggles `useSnippet` depending on whether there is a existing tag matching the selected GA4 property.
 *
 * @since 1.75.0
 */
export default function useExistingTagEffect() {
	const { setUseSnippet } = useDispatch( MODULES_ANALYTICS_4 );

	const existingTag = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getExistingTag()
	);
	const measurementID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getMeasurementID()
	);

	const skipEffect = useRef( true );

	useEffect( () => {
		if ( existingTag && measurementID !== undefined ) {
			if ( measurementID === '' || skipEffect.current ) {
				skipEffect.current = false;
				return;
			}
			if ( measurementID === existingTag ) {
				// Disable the Analytics snippet if there is an existing tag that
				// matches the currently selected property.
				setUseSnippet( false );
			} else {
				// Otherwise enable the Analytics snippet again.
				setUseSnippet( true );
			}
		}
	}, [ setUseSnippet, existingTag, measurementID ] );
}
