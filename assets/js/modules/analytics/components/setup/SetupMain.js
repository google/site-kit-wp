/**
 * Analytics Main setup component.
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
import { _x } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { ProgressBar } from 'googlesitekit-components';
import AnalyticsIcon from '../../../../../svg/graphics/analytics.svg';
import { MODULES_ANALYTICS, ACCOUNT_CREATE } from '../../datastore/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import useExistingTagEffectUA from '../../hooks/useExistingTagEffect';
import useExistingTagEffectGA4 from '../../../analytics-4/hooks/useExistingTagEffect';
import { MODULES_ANALYTICS_4 } from '../../../analytics-4/datastore/constants';
import { AccountCreate, AccountCreateLegacy } from '../common';
import { SetupForm } from '../../../analytics-4/components/setup';
const { useSelect, useDispatch } = Data;

export default function SetupMain( { finishSetup } ) {
	const accounts = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getAccountSummaries()
	);
	const accountID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getAccountID()
	);
	const hasResolvedAccounts = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
			'getAccountSummaries'
		)
	);
	const usingProxy = useSelect( ( select ) =>
		select( CORE_SITE ).isUsingProxy()
	);
	const setupFlowMode = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getSetupFlowMode()
	);

	const { setAccountID } = useDispatch( MODULES_ANALYTICS_4 );

	// TODO: Remove this when the legacy 'analytics' module is removed (see #7932).
	// Temporarily added so that the module setup and settings work in the meantime.
	const { setAccountID: setLegacyAnalyticsAccountID } =
		useDispatch( MODULES_ANALYTICS );

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
				setLegacyAnalyticsAccountID( matchedAccount._id );
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
		setLegacyAnalyticsAccountID,
		accountID,
		matchAndSelectProperty,
	] );

	// Set the accountID and containerID if there is an existing tag.
	useExistingTagEffectUA();
	useExistingTagEffectGA4();

	const isCreateAccount = ACCOUNT_CREATE === accountID;

	let viewComponent;
	// Here we also check for `hasResolvedAccounts` to prevent showing a different case below
	// when the component initially loads and has yet to start fetching accounts.
	if (
		! hasResolvedAccounts ||
		isMatchedAccount ||
		setupFlowMode === undefined
	) {
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
