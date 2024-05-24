/**
 * Analytics Main setup component.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { _x } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { ProgressBar } from 'googlesitekit-components';
import AnalyticsIcon from '../../../../../svg/graphics/analytics.svg';
import SetupForm from './SetupForm';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { MODULES_ANALYTICS_4, ACCOUNT_CREATE } from '../../datastore/constants';
import useExistingTagEffect from '../../hooks/useExistingTagEffect';
import { AccountCreate, AccountCreateLegacy } from '../common';

export default function SetupMain( { finishSetup } ) {
	const accounts = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getAccountSummaries()
	);
	const accountID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getAccountID()
	);
	const hasResolvedAccounts = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
			'getAccountSummaries'
		)
	);
	const usingProxy = useSelect( ( select ) =>
		select( CORE_SITE ).isUsingProxy()
	);

	const { setAccountID } = useDispatch( MODULES_ANALYTICS_4 );
	const { findMatchedAccount, matchAndSelectProperty } =
		useDispatch( MODULES_ANALYTICS_4 );
	const [ isMatchedAccount, setIsMatchedAccount ] = useState( false );
	useEffect( () => {
		if ( ! accounts ) {
			return;
		}

		const fetchMatchedAccount = async () => {
			setIsMatchedAccount( true );
			const matchedAccount = await findMatchedAccount();
			setIsMatchedAccount( false );
			if ( matchedAccount ) {
				setAccountID( matchedAccount._id );
				matchAndSelectProperty( matchedAccount._id );
			}
		};

		if ( ! accountID ) {
			fetchMatchedAccount();
		}
	}, [
		findMatchedAccount,
		accounts,
		setAccountID,
		accountID,
		matchAndSelectProperty,
	] );

	// Set the accountID and containerID if there is an existing tag.
	useExistingTagEffect();

	const isCreateAccount = ACCOUNT_CREATE === accountID;

	let viewComponent;
	// Here we also check for `hasResolvedAccounts` to prevent showing a different case below
	// when the component initially loads and has yet to start fetching accounts.
	if ( ! hasResolvedAccounts || isMatchedAccount ) {
		viewComponent = <ProgressBar />;
	} else if (
		isCreateAccount ||
		( Array.isArray( accounts ) && ! accounts.length )
	) {
		viewComponent = usingProxy ? (
			<AccountCreate />
		) : (
			<AccountCreateLegacy />
		);
	} else {
		viewComponent = <SetupForm finishSetup={ finishSetup } />;
	}

	return (
		<div className="googlesitekit-setup-module googlesitekit-setup-module--analytics">
			<div className="googlesitekit-setup-module__logo">
				<AnalyticsIcon width="33" height="33" />
			</div>

			<h2 className="googlesitekit-heading-3 googlesitekit-setup-module__title">
				{ _x( 'Analytics', 'Service name', 'google-site-kit' ) }
			</h2>

			{ viewComponent }
		</div>
	);
}

SetupMain.propTypes = {
	finishSetup: PropTypes.func,
};

SetupMain.defaultProps = {
	finishSetup: () => {},
};
