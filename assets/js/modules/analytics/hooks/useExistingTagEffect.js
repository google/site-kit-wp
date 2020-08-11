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
import { STORE_NAME as CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import { STORE_NAME as MODULES_TAGMANAGER } from '../../tagmanager/datastore/constants';
const { useSelect, useDispatch } = Data;

export default function useExistingTagEffect() {
	// Check for existing Analytics tag.
	const existingTag = useSelect( ( select ) => select( STORE_NAME ).getExistingTag() ) || {};
	const existingTagPermission = useSelect( ( select ) => select( STORE_NAME ).getTagPermission( existingTag ) );
	const hasExistingTag = useSelect( ( select ) => select( STORE_NAME ).hasExistingTag() );

	// Check for existing Analytics tag added via Tagmanager.
	const tagmanagerModuleActive = useSelect( ( select ) => select( CORE_MODULES ).isModuleActive( 'tagmanager' ) );
	const gtmAnalyticsPropertyID = useSelect( ( select ) => select( MODULES_TAGMANAGER ).getSingleAnalyticsPropertyID() );
	const gtmAnalyticsPropertyIDPermission = useSelect( ( select ) => select( STORE_NAME ).hasTagPermission( gtmAnalyticsPropertyID ) );

	const { setAccountID, selectProperty } = useDispatch( STORE_NAME );
	useEffect( () => {
		( async () => {
			// If there is an existing Analytics tag, select it.
			if ( hasExistingTag && existingTagPermission ) {
				const { accountID: existingTagAccountID } = existingTagPermission;
				setAccountID( existingTagAccountID );
				selectProperty( existingTag );
			} else if ( tagmanagerModuleActive && gtmAnalyticsPropertyID && gtmAnalyticsPropertyIDPermission ) {
				// If GTM container has GA tag and user has access to it, force select it.
				await setAccountID( gtmAnalyticsPropertyIDPermission.accountID );
				await selectProperty( gtmAnalyticsPropertyID );
			}
		} )();
	}, [ hasExistingTag, existingTag, existingTagPermission ] );
}
