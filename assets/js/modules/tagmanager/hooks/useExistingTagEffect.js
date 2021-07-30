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
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME } from '../datastore/constants';
const { useSelect, useDispatch } = Data;

export default function useExistingTagEffect() {
	const hasExistingTag = useSelect( ( select ) => select( STORE_NAME ).hasExistingTag() );
	const existingTag = useSelect( ( select ) => select( STORE_NAME ).getExistingTag() );
	const existingTagPermission = useSelect( ( select ) => select( STORE_NAME ).getTagPermission( existingTag ) );
	const hasExistingTagPermission = useSelect( ( select ) => select( STORE_NAME ).hasExistingTagPermission() );
	// Set the accountID and containerID if there is an existing tag.
	const { selectAccount, selectContainerByID } = useDispatch( STORE_NAME );
	useEffect( () => {
		( async () => {
			if ( hasExistingTag && hasExistingTagPermission ) {
				await selectAccount( existingTagPermission.accountID );
				await selectContainerByID( existingTag );
			}
		} )();
	}, [
		hasExistingTag,
		existingTag,
		hasExistingTagPermission,
		existingTagPermission,
		selectAccount,
		selectContainerByID,
	] );
}
