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
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import { STORE_NAME } from '../datastore/constants';
const { useSelect, useDispatch } = Data;

export default function useExistingTagEffect() {
	const hasExistingTag = useSelect( ( select ) => select( STORE_NAME ).hasExistingTag() );
	const existingTag = useSelect( ( select ) => select( STORE_NAME ).getExistingTag() );
	const existingTagPermission = useSelect( ( select ) => select( STORE_NAME ).getTagPermission( existingTag ) );
	const hasExistingTagPermission = useSelect( ( select ) => select( STORE_NAME ).hasExistingTagPermission() );

	const singleAnalyticsPropertyID = useSelect( ( select ) => select( STORE_NAME ).getSingleAnalyticsPropertyID() );
	const analyticsModuleActive = useSelect( ( select ) => select( CORE_MODULES ).isModuleActive( 'analytics' ) );
	const isPrimaryAMP = useSelect( ( select ) => select( CORE_SITE ).isPrimaryAMP() );

	const { selectAccount, selectContainerByID, setGaAMPPropertyID, setGaPropertyID } = useDispatch( STORE_NAME );

	useEffect( () => {
		( async () => {
			if ( hasExistingTag && hasExistingTagPermission ) {
				await selectAccount( existingTagPermission.accountID );
				await selectContainerByID( existingTag );
			}

			// If a singular property ID is set in the container(s) and Analytics is active,
			// we store the property ID which prevents the Analytics module from including
			// the snippet using the backend googlesitekit_analytics_can_use_snippet hook to
			// prevent duplicate measurement.
			// The stored property ID is then used to re-enable the Analytics snippet if
			// Tag Manager is disconnected in future.
			if ( singleAnalyticsPropertyID && analyticsModuleActive ) {
				// Set the GA property ID in the Tag Manager store.
				if ( isPrimaryAMP ) {
					await setGaAMPPropertyID( singleAnalyticsPropertyID );
				} else {
					await setGaPropertyID( singleAnalyticsPropertyID );
				}
			}
		} )();
	}, [ hasExistingTag, existingTag, hasExistingTagPermission, existingTagPermission, singleAnalyticsPropertyID, analyticsModuleActive ] );
}
