/**
 * Analytics Account Select component.
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
import Data from 'googlesitekit-data';
import ProgressBar from '../../../../components/ProgressBar';
import { Select, Option } from '../../../../material-components';
import { STORE_NAME, ACCOUNT_CREATE } from '../../datastore/constants';
import { MODULES_TAGMANAGER } from '../../../tagmanager/datastore/constants';
import { trackEvent } from '../../../../util';
const { useSelect, useDispatch } = Data;

export default function AccountSelect() {
	const accountID = useSelect( ( select ) => select( STORE_NAME ).getAccountID() );

	const { accounts, hasResolvedAccounts } = useSelect( ( select ) => ( {
		accounts: select( STORE_NAME ).getAccounts(),
		hasResolvedAccounts: select( STORE_NAME ).hasFinishedResolution( 'getAccounts' ),
	} ) );

	const { hasExistingTag, hasGTMPropertyID } = useSelect( ( select ) => {
		const data = {
			hasExistingTag: select( STORE_NAME ).hasExistingTag(),
			hasGTMPropertyID: false,
		};

		// No need to get a single Analytics property ID if we already have an existing Analytics tag.
		if ( ! data.hasExistingTag ) {
			data.hasGTMPropertyID = !! select( MODULES_TAGMANAGER ).getSingleAnalyticsPropertyID();
		}

		return data;
	} );

	const { selectAccount } = useDispatch( STORE_NAME );
	const onChange = useCallback( ( index, item ) => {
		const newAccountID = item.dataset.value;
		if ( accountID !== newAccountID ) {
			selectAccount( newAccountID );
			trackEvent( 'analytics_setup', 'account_change', newAccountID );
		}
	}, [ accountID, selectAccount ] );

	if ( ! hasResolvedAccounts ) {
		return <ProgressBar small />;
	}

	return (
		<Select
			className="googlesitekit-analytics__select-account"
			label={ __( 'Account', 'google-site-kit' ) }
			value={ accountID }
			onEnhancedChange={ onChange }
			disabled={ hasExistingTag || hasGTMPropertyID }
			enhanced
			outlined
		>
			{ ( accounts || [] )
				.concat( {
					id: ACCOUNT_CREATE,
					name: __( 'Set up a new account', 'google-site-kit' ),
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
