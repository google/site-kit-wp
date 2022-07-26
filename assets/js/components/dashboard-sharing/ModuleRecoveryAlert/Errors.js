/**
 * ModuleRecoveryAlert Error component.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import { Fragment } from '@wordpress/element';
import { sprintf, __ } from '@wordpress/i18n';

export default function Errors( { recoveryErrors } ) {
	return (
		<div className="googlesitekit-module-recovery-errors">
			{ Object.keys( recoveryErrors ).length === 1 && (
				<p>
					{ sprintf(
						/* translators: %s: Error message */
						__( 'Error: %s', 'google-site-kit' ),
						Object.values( recoveryErrors )[ 0 ].message
					) }
				</p>
			) }

			{ Object.keys( recoveryErrors ).length > 1 && (
				<Fragment>
					<p>
						{ __(
							'The following modules failed to be recovered:',
							'google-site-kit'
						) }
					</p>
					<ul>
						{ Object.keys( recoveryErrors ).map( ( module ) => (
							<li key={ module }>
								{ sprintf(
									/* translators: 1: Module name, 2: Error message */
									__( '%1$s: %2$s', 'google-site-kit' ),
									recoveryErrors[ module ].name,
									recoveryErrors[ module ].message
								) }
							</li>
						) ) }
					</ul>
				</Fragment>
			) }
		</div>
	);
}

Errors.propTypes = {
	recoveryErrors: PropTypes.object.isRequired,
};
