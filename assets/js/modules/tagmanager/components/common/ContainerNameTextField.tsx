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
import classnames from 'classnames';
import { ChangeEvent, FC } from 'react';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { TextField } from 'googlesitekit-components';
import { useSelect } from 'googlesitekit-data';
import useFormValue from '@/js/hooks/useFormValue';
import {
	FORM_SETUP,
	MODULES_TAGMANAGER,
} from '@/js/modules/tagmanager/datastore/constants';
import { isUniqueContainerName } from '@/js/modules/tagmanager/util';

interface ContainerNameTextFieldProps {
	label: string;
	name: string;
}

const ContainerNameTextField: FC< ContainerNameTextFieldProps > = ( {
	label,
	name,
} ) => {
	const containers = useSelect( ( select ) => {
		// @ts-expect-error Data store is not yet typed.
		const accountID = select( MODULES_TAGMANAGER ).getAccountID();
		// @ts-expect-error Data store is not yet typed.
		return select( MODULES_TAGMANAGER ).getContainers( accountID );
	}, [] );
	const [ containerName, setContainerName ] = useFormValue(
		FORM_SETUP,
		name
	);

	const onChange = useCallback(
		( { currentTarget }: ChangeEvent< HTMLInputElement > ) => {
			setContainerName( currentTarget.value );
		},
		[ setContainerName ]
	);

	const isUniqueName = isUniqueContainerName( containerName, containers );

	// `TextField` derives its error state and accessible wiring entirely
	// from `errorMessage`, so both error conditions are unified into one
	// message here rather than needing a separate `hasError`/
	// `ariaErrorMessage` path for the "required" case.
	let errorMessage;

	if ( ! containerName ) {
		errorMessage = __( 'A container name is required', 'google-site-kit' );
	} else if ( ! isUniqueName ) {
		errorMessage = __(
			'A container with this name already exists',
			'google-site-kit'
		);
	}

	return (
		<div
			className={ classnames(
				'googlesitekit-tagmanager-containername',
				`googlesitekit-tagmanager-${ name }`
			) }
		>
			<TextField
				label={ label }
				errorMessage={ errorMessage }
				id={ name }
				name={ name }
				value={ containerName }
				onChange={ onChange }
				outlined
			/>
		</div>
	);
};

export default ContainerNameTextField;
