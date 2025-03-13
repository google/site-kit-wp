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
 * WordPress dependencies
 */
import { Fragment, useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { Checkbox } from 'googlesitekit-components';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import { DAY_IN_SECONDS } from '../../../util';
import Errors from './Errors';
import ActionsCTALinkDismiss from '../../../googlesitekit/notifications/components/common/ActionsCTALinkDismiss';

export default function RecoverableActions( {
	id,
	recoverableModules,
	userRecoverableModuleSlugs,
	hasMultipleRecoverableModules,
} ) {
	const [ selectedModuleSlugs, setSelectedModuleSlugs ] = useState( null );
	const [ inProgress, setInProgress ] = useState( false );

	// TODO: Extract to selector.
	const recoveryErrors = useSelect( ( select ) => {
		if ( ! recoverableModules ) {
			return undefined;
		}

		const recoveredModules = select( CORE_MODULES ).getRecoveredModules();

		if ( ! recoveredModules ) {
			return {};
		}

		const modules = Object.keys( recoverableModules );

		const getRecoveryError = ( module ) =>
			recoveredModules?.error?.[ module ];

		return modules
			.filter( ( module ) => !! getRecoveryError( module ) )
			.reduce(
				( acc, module ) => ( {
					...acc,
					[ module ]: {
						name: recoverableModules[ module ].name,
						...getRecoveryError( module ),
					},
				} ),
				{}
			);
	} );

	const { recoverModules, clearRecoveredModules } =
		useDispatch( CORE_MODULES );

	const handleRecoverModules = useCallback( async () => {
		setInProgress( true );

		await clearRecoveredModules();
		await recoverModules( selectedModuleSlugs );

		setSelectedModuleSlugs( null );
		setInProgress( false );
	}, [ clearRecoveredModules, selectedModuleSlugs, recoverModules ] );

	useEffect( () => {
		if (
			selectedModuleSlugs === null &&
			Array.isArray( userRecoverableModuleSlugs )
		) {
			setSelectedModuleSlugs( userRecoverableModuleSlugs );
		}
	}, [ selectedModuleSlugs, userRecoverableModuleSlugs ] );

	// Disable the CTA if no modules are selected to be restored.
	const disableCTA = ! selectedModuleSlugs?.length;

	// Only allow the alert to be dismissed if all recoverable modules are selected.
	const shouldDismissOnCTAClick =
		userRecoverableModuleSlugs?.length === selectedModuleSlugs?.length;

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
										const selected =
											selectedModuleSlugs.includes(
												slug
											);
										if ( selected ) {
											setSelectedModuleSlugs(
												selectedModuleSlugs.filter(
													( s ) => s !== slug
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
			<ActionsCTALinkDismiss
				id={ id }
				ctaLabel={ __( 'Recover', 'google-site-kit' ) }
				onCTAClick={ handleRecoverModules }
				isSaving={ inProgress }
				dismissLabel={ __( 'Remind me later', 'google-site-kit' ) }
				dismissOnCTAClick={ shouldDismissOnCTAClick }
				dismissExpires={ DAY_IN_SECONDS }
				ctaDismissOptions={ { skipHidingFromQueue: false } }
				ctaDisabled={ disableCTA }
			/>
		</Fragment>
	);
}
