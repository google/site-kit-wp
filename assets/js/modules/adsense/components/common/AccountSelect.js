/**
 * AdSense Account Select component.
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
import { trackEvent } from '../../../../util';
import { MODULES_ADSENSE } from '../../datastore/constants';
import useViewContext from '../../../../hooks/useViewContext';
const { useSelect, useDispatch } = Data;

export default function AccountSelect() {
	const viewContext = useViewContext();
	const eventCategory = `${ viewContext }_adsense`;

	const accountID = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getAccountID()
	);
	const accounts = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getAccounts()
	);
	const hasResolvedAccounts = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).hasFinishedResolution( 'getAccounts' )
	);

	const { setAccountID } = useDispatch( MODULES_ADSENSE );
	const onChange = useCallback(
		( index, item ) => {
			const newAccountID = item.dataset.value;
			if ( accountID !== newAccountID ) {
				setAccountID( newAccountID );
				trackEvent( eventCategory, 'change_account' );
			}
		},
		[ accountID, eventCategory, setAccountID ]
	);

	if ( ! hasResolvedAccounts ) {
		return <ProgressBar small />;
	}

	return (
		<Select
			className="googlesitekit-adsense__select-account"
			label={ __( 'Account', 'google-site-kit' ) }
			value={ accountID }
			onEnhancedChange={ onChange }
			enhanced
			outlined
		>
			{ ( accounts || [] ).map( ( { _id, displayName }, index ) => (
				<Option key={ index } value={ _id }>
					{ displayName }
				</Option>
			) ) }
		</Select>
	);
}
