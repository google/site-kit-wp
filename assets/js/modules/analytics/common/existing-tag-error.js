/**
 * Analytics Existing Tag Error component.
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
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME } from '../datastore/constants';
import ErrorText from '../../../components/error-text';
const { useSelect } = Data;

export default function ExistingTagError() {
	const propertyID = useSelect( ( select ) => select( STORE_NAME ).getExistingTag() );

	if ( ! propertyID ) {
		return null;
	}

	const message = sprintf(
		/* translators: %s: Property id of the existing tag */
		__( 'We\'ve detected there\'s already an existing Analytics tag on your site (ID %s), but your account doesn\'t seem to have access to this Analytics property. You can either remove the existing tag and connect to a different account, or request access to this property from your team.', 'google-site-kit' ),
		propertyID
	);

	return <ErrorText message={ message } />;
}
