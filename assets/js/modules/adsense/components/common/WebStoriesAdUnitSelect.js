/**
 * AdSense Web Stories Ad Unit Select component.
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
import { useSelect, useDispatch } from 'googlesitekit-data';
import { MODULES_ADSENSE } from '../../datastore/constants';

export default function WebStoriesAdUnitSelect() {
	const accountID = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getAccountID()
	);
	const clientID = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getClientID()
	);
	const webStoriesAdUnit = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getWebStoriesAdUnit()
	);
	const adunits = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getAdUnits( accountID, clientID )
	);
	const hasResolvedAdUnits = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).hasFinishedResolution( 'getAdUnits', [
			accountID,
			clientID,
		] )
	);

	const { setWebStoriesAdUnit } = useDispatch( MODULES_ADSENSE );
	const onChange = useCallback(
		( index, item ) => {
			const newWebStoriesAdUnit = item.dataset.value;
			if ( webStoriesAdUnit !== newWebStoriesAdUnit ) {
				setWebStoriesAdUnit( newWebStoriesAdUnit );
			}
		},
		[ webStoriesAdUnit, setWebStoriesAdUnit ]
	);

	if ( ! hasResolvedAdUnits ) {
		return <ProgressBar small />;
	}

	return (
		<Select
			className="googlesitekit-adsense__select-field"
			label={ __( 'Web Stories Ad Unit', 'google-site-kit' ) }
			value={ webStoriesAdUnit }
			onEnhancedChange={ onChange }
			enhanced
			outlined
		>
			<Option value="">
				{ __( 'Select ad unit', 'google-site-kit' ) }
			</Option>
			{ ( adunits || [] ).map( ( { _id, displayName } ) => (
				<Option key={ _id } value={ _id }>
					{ displayName }
				</Option>
			) ) }
		</Select>
	);
}
