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
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import { MODULES_TAGMANAGER } from '../../tagmanager/datastore/constants';
const { useSelect, useDispatch } = Data;

export default function useExistingTagEffect() {
	const { setAccountID, selectProperty, setUseSnippet } = useDispatch(
		MODULES_ANALYTICS
	);
	const gtmModuleActive = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleActive( 'tagmanager' )
	);

	const {
		existingTag,
		existingTagAccountID,
		gtmAnalyticsPropertyID,
		gtmAnalyticsAccountID,
	} = useSelect( ( select ) => {
		const data = {
			existingTag: select( MODULES_ANALYTICS ).getExistingTag(),
			existingTagAccountID: '',
			gtmAnalyticsPropertyID: '',
			gtmAnalyticsAccountID: '',
		};

		if ( data.existingTag ) {
			// Just check existing tag permissions, if it is available and ignore tag manager settings.
			const { accountID = '' } =
				select( MODULES_ANALYTICS ).getTagPermission(
					data.existingTag
				) || {};
			data.existingTagAccountID = accountID;
		} else {
			// There is no existing tag; try to get a property ID from GTM.
			data.gtmAnalyticsPropertyID = select(
				MODULES_TAGMANAGER
			).getSingleAnalyticsPropertyID();

			if ( data.gtmAnalyticsPropertyID ) {
				const { accountID = '' } =
					select( MODULES_ANALYTICS ).getTagPermission(
						data.gtmAnalyticsPropertyID
					) || {};
				data.gtmAnalyticsAccountID = accountID;
			}
		}

		return data;
	} );

	useEffect( () => {
		if ( existingTag ) {
			// Disable the Analytics snippet if there is an existing tag, though
			// the user can still override this setting if they like.
			setUseSnippet( false );

			if ( existingTagAccountID ) {
				// There is an existing Analytics tag, select it.
				setAccountID( existingTagAccountID );
				selectProperty( existingTag );
			}
		} else if (
			gtmModuleActive &&
			gtmAnalyticsPropertyID &&
			gtmAnalyticsAccountID
		) {
			// GTM container has GA tag and user has access to it, force select it.
			setAccountID( gtmAnalyticsAccountID );
			selectProperty( gtmAnalyticsPropertyID );
		}
	}, [
		existingTag,
		existingTagAccountID,
		gtmAnalyticsPropertyID,
		gtmAnalyticsAccountID,
		gtmModuleActive,
		selectProperty,
		setAccountID,
		setUseSnippet,
	] );
}
