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
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { sprintf, __ } from '@wordpress/i18n';

export default function Error( { recoverableModules, error } ) {
	return (
		<div className="googlesitekit-module-recovery-error">
			{ Object.keys( error ).length > 1 ? (
				<Fragment>
					<p>
						{ __(
							'The following modules failed to be recovered:',
							'google-site-kit'
						) }
					</p>
					<ul>
						{ Object.keys( error ).map( ( module ) => (
							<li key={ module }>
								{ recoverableModules[ module ].name }:{ ' ' }
								{ error[ module ].message }
							</li>
						) ) }
					</ul>
				</Fragment>
			) : (
				<p>
					{ sprintf(
						/* translators: %s: Error message */
						__( 'Error: %s', 'google-site-kit' ),
						Object.values( error )[ 0 ].message
					) }
				</p>
			) }
		</div>
	);
}
