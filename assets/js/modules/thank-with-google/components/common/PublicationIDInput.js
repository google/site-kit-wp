/**
 * Thank with Google Publication ID Input component.
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
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { MODULES_THANK_WITH_GOOGLE } from '../../datastore/constants';
import { TextField, Input } from '../../../../material-components';
import { isValidPublicationID } from '../../util/validation';
const { useDispatch, useSelect } = Data;

export default function PublicationIDInput() {
	// Get value.
	const publicationID = useSelect( ( select ) =>
		select( MODULES_THANK_WITH_GOOGLE ).getPublicationID()
	);

	// Handle form input.
	const { setPublicationID } = useDispatch( MODULES_THANK_WITH_GOOGLE );
	const onChange = useCallback(
		( { currentTarget } ) => {
			setPublicationID( currentTarget.value.trim() );
		},
		[ setPublicationID ]
	);

	// Bail if the value isn't ready.
	if ( publicationID === undefined ) {
		return null;
	}

	return (
		<TextField
			className={ classnames( {
				'mdc-text-field--error':
					publicationID && ! isValidPublicationID( publicationID ),
			} ) }
			label="Publication ID"
			outlined
		>
			<Input
				id="publicationID"
				name="publicationID"
				value={ publicationID }
				onChange={ onChange }
			/>
		</TextField>
	);
}
