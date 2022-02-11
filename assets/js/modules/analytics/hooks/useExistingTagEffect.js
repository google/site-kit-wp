/**
 * Analytics useExistingTag custom hook.
 *
 * Sets the accountID and property if there is an existing tag.
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
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { MODULES_ANALYTICS } from '../datastore/constants';
const { useSelect, useDispatch } = Data;

export default function useExistingTagEffect() {
	const { setUseSnippet } = useDispatch( MODULES_ANALYTICS );

	const hasExistingTag = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).hasExistingTag()
	);

	useEffect( () => {
		if ( hasExistingTag ) {
			// Disable the Analytics snippet if there is an existing tag, though
			// the user can still override this setting if they like.
			setUseSnippet( false );
		}
	}, [ setUseSnippet, hasExistingTag ] );
}
