/**
 * Tag Manager useExistingTag custom hook.
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
import { MODULES_TAGMANAGER } from '../datastore/constants';

export default function useExistingTagEffect() {
	const existingTag = useSelect( ( select ) =>
		select( MODULES_TAGMANAGER ).getExistingTag()
	);
	const containerID = useSelect( ( select ) =>
		select( MODULES_TAGMANAGER ).getPrimaryContainerID()
	);

	const skipEffect = useRef( true );

	const { setUseSnippet } = useDispatch( MODULES_TAGMANAGER );

	useEffect( () => {
		if ( existingTag && containerID !== undefined ) {
			if ( containerID === '' || skipEffect.current ) {
				skipEffect.current = false;
				return;
			}
			if ( existingTag === containerID ) {
				setUseSnippet( false );
			} else {
				setUseSnippet( true );
			}
		}
	}, [ containerID, existingTag, setUseSnippet ] );
}
