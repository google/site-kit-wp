/**
 * ModuleRecoveryAlert RecoverableActions component.
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
 * External dependencies
 */
import { without } from 'lodash';

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { Checkbox } from 'googlesitekit-components';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import Errors from './Errors';

export default function RecoverableActions( {
	inProgress,
	selectedModuleSlugs,
	recoverableModules,
	userRecoverableModuleSlugs,
	hasMultipleRecoverableModules,
	setSelectedModuleSlugs,
} ) {
	const recoveryErrors = useSelect( ( select ) =>
		select( CORE_MODULES ).getRecoveryErrors()
	);

	return (
		<Fragment>
			{ hasMultipleRecoverableModules && (
				<Fragment>
					{ selectedModuleSlugs &&
						userRecoverableModuleSlugs.map( ( slug ) => (
							<div key={ slug }>
								<Checkbox
									checked={ selectedModuleSlugs.includes(
										slug
									) }
									name="module-recovery-alert-checkbox"
									id={ `module-recovery-alert-checkbox-${ slug }` }
									onChange={ () => {
										if (
											selectedModuleSlugs.includes( slug )
										) {
											setSelectedModuleSlugs(
												without(
													selectedModuleSlugs,
													slug
												)
											);
										} else {
											setSelectedModuleSlugs( [
												...selectedModuleSlugs,
												slug,
											] );
										}
									} }
									disabled={ inProgress }
									value={ slug }
								>
									{ recoverableModules[ slug ].name }
								</Checkbox>
							</div>
						) ) }
					<p className="googlesitekit-publisher-win__desc">
						{ __(
							'By recovering the selected modules, you will restore access for other users by sharing access via your Google account. This does not make any changes to external services and can be managed at any time via the dashboard sharing settings.',
							'google-site-kit'
						) }
					</p>
				</Fragment>
			) }
			{ ! hasMultipleRecoverableModules && (
				<p className="googlesitekit-publisher-win__desc">
					{ __(
						'By recovering the module, you will restore access for other users by sharing access via your Google account. This does not make any changes to external services and can be managed at any time via the dashboard sharing settings.',
						'google-site-kit'
					) }
				</p>
			) }
			{ Object.keys( recoveryErrors ).length > 0 && (
				<Errors recoveryErrors={ recoveryErrors } />
			) }
		</Fragment>
	);
}
