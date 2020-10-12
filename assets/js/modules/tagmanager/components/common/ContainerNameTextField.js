/**
 * ContainerNameTextField component.
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
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME as CORE_FORMS } from '../../../../googlesitekit/datastore/forms';
import { TextField, HelperText, Input } from '../../../../material-components';
import { FORM_SETUP } from '../../datastore/constants';
import { isUniqueContainerName } from '../../util';
const { useSelect, useDispatch } = Data;

export default function ContainerNameTextField( { label, containers, formFieldID } ) {
	const containerName = useSelect( ( select ) => select( CORE_FORMS ).getValue( FORM_SETUP, formFieldID ) );

	const { setValues } = useDispatch( CORE_FORMS );
	const onChange = useCallback( ( { currentTarget } ) => {
		setValues( FORM_SETUP, { [ formFieldID ]: currentTarget.value } );
	}, [ formFieldID ] );

	const helperText = containerName && ! isUniqueContainerName( containerName, containers )
		? <HelperText persistent>{ __( 'A container with this name already exists.', 'google-site-kit' ) }</HelperText>
		: undefined;

	let trailingIcon;
	if ( helperText ) {
		trailingIcon = (
			<span className="googlesitekit-text-field-icon--warning">
				<span className="screen-reader-text">
					{ __( 'Warning', 'google-site-kit' ) }
				</span>
			</span>
		);
	}

	return (
		<div className="googlesitekit-tagmanager-containername">
			<TextField label={ label } outlined helperText={ helperText } trailingIcon={ trailingIcon }>
				<Input value={ containerName } onChange={ onChange } />
			</TextField>
		</div>
	);
}

ContainerNameTextField.propTypes = {
	label: PropTypes.string.isRequired,
	formFieldID: PropTypes.string.isRequired,
	containers: PropTypes.arrayOf( PropTypes.object ),
};
