/**
 * ModuleRecoveryAlert component.
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
import {
	Fragment,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from '@wordpress/element';
import { sprintf, __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { Checkbox } from 'googlesitekit-components';
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import { DAY_IN_SECONDS } from '../../../util';
import Errors from './Errors';
import SimpleNotification from '../../../googlesitekit/notifications/components/layout/SimpleNotification';
import Description from '../../../googlesitekit/notifications/components/common/Description';
import LearnMoreLink from '../../../googlesitekit/notifications/components/common/LearnMoreLink';
import ActionsCTALinkDismiss from '../../../googlesitekit/notifications/components/common/ActionsCTALinkDismiss';
import Dismiss from '../../../googlesitekit/notifications/components/common/Dismiss';

export default function ModuleRecoveryAlert( { id, Notification } ) {
	const [ checkboxes, setCheckboxes ] = useState( null );
	const [ recoveringModules, setRecoveringModules ] = useState( false );

	const recoverableModules = useSelect( ( select ) =>
		select( CORE_MODULES ).getRecoverableModules()
	);

	const documentationURL = useSelect( ( select ) => {
		return select( CORE_SITE ).getDocumentationLinkURL(
			'dashboard-sharing'
		);
	} );

	const userAccessibleModules = useSelect( ( select ) => {
		const modules = select( CORE_MODULES ).getRecoverableModules();

		if ( modules === undefined ) {
			return undefined;
		}

		const accessibleModules = Object.keys( modules ).map( ( slug ) => ( {
			slug,
			hasModuleAccess: select( CORE_MODULES ).hasModuleAccess( slug ),
		} ) );

		if (
			accessibleModules.some(
				( { hasModuleAccess } ) => hasModuleAccess === undefined
			)
		) {
			return undefined;
		}

		return accessibleModules
			.filter( ( { hasModuleAccess } ) => hasModuleAccess )
			.map( ( { slug } ) => slug );
	} );

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

	const updateCheckboxes = useCallback(
		( slug ) =>
			setCheckboxes( ( currentCheckboxes ) => ( {
				...currentCheckboxes,
				[ slug ]: ! currentCheckboxes[ slug ],
			} ) ),
		[]
	);

	const handleRecoverModules = useCallback( async () => {
		setRecoveringModules( true );

		const modulesToRecover = Object.keys( checkboxes ).filter(
			( module ) => checkboxes[ module ]
		);

		await clearRecoveredModules();
		await recoverModules( modulesToRecover );

		setCheckboxes( null );
		setRecoveringModules( false );
	}, [ checkboxes, clearRecoveredModules, recoverModules ] );

	useEffect( () => {
		if ( userAccessibleModules !== undefined && checkboxes === null ) {
			const checked = {};

			userAccessibleModules.forEach( ( module ) => {
				checked[ module ] = true;
			} );

			setCheckboxes( checked );
		}
	}, [ checkboxes, userAccessibleModules ] );

	// Disable the CTA if no modules are selected to be restored.
	const disableCTA = useMemo(
		() =>
			checkboxes !== null &&
			! Object.values( checkboxes ).some( ( checked ) => checked ),
		[ checkboxes ]
	);

	// Only allow the alert to be dismissed if all recoverable modules are selected.
	const shouldDismissOnCTAClick = useMemo(
		() =>
			Object.keys( userAccessibleModules || {} ).length ===
			Object.values( checkboxes || {} ).filter( ( checked ) => checked )
				.length,
		[ checkboxes, userAccessibleModules ]
	);

	// The alert renders conditional copy and actions based on:
	// 1. If there is one or more than one module to recover.
	// 2. If the user has access to perform the recovery.
	const hasMultipleRecoverableModules = useMemo(
		() => Object.keys( recoverableModules || {} ).length > 1,
		[ recoverableModules ]
	);
	const hasUserRecoverableModules = useMemo(
		() => !! Object.keys( userAccessibleModules || {} ).length,
		[ userAccessibleModules ]
	);

	const description = useMemo( () => {
		if ( ! hasMultipleRecoverableModules && hasUserRecoverableModules ) {
			return sprintf(
				/* translators: %s: module name. */
				__(
					'%s data was previously shared with other users on the site by another admin who no longer has access. To restore access, you may recover the module as the new owner.',
					'google-site-kit'
				),
				recoverableModules[ userAccessibleModules[ 0 ] ].name
			);
		}
		if ( hasMultipleRecoverableModules && hasUserRecoverableModules ) {
			return __(
				'The data for the following modules was previously shared with other users on the site by another admin who no longer has access. To restore access, you may recover the module as the new owner.',
				'google-site-kit'
			);
		}
		if (
			! hasMultipleRecoverableModules &&
			! hasUserRecoverableModules &&
			recoverableModules
		) {
			return sprintf(
				/* translators: %s: module name. */
				__(
					'%s data was previously shared with other users on the site by another admin who no longer has access. To restore access, the module must be recovered by another admin who has access.',
					'google-site-kit'
				),
				recoverableModules[
					Object.keys( recoverableModules || {} )[ 0 ]
				].name
			);
		}
		if ( hasMultipleRecoverableModules && ! hasUserRecoverableModules ) {
			return __(
				'The data for the following modules was previously shared with other users on the site by another admin who no longer has access. To restore access, the module must be recovered by another admin who has access.',
				'google-site-kit'
			);
		}
	}, [
		hasMultipleRecoverableModules,
		hasUserRecoverableModules,
		recoverableModules,
		userAccessibleModules,
	] );

	const actions = (
		<Fragment>
			{ hasUserRecoverableModules && (
				<Fragment>
					{ hasMultipleRecoverableModules && (
						<Fragment>
							{ checkboxes !== null &&
								userAccessibleModules.map( ( slug ) => (
									<div key={ slug }>
										<Checkbox
											checked={ checkboxes[ slug ] }
											name="module-recovery-alert-checkbox"
											id={ `module-recovery-alert-checkbox-${ slug }` }
											onChange={ () =>
												updateCheckboxes( slug )
											}
											value={ slug }
											disabled={ recoveringModules }
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
						isSaving={ recoveringModules }
						dismissLabel={ __(
							'Remind me later',
							'google-site-kit'
						) }
						dismissOnCTAClick={ shouldDismissOnCTAClick }
						dismissExpires={ DAY_IN_SECONDS }
						ctaDismissOptions={ { skipHidingFromQueue: false } }
						ctaDisabled={ disableCTA }
					/>
				</Fragment>
			) }
			{ ! hasUserRecoverableModules && (
				<Fragment>
					{ hasMultipleRecoverableModules && (
						<ul className="mdc-list mdc-list--non-interactive">
							{ Object.keys( recoverableModules ).map(
								( slug ) => (
									<li className="mdc-list-item" key={ slug }>
										<span className="mdc-list-item__text">
											{ recoverableModules[ slug ].name }
										</span>
									</li>
								)
							) }
						</ul>
					) }
					<Dismiss
						id={ id }
						dismissLabel={ __(
							'Remind me later',
							'google-site-kit'
						) }
						dismissExpires={ DAY_IN_SECONDS }
					/>
				</Fragment>
			) }
		</Fragment>
	);

	return (
		<Notification className="googlesitekit-publisher-win">
			<SimpleNotification
				title={ __(
					'Dashboard data for some services has been interrupted',
					'google-site-kit'
				) }
				description={
					<Description
						text={ description }
						learnMoreLink={
							<LearnMoreLink
								id={ id }
								label={ __( 'Learn more', 'google-site-kit' ) }
								url={ documentationURL }
							/>
						}
					/>
				}
				actions={ actions }
			/>
		</Notification>
	);
}
