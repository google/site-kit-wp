/**
 * Analytics useExistingTag custom hook.
 *
 * Sets the accountID and property if there is an existing tag.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import { STORE_NAME } from '../datastore/constants';
const { useSelect, useDispatch } = Data;

export default function useExistingTagEffect() {
	const existingTag = useSelect( ( select ) => select( STORE_NAME ).getExistingTag() ) || {};
	const existingTagPermission = useSelect( ( select ) => select( STORE_NAME ).getTagPermission( existingTag ) );
	const hasExistingTag = useSelect( ( select ) => select( STORE_NAME ).hasExistingTag() );

	const { setAccountID, selectProperty } = useDispatch( STORE_NAME );
	useEffect( () => {
		if ( hasExistingTag && existingTagPermission ) {
			const { accountID: existingTagAccountID } = existingTagPermission;
			setAccountID( existingTagAccountID );
			selectProperty( existingTag );
		}

		// Permission for a detected GTM property ID must also be checked if present with hasTagPermission( gtmAnalyticsPropertyID )
		//An Analytics existing tag should take precedence over a detected property ID in GTM regarding the force-selected value(s)
	}, [ hasExistingTag, existingTag, existingTagPermission ] );
}
