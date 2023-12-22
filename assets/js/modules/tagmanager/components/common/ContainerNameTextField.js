/**
 * ContainerNameTextField component.
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
import PropTypes from 'prop-types';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { MODULES_TAGMANAGER, FORM_SETUP } from '../../datastore/constants';
import { CORE_FORMS } from '../../../../googlesitekit/datastore/forms/constants';
import { TextField } from 'googlesitekit-components';
import { isUniqueContainerName } from '../../util';
import WarningIcon from '../../../../../svg/icons/warning-v2.svg';
const { useSelect, useDispatch } = Data;

export default function ContainerNameTextField( { label, name } ) {
	const containers = useSelect( ( select ) => {
		const accountID = select( MODULES_TAGMANAGER ).getAccountID();
		return select( MODULES_TAGMANAGER ).getContainers( accountID );
	} );
	const containerName = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue( FORM_SETUP, name )
	);

	const { setValues } = useDispatch( CORE_FORMS );
	const onChange = useCallback(
		( { currentTarget } ) => {
			setValues( FORM_SETUP, { [ name ]: currentTarget.value } );
		},
		[ name, setValues ]
	);

	const isUniqueName = isUniqueContainerName( containerName, containers );

	const helperText =
		containerName && ! isUniqueName
			? __(
					'A container with this name already exists.',
					'google-site-kit'
			  )
			: false;

	const trailingIcon =
		containerName && ! isUniqueName ? (
			<span className="googlesitekit-text-field-icon--error">
				<WarningIcon width={ 14 } height={ 12 } />
			</span>
		) : (
			false
		);

	return (
		<div
			className={ classnames(
				'googlesitekit-tagmanager-containername',
				`googlesitekit-tagmanager-${ name }`
			) }
		>
			<TextField
				className={ classnames( {
					'mdc-text-field--error': ! containerName || ! isUniqueName,
				} ) }
				label={ label }
				outlined
				helperText={ helperText }
				trailingIcon={ trailingIcon }
				id={ name }
				name={ name }
				value={ containerName }
				onChange={ onChange }
			/>
		</div>
	);
}

ContainerNameTextField.propTypes = {
	label: PropTypes.string.isRequired,
	name: PropTypes.string.isRequired,
};
