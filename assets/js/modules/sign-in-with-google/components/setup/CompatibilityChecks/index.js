/**
 * Sign in with Google CompatibilityChecks component.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { useRegistry } from 'googlesitekit-data';
import { ProgressBar } from 'googlesitekit-components';
import { useChecks } from '@/js/hooks/useChecks';
import CompatibilityErrorNotice from './CompatibilityErrorNotice';
import { runChecks } from './checks';

function createCompatibilityChecks( registry ) {
	return [ runChecks( registry ) ];
}

export default function CompatibilityChecks( { className, ...props } ) {
	const registry = useRegistry();
	const { complete, error } = useChecks(
		createCompatibilityChecks( registry )
	);

	if ( ! complete ) {
		return (
			<div
				className={ `googlesitekit-margin-bottom-1rem${
					className ? ` ${ className }` : ''
				}` }
				{ ...props }
			>
				<small>
					{ __( 'Checking Compatibility…', 'google-site-kit' ) }
				</small>
				<ProgressBar small compress />
			</div>
		);
	}

	if ( error ) {
		return <CompatibilityErrorNotice error={ error } />;
	}

	return null;
}

CompatibilityChecks.propTypes = {
	className: PropTypes.string,
};
