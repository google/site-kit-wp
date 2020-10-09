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
const { useSelect, useDispatch } = Data;

export default function ContainerNameTextField( { label, containers, formFieldID } ) {
	const containerName = useSelect( ( select ) => select( CORE_FORMS ).getValue( FORM_SETUP, formFieldID ) );

	const { setValues } = useDispatch( CORE_FORMS );
	const onChange = useCallback( ( { currentTarget } ) => {
		setValues( FORM_SETUP, { [ formFieldID ]: currentTarget.value } );
	}, [ formFieldID ] );

	let helperText;

	if ( containerName ) {
		const existingContainer = Array.isArray( containers ) && containers.some( ( { name } ) => name === containerName );
		if ( existingContainer ) {
			helperText = __( 'A container with this name already exists.', 'google-site-kit' );
		} else if ( containerName.trim() !== containerName ) {
			helperText = __( 'The container name should not have leading or trailing spaces.', 'google-site-kit' );
		} else if ( containerName[ 0 ] === '_' ) {
			helperText = __( 'The container name should not start with an underscore.', 'google-site-kit' );
		}

		// // Decode entities for special characters so that they are stripped properly.
		// $name = wp_specialchars_decode( $name, ENT_QUOTES );
		// // Convert accents to basic characters to prevent them from being stripped.
		// $name = remove_accents( $name );
		// // Strip all non-simple characters.
		// $name = preg_replace( '/[^a-zA-Z0-9_., -]/', '', $name );
		// // Collapse multiple whitespaces.
		// $name = preg_replace( '/\s+/', ' ', $name );
	}

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
			<TextField
				label={ label }
				outlined
				helperText={ <HelperText persistent>{ helperText }</HelperText> }
				trailingIcon={ trailingIcon }
			>
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
