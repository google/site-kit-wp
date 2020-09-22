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
	const { setAccountID, selectProperty } = useDispatch( STORE_NAME );

	const {
		existingTag,
		existingTagAccountID,
		gtmAnalyticsPropertyID,
		gtmAnalyticsAccountID,
		gtmModuleActive,
	} = useSelect( ( select ) => {
		const store = select( STORE_NAME );

		const data = {
			existingTag: store.getExistingTag(),
			existingTagAccountID: '',
			gtmAnalyticsPropertyID: select( MODULES_TAGMANAGER ).getSingleAnalyticsPropertyID(),
			gtmAnalyticsAccountID: '',
			gtmModuleActive: select( CORE_MODULES ).isModuleActive( 'tagmanager' ),
		};

		if ( data.existingTag ) {
			const {
				permission = false,
				accountID = '',
			} = store.getTagPermission( data.existingTag ) || {};

			if ( permission ) {
				data.existingTagAccountID = accountID;
			}
		}

		if ( data.gtmAnalyticsPropertyID ) {
			const {
				permission = false,
				accountID = '',
			} = store.getTagPermission( data.gtmAnalyticsPropertyID ) || {};

			if ( permission ) {
				data.gtmAnalyticsAccountID = accountID;
			}
		}

		return data;
	} );

	useEffect( () => {
		if ( existingTag && existingTagAccountID ) {
			// There is an existing Analytics tag, select it.
			setAccountID( existingTagAccountID );
			selectProperty( existingTag );
		} else if ( gtmModuleActive && gtmAnalyticsPropertyID && gtmAnalyticsAccountID ) {
			// GTM container has GA tag and user has access to it, force select it.
			setAccountID( gtmAnalyticsAccountID );
			selectProperty( gtmAnalyticsPropertyID );
		}
	}, [ existingTag, existingTagAccountID, gtmAnalyticsPropertyID, gtmAnalyticsAccountID, gtmModuleActive ] );
}
