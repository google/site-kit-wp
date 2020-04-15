/**
 * Analytics Existing Tag Notice component.
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
import { sprintf, __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME } from '../datastore/constants';
const { useSelect } = Data;

export default function ExistingTagNotice() {
	const hasExistingTag = useSelect( ( select ) => select( STORE_NAME ).hasExistingTag() );
	const propertyID = useSelect( ( select ) => select( STORE_NAME ).getExistingTag() );

	if ( ! hasExistingTag ) {
		return null;
	}

	return (
		<p>
			{
				sprintf(
					/* translators: %s: Analytics tag ID */
					__( 'An existing analytics tag was found on your site with the ID %s. If later on you decide to replace this tag, Site Kit can place the new tag for you. Make sure you remove the old tag first.', 'google-site-kit' ),
					propertyID
				)
			}
		</p>
	);
}
