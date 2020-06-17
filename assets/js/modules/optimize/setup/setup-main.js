/**
 * Optimize Main setup component.
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
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import SetupForm from './setup-form';
import ProgressBar from '../../../components/progress-bar';
import { SvgIcon, trackEvent } from '../../../util';
import { STORE_NAME } from '../datastore/constants';
const { useSelect } = Data;

export default function SetupMain( { finishSetup } ) {
	const isDoingSubmitChanges = useSelect( ( select ) => select( STORE_NAME ).isDoingSubmitChanges() );

	// When `finishSetup` is called, flag that we are navigating to keep the progress bar going.
	const [ isNavigating, setIsNavigating ] = useState( false );
	const finishSetupAndNavigate = ( ...args ) => {
		finishSetup( ...args );
		setIsNavigating( true );
	};

	useEffect( () => {
		trackEvent( 'optimize_setup', 'configure_optimize_screen' );
	}, [] );

	let viewComponent;
	// Here we also check for `hasResolvedAccounts` to prevent showing a different case below
	// when the component initially loads and has yet to start fetching accounts.
	if ( isDoingSubmitChanges || isNavigating ) {
		viewComponent = <ProgressBar />;
	} else {
		viewComponent = <SetupForm finishSetup={ finishSetupAndNavigate } />;
	}

	return (
		<div className="googlesitekit-setup-module googlesitekit-setup-module--optimize">

			<div className="googlesitekit-setup-module__logo">
				<SvgIcon id="optimize" width="33" height="33" />
			</div>

			<h2 className="googlesitekit-heading-3 googlesitekit-setup-module__title">
				{ _x( 'Optimize', 'Service name', 'google-site-kit' ) }
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
