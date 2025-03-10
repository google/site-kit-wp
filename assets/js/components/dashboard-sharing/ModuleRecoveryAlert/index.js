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
	createInterpolateElement,
	Fragment,
	useCallback,
	useEffect,
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
import Link from '../../Link';
import CTALink from '../../../googlesitekit/notifications/components/common/CTALink';
import CTALinkSubtle from '../../../googlesitekit/notifications/components/common/CTALinkSubtle';
import { CORE_NOTIFICATIONS } from '../../../googlesitekit/notifications/datastore/constants';

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

	const { dismissNotification } = useDispatch( CORE_NOTIFICATIONS );

	const recoverableModulesList = Object.keys( recoverableModules || {} );

	const handleRecoverModules = useCallback( async () => {
		setRecoveringModules( true );

		const modulesToRecover = Object.keys( checkboxes ).filter(
			( module ) => checkboxes[ module ]
		);

		await clearRecoveredModules();
		await recoverModules( modulesToRecover );

		setRecoveringModules( false );

		// Dismiss if all recoverable modules are checked or only one module is available for recovery.
		if (
			( checkboxes !== null &&
				recoverableModulesList.every(
					( module ) => checkboxes[ module ]
				) ) ||
			recoverableModulesList.length === 1
		) {
			// Dismiss the notification with a short expiry to remove it from the queue immediately but allow
			// it to be shown again if the issue reoccurs in future.
			dismissNotification( id, {
				expiresInSeconds: 10,
				skipHidingFromQueue: false,
			} );
		}
	}, [
		checkboxes,
		clearRecoveredModules,
		id,
		dismissNotification,
		recoverModules,
		recoverableModulesList,
	] );

	useEffect( () => {
		if ( userAccessibleModules !== undefined && checkboxes === null ) {
			const checked = {};

			userAccessibleModules.forEach( ( module ) => {
				checked[ module ] = true;
			} );

			setCheckboxes( checked );
		}
	}, [ checkboxes, userAccessibleModules ] );

	if ( checkboxes === null ) {
		return null;
	}

	const userAccessibleModulesList = Object.keys(
		userAccessibleModules || {}
	);

	let description = null;
	let actions = null;

	if ( userAccessibleModulesList.length === 0 ) {
		if ( recoverableModulesList.length === 1 ) {
			description = (
				<p className="googlesitekit-publisher-win__desc">
					{ createInterpolateElement(
						sprintf(
							/* translators: %s: module name. */
							__(
								'%s data was previously shared with other users on the site by another admin who no longer has access. To restore access, the module must be recovered by another admin who has access. <a>Learn more</a>',
								'google-site-kit'
							),
							recoverableModules[ recoverableModulesList[ 0 ] ]
								.name
						),
						{
							a: (
								<Link
									href={ documentationURL }
									external
									aria-label={ __(
										'Learn more',
										'google-site-kit'
									) }
								/>
							),
						}
					) }
				</p>
			);
			actions = (
				<CTALink
					id={ id }
					ctaLabel={ __( 'Remind me later', 'google-site-kit' ) }
					onCTAClick={ () =>
						dismissNotification( id, {
							expiresInSeconds: DAY_IN_SECONDS,
						} )
					}
				/>
			);
		} else {
			description = (
				<p className="googlesitekit-publisher-win__desc">
					{ createInterpolateElement(
						__(
							'The data for the following modules was previously shared with other users on the site by another admin who no longer has access. To restore access, the module must be recovered by another admin who has access. <a>Learn more</a>',
							'google-site-kit'
						),
						{
							a: (
								<Link
									href={ documentationURL }
									external
									aria-label={ __(
										'Learn more',
										'google-site-kit'
									) }
								/>
							),
						}
					) }
				</p>
			);
			actions = (
				<Fragment>
					<ul className="mdc-list mdc-list--non-interactive">
						{ recoverableModulesList.map( ( slug ) => (
							<li className="mdc-list-item" key={ slug }>
								<span className="mdc-list-item__text">
									{ recoverableModules[ slug ].name }
								</span>
							</li>
						) ) }
					</ul>
					<CTALink
						id={ id }
						ctaLabel={ __( 'Remind me later', 'google-site-kit' ) }
						onCTAClick={ () =>
							dismissNotification( id, {
								expiresInSeconds: DAY_IN_SECONDS,
							} )
						}
					/>
				</Fragment>
			);
		}
	} else if ( userAccessibleModulesList.length === 1 ) {
		description = (
			<p className="googlesitekit-publisher-win__desc">
				{ createInterpolateElement(
					sprintf(
						/* translators: %s: module name. */
						__(
							'%s data was previously shared with other users on the site by another admin who no longer has access. To restore access, you may recover the module as the new owner. <a>Learn more</a>',
							'google-site-kit'
						),
						recoverableModules[ userAccessibleModules[ 0 ] ].name
					),
					{
						a: (
							<Link
								href={ documentationURL }
								external
								aria-label={ __(
									'Learn more',
									'google-site-kit'
								) }
							/>
						),
					}
				) }
			</p>
		);
		actions = (
			<Fragment>
				<p className="googlesitekit-publisher-win__desc">
					{ __(
						'By recovering the module, you will restore access for other users by sharing access via your Google account. This does not make any changes to external services and can be managed at any time via the dashboard sharing settings.',
						'google-site-kit'
					) }
				</p>
				{ Object.keys( recoveryErrors ).length > 0 && (
					<Errors recoveryErrors={ recoveryErrors } />
				) }
				<CTALink
					id={ id }
					ctaLabel={ __( 'Recover', 'google-site-kit' ) }
					onCTAClick={ handleRecoverModules }
					isSaving={ recoveringModules }
				/>
				<CTALinkSubtle
					id={ id }
					ctaLabel={ __( 'Remind me later', 'google-site-kit' ) }
					onCTAClick={ () =>
						dismissNotification( id, {
							expiresInSeconds: DAY_IN_SECONDS,
						} )
					}
					tertiary
				/>
			</Fragment>
		);
	} else {
		description = (
			<p className="googlesitekit-publisher-win__desc">
				{ createInterpolateElement(
					__(
						'The data for the following modules was previously shared with other users on the site by another admin who no longer has access. To restore access, you may recover the module as the new owner. <a>Learn more</a>',
						'google-site-kit'
					),
					{
						a: (
							<Link
								href={ documentationURL }
								external
								aria-label={ __(
									'Learn more',
									'google-site-kit'
								) }
							/>
						),
					}
				) }
			</p>
		);
		actions = (
			<Fragment>
				{ userAccessibleModules.map( ( slug ) => (
					<div key={ slug }>
						<Checkbox
							checked={ checkboxes[ slug ] }
							name="module-recovery-alert-checkbox"
							id={ `module-recovery-alert-checkbox-${ slug }` }
							onChange={ () => updateCheckboxes( slug ) }
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
				{ Object.keys( recoveryErrors ).length > 0 && (
					<Errors recoveryErrors={ recoveryErrors } />
				) }
				<CTALink
					id={ id }
					ctaLabel={ __( 'Recover', 'google-site-kit' ) }
					onCTAClick={ handleRecoverModules }
					isSaving={ recoveringModules }
				/>
				<CTALinkSubtle
					id={ id }
					ctaLabel={ __( 'Remind me later', 'google-site-kit' ) }
					onCTAClick={ () =>
						dismissNotification( id, {
							expiresInSeconds: DAY_IN_SECONDS,
						} )
					}
					tertiary
				/>
			</Fragment>
		);
	}

	return (
		<Notification className="googlesitekit-publisher-win">
			<SimpleNotification
				title={ __(
					'Dashboard data for some services has been interrupted',
					'google-site-kit'
				) }
				description={ description }
				actions={ actions }
			/>
		</Notification>
	);
}
