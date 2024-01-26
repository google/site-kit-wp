/**
 * CompatibilityChecks component.
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
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { ProgressBar } from 'googlesitekit-components';
const { useRegistry } = Data;
import Warning from '../../../../svg/icons/warning.svg';
import { Grid } from '../../../material-components';
import { useChecks } from '../../../hooks/useChecks';
import CompatibilityErrorNotice from './CompatibilityErrorNotice';
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import {
	checkAMPConnectivity,
	checkHealthChecks,
	checkHostname,
	checkWPVersion,
	registryCheckSetupTag,
} from './checks';

const createCompatibilityChecks = ( registry ) => {
	if ( registry.select( CORE_SITE ).isConnected() ) {
		return [];
	}

	return [
		checkHostname,
		checkHealthChecks,
		registryCheckSetupTag( registry ),
		checkAMPConnectivity,
		checkWPVersion,
	];
};

export default function CompatibilityChecks( { children, ...props } ) {
	const registry = useRegistry();
	const { complete, error } = useChecks(
		createCompatibilityChecks( registry )
	);

	const ctaFeedback = error && (
		<Grid alignLeft className="googlesitekit-setup-compat">
			<div className="googlesitekit-setup__warning">
				<Warning />

				<div className="googlesitekit-heading-4">
					{ __(
						'Your site may not be ready for Site Kit',
						'google-site-kit'
					) }
				</div>
			</div>
			<CompatibilityErrorNotice error={ error } />
		</Grid>
	);

	const inProgressFeedback = ! complete && (
		<div className="googlesitekit-margin-left-1rem googlesitekit-align-self-center">
			<small>
				{ __( 'Checking Compatibility…', 'google-site-kit' ) }
			</small>
			<ProgressBar small compress />
		</div>
	);

	return children( {
		props,
		complete,
		error,
		inProgressFeedback,
		ctaFeedback,
	} );
}

CompatibilityChecks.propTypes = {
	children: PropTypes.func.isRequired,
};
