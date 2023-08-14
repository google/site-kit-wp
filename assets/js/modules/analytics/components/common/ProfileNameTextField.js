/**
 * Analytics Profile Name component.
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
import { useMount } from 'react-use';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_FORMS } from '../../../../googlesitekit/datastore/forms/constants';
import { TextField } from 'googlesitekit-components';
import {
	MODULES_ANALYTICS,
	PROFILE_CREATE,
	FORM_SETUP,
} from '../../datastore/constants';
import VisuallyHidden from '../../../../components/VisuallyHidden';
const { useSelect, useDispatch } = Data;

export default function ProfileNameTextField() {
	const accountID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getAccountID()
	);
	const propertyID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getPropertyID()
	);
	const profiles = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getProfiles( accountID, propertyID )
	);
	const profileID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getProfileID()
	);
	const profileName = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue( FORM_SETUP, 'profileName' )
	);

	const { setValues } = useDispatch( CORE_FORMS );
	const onChange = useCallback(
		( { currentTarget } ) => {
			setValues( FORM_SETUP, { profileName: currentTarget.value } );
		},
		[ setValues ]
	);

	useMount( () => {
		if ( ! profileName ) {
			setValues( FORM_SETUP, {
				profileName: _x(
					'All Web Site Data',
					'default Analytics view name',
					'google-site-kit'
				),
			} );
		}
	} );

	// bounce if an existing profile is selected
	if ( profileID !== PROFILE_CREATE ) {
		return null;
	}

	const existingProfile =
		Array.isArray( profiles ) &&
		profiles.some( ( { name } ) => name === profileName );

	return (
		<div className="googlesitekit-analytics-profilename">
			<TextField
				label={ __( 'View Name', 'google-site-kit' ) }
				outlined
				helperText={
					existingProfile &&
					__(
						'A view with this name already exists.',
						'google-site-kit'
					)
				}
				trailingIcon={
					existingProfile && (
						<span className="googlesitekit-text-field-icon--warning">
							<VisuallyHidden>
								{ __( 'Warning', 'google-site-kit' ) }
							</VisuallyHidden>
						</span>
					)
				}
				value={ profileName }
				onChange={ onChange }
			/>

			<p>
				{ __(
					'You can make changes to this view (e.g. exclude URL query parameters) in Google Analytics.',
					'google-site-kit'
				) }
			</p>
		</div>
	);
}
