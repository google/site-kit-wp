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
	const { setAccountID, selectProperty, setUseSnippet } = useDispatch( STORE_NAME );
	const gtmModuleActive = useSelect( ( select ) => select( CORE_MODULES ).isModuleActive( 'tagmanager' ) );

	const {
		existingTag,
		existingTagAccountID,
		existingTagPermission,
		gtmAnalyticsPropertyID,
		gtmAnalyticsAccountID,
	} = useSelect( ( select ) => {
		const data = {
			existingTag: select( STORE_NAME ).getExistingTag(),
			existingTagPermission: false,
			existingTagAccountID: '',
			gtmAnalyticsPropertyID: '',
			gtmAnalyticsAccountID: '',
		};

		if ( data.existingTag ) {
			// Just check existing tag permissions, if it is available and ignore tag manager settigns.
			const { permission = false, accountID = '' } = select( STORE_NAME ).getTagPermission( data.existingTag ) || {};
			if ( permission ) {
				data.existingTagPermission = permission;
				data.existingTagAccountID = accountID;
			}
		} else {
			// There is no existing tag, so we need to try to get a property ID from GTM.
			data.gtmAnalyticsPropertyID = select( MODULES_TAGMANAGER ).getSingleAnalyticsPropertyID();
			if ( data.gtmAnalyticsPropertyID ) {
				const { permission = false, accountID = '' } = select( STORE_NAME ).getTagPermission( data.gtmAnalyticsPropertyID ) || {};
				if ( permission ) {
					data.gtmAnalyticsAccountID = accountID;
				}
			}
		}

		return data;
	} );

	useEffect( () => {
		if ( existingTag ) {
			if ( existingTagPermission && existingTagAccountID ) {
				// There is an existing Analytics tag, select it.
				setAccountID( existingTagAccountID );
				selectProperty( existingTag );
			}
		} else if ( gtmModuleActive && gtmAnalyticsPropertyID && gtmAnalyticsAccountID ) {
			// GTM container has GA tag and user has access to it, force select it.
			setAccountID( gtmAnalyticsAccountID );
			selectProperty( gtmAnalyticsPropertyID );
			setUseSnippet( false );
		}
	}, [
		existingTag,
		existingTagAccountID,
		existingTagPermission,
		gtmAnalyticsPropertyID,
		gtmAnalyticsAccountID,
		gtmModuleActive,
	] );
}
