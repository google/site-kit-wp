/**
 * Analytics Existing Tag Notice component.
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
import { sprintf, __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import {
	STORE_NAME,
	MODULES_ANALYTICS,
} from '../../datastore/constants';
import { useFeature } from '../../../../hooks/useFeature';
import { MODULES_ANALYTICS_4 } from '../../../analytics-4/datastore/constants';
const { useSelect } = Data;

export default function ExistingTagNotice() {
	const hasExistingTag = useSelect( ( select ) => select( STORE_NAME ).hasExistingTag() );
	// why is propertyID called getExistingTag? I don't think it should be. TO DISCUSS!
	const propertyID = useSelect( ( select ) => select( STORE_NAME ).getExistingTag() );
	const ga4setupEnabled = useFeature( 'ga4setup' );

	// Works!
	const uaexistingTag = useSelect( ( select ) => select( MODULES_ANALYTICS ).getExistingTag() );
	console.debug( 'uaexistingTag ', uaexistingTag );

	// const ga4existingTag = useSelect( ( select ) => select( MODULES_ANALYTICS ).getExistingTag() );
	// console.debug( 'ga4existingTag ', ga4existingTag );

	const uaPropertyID = useSelect( ( select ) => select( MODULES_ANALYTICS ).getPropertyID() );
	console.debug( 'uaPropertyID ', uaPropertyID );

	// const ga4PropertyID = useSelect( ( select ) => select( MODULES_ANALYTICS_4 ).getPropertyID() );
	// console.debug( 'ga4PropertyID ', ga4PropertyID );

	// how come is null if i'm setting this?
	// console.debug( 'propertyID ', propertyID );

	// not sure if this rule is even needed!
	if ( ! hasExistingTag ) {
		return null;
	}

	if ( ! ga4setupEnabled ) {
		return (
			<p>
				{
					sprintf(
					/* translators: %s: Analytics tag ID */
						__( 'An existing Analytics tag was found on your site with the ID %s. If later on you decide to replace this tag, Site Kit can place the new tag for you. Make sure you remove the old tag first.', 'google-site-kit' ),
						propertyID
					)
				}
			</p>
		);
	}

	return <p>ga4 enabled</p>;
}
