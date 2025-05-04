/**
 * Tag Manager Account Select component.
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
import { MODULES_TAGMANAGER, ACCOUNT_CREATE } from '../../datastore/constants';
import { trackEvent } from '../../../../util/tracking';
import useViewContext from '../../../../hooks/useViewContext';

export default function AccountSelect( { hasModuleAccess } ) {
	const viewContext = useViewContext();

	const accounts = useSelect( ( select ) =>
		select( MODULES_TAGMANAGER ).getAccounts()
	);
	const hasResolvedAccounts = useSelect( ( select ) =>
		select( MODULES_TAGMANAGER ).hasFinishedResolution( 'getAccounts' )
	);
	const accountID = useSelect( ( select ) =>
		select( MODULES_TAGMANAGER ).getAccountID()
	);

	const { selectAccount } = useDispatch( MODULES_TAGMANAGER );
	const onChange = useCallback(
		( index, item ) => {
			const newAccountID = item.dataset.value;
			if ( accountID !== newAccountID ) {
				const eventAction =
					newAccountID === ACCOUNT_CREATE
						? 'change_account_new'
						: 'change_account';
				trackEvent( `${ viewContext }_tagmanager`, eventAction );

				selectAccount( newAccountID );
			}
		},
		[ accountID, selectAccount, viewContext ]
	);

	if ( ! hasResolvedAccounts ) {
		return <ProgressBar small />;
	}

	if ( hasModuleAccess === false ) {
		return (
			<Select
				className="googlesitekit-tagmanager__select-account"
				label={ __( 'Account', 'google-site-kit' ) }
				value={ accountID }
				enhanced
				outlined
				disabled
			>
				<Option value={ accountID }>{ accountID }</Option>
			</Select>
		);
	}

	return (
		<Select
			className="googlesitekit-tagmanager__select-account"
			label={ __( 'Account', 'google-site-kit' ) }
			value={ accountID }
			onEnhancedChange={ onChange }
			enhanced
			outlined
		>
			{ ( accounts || [] )
				.concat( {
					accountId: ACCOUNT_CREATE, // eslint-disable-line sitekit/acronym-case
					name: __( 'Set up a new account', 'google-site-kit' ),
				} )
				.map(
					(
						{ accountId, name } // eslint-disable-line sitekit/acronym-case
					) => (
						<Option
							key={ accountId } // eslint-disable-line sitekit/acronym-case
							value={ accountId } // eslint-disable-line sitekit/acronym-case
						>
							{ name }
						</Option>
					)
				) }
		</Select>
	);
}

AccountSelect.propTypes = {
	hasModuleAccess: PropTypes.bool,
};
