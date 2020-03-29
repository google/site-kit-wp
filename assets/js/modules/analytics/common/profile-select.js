/**
 * Analytics Profile Select component.
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

import { Select, Option } from 'SiteKitCore/material-components';
import PropTypes from 'prop-types';
import { __ } from '@wordpress/i18n';
import { useCallback } from '@wordpress/element';
import {
	useSelect as useSelectHook,
	useDispatch as useDispatchHook,
} from '@wordpress/data';

import { STORE_NAME } from '../datastore';
import { PROFILE_CREATE } from '../datastore/profiles';
import { isValidPropertyID, isValidAccountID } from '../util';

export default function ProfileSelect( { useSelect, useDispatch } ) {
	const {
		accountID: existingTagAccountID,
		propertyID: existingTagPropertyID,
	} = useSelect( ( select ) => select( STORE_NAME ).getExistingTag() ) || {};
	const currentAccountID = useSelect( ( select ) => select( STORE_NAME ).getAccountID() );
	const accountID = existingTagAccountID || currentAccountID;
	const currentPropertyID = useSelect( ( select ) => select( STORE_NAME ).getPropertyID() );
	const propertyID = existingTagPropertyID || currentPropertyID;
	const profiles = useSelect( ( select ) => select( STORE_NAME ).getProfiles( accountID, propertyID ) ) || [];
	const profileID = useSelect( ( select ) => select( STORE_NAME ).getProfileID() );

	const { setProfileID } = useDispatch( STORE_NAME );
	const onChange = useCallback( ( index, item ) => {
		setProfileID( item.dataset.value );
	}, [ profileID ] );

	return (
		<Select
			className="googlesitekit-analytics__select-profile"
			label={ __( 'View', 'google-site-kit' ) }
			value={ profileID }
			onEnhancedChange={ onChange }
			disabled={ ! isValidAccountID( accountID ) || ! isValidPropertyID( propertyID ) }
			enhanced
			outlined
		>
			{ profiles
				.concat( {
					id: PROFILE_CREATE,
					name: __( 'Setup a new profile', 'google-site-kit' ),
				} )
				.map( ( { id, name }, index ) => (
					<Option
						key={ index }
						value={ id }
					>
						{ name }
					</Option>
				) ) }
		</Select>
	);
}

ProfileSelect.propTypes = {
	useSelect: PropTypes.func,
	useDispatch: PropTypes.func,
};

ProfileSelect.defaultProps = {
	useSelect: useSelectHook,
	useDispatch: useDispatchHook,
};

