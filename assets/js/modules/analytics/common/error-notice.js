/**
 * Analytics Error component.
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
const { useSelect } = Data;

export default function ErrorNotice() {
	const error = useSelect( ( select ) => select( STORE_NAME ).getError() );

	if ( ! error ) {
		return null;
	}

	return (
		<div className="googlesitekit-error-text">
			<p>
				{
					sprintf(
						/* translators: %s: Error message */
						__( 'Error: %s', 'google-site-kit' ),
						error.message
					)
				}
			</p>
		</div>
	);
}
