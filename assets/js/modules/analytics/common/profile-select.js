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

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { Select, Option } from '../../../material-components';
import ProgressBar from '../../../components/progress-bar';
import { STORE_NAME, PROFILE_CREATE } from '../datastore/constants';
import { isValidPropertyID, isValidAccountID } from '../util';
import { trackEvent } from '../../../util';
const { useSelect, useDispatch } = Data;

export default function ProfileSelect() {
	const accountID = useSelect( ( select ) => select( STORE_NAME ).getAccountID() );
	const propertyID = useSelect( ( select ) => select( STORE_NAME ).getPropertyID() );
	const profiles = useSelect( ( select ) => select( STORE_NAME ).getProfiles( accountID, propertyID ) );
	const profileID = useSelect( ( select ) => select( STORE_NAME ).getProfileID() );
	const isLoadingProperties = useSelect( ( select ) => select( STORE_NAME ).isDoingGetProperties( accountID ) );
	const isLoadingProfiles = useSelect( ( select ) => select( STORE_NAME ).isDoingGetProfiles( accountID, propertyID ) );

	const { setProfileID } = useDispatch( STORE_NAME );
	const onChange = useCallback( ( index, item ) => {
		const newProfileID = item.dataset.value;
		if ( profileID !== newProfileID ) {
			setProfileID( item.dataset.value );
			trackEvent( 'analytics_setup', 'profile_change', item.dataset.value );
		}
	}, [ profileID ] );

	if ( isLoadingProperties || isLoadingProfiles ) {
		return <ProgressBar small />;
	}

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
			{ ( profiles || [] )
				.concat( {
					id: PROFILE_CREATE,
					name: __( 'Set up a new profile', 'google-site-kit' ),
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
