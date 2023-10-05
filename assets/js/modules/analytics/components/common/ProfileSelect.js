/**
 * Analytics Profile Select component.
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
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Option, ProgressBar, Select } from 'googlesitekit-components';
import Data from 'googlesitekit-data';
import { MODULES_ANALYTICS, PROFILE_CREATE } from '../../datastore/constants';
import { isValidPropertySelection, isValidAccountSelection } from '../../util';
import { trackEvent } from '../../../../util';
import useViewContext from '../../../../hooks/useViewContext';
import { useFeature } from '../../../../hooks/useFeature';
const { useSelect, useDispatch } = Data;

export default function ProfileSelect( { hasModuleAccess } ) {
	const ga4ReportingEnabled = useFeature( 'ga4Reporting' );

	const accountID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getAccountID()
	);
	const propertyID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getPropertyID()
	);
	const profileID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getProfileID()
	);

	const profiles = useSelect( ( select ) => {
		if ( hasModuleAccess === false ) {
			return null;
		}

		return (
			select( MODULES_ANALYTICS ).getProfiles( accountID, propertyID ) ||
			[]
		);
	} );

	const isLoading = useSelect( ( select ) => {
		return (
			! select( MODULES_ANALYTICS ).hasFinishedResolution(
				'getAccounts'
			) ||
			select( MODULES_ANALYTICS ).isResolving( 'getProperties', [
				accountID,
			] ) ||
			select( MODULES_ANALYTICS ).isResolving( 'getProfiles', [
				accountID,
				propertyID,
			] )
		);
	} );

	const { setProfileID } = useDispatch( MODULES_ANALYTICS );
	const viewContext = useViewContext();
	const onChange = useCallback(
		( index, item ) => {
			const newProfileID = item.dataset.value;
			if ( profileID !== newProfileID ) {
				setProfileID( item.dataset.value );
				const action =
					newProfileID === PROFILE_CREATE
						? 'change_profile_new'
						: 'change_profile';
				trackEvent( `${ viewContext }_analytics`, action );
			}
		},
		[ profileID, setProfileID, viewContext ]
	);

	if (
		! isValidAccountSelection( accountID ) ||
		! isValidPropertySelection( propertyID )
	) {
		return null;
	}

	if ( isLoading ) {
		return <ProgressBar small />;
	}

	if ( hasModuleAccess === false ) {
		return (
			<Select
				className="googlesitekit-analytics__select-profile"
				label={ __( 'View', 'google-site-kit' ) }
				value={ profileID }
				enhanced
				outlined
				disabled
			>
				<Option value={ profileID }>{ profileID }</Option>
			</Select>
		);
	}

	const displayProfiles =
		ga4ReportingEnabled ||
		profiles.some( ( profile ) => profile.id === PROFILE_CREATE )
			? profiles
			: [
					...profiles,
					{
						id: PROFILE_CREATE,
						name: __( 'Set up a new view', 'google-site-kit' ),
					},
			  ];

	return (
		<Select
			className="googlesitekit-analytics__select-profile"
			label={ __( 'View', 'google-site-kit' ) }
			value={ profileID }
			onEnhancedChange={ onChange }
			enhanced
			outlined
		>
			{ displayProfiles.map( ( { id, name }, index ) => (
				<Option key={ index } value={ id }>
					{ name }
				</Option>
			) ) }
		</Select>
	);
}
