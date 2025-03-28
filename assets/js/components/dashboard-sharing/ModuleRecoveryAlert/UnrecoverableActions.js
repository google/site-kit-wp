/**
 * ModuleRecoveryAlert UnrecoverableActions component.
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
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { DAY_IN_SECONDS } from '../../../util';
import Dismiss from '../../../googlesitekit/notifications/components/common/Dismiss';

export default function UnrecoverableActions( {
	id,
	recoverableModules,
	hasMultipleRecoverableModules,
} ) {
	return (
		<Fragment>
			{ hasMultipleRecoverableModules && (
				<ul className="mdc-list mdc-list--non-interactive">
					{ Object.values( recoverableModules || {} ).map(
						( module ) => (
							<li className="mdc-list-item" key={ module.slug }>
								<span className="mdc-list-item__text">
									{ module.name }
								</span>
							</li>
						)
					) }
				</ul>
			) }
			<Dismiss
				id={ id }
				dismissLabel={ __( 'Remind me later', 'google-site-kit' ) }
				dismissExpires={ DAY_IN_SECONDS }
			/>
		</Fragment>
	);
}
