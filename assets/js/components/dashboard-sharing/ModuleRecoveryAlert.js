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
import { Fragment, useCallback, useEffect, useState } from '@wordpress/element';
import { sprintf, __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import Button from '../Button';
import Checkbox from '../Checkbox';
import BannerNotification from '../notifications/BannerNotification';
import ProgressBar from '../ProgressBar';
import Spinner from '../Spinner';

const { useDispatch, useSelect } = Data;

export default function ModuleRecoveryAlert() {
	const [ checkboxes, setCheckboxes ] = useState( null );
	const [ recoveringModules, setRecoveringModules ] = useState( false );

	const recoverableModules = useSelect( ( select ) =>
		select( CORE_MODULES ).getRecoverableModules()
	);

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

	const { recoverModule } = useDispatch( CORE_MODULES );

	const updateCheckboxes = useCallback(
		( slug ) =>
			setCheckboxes( ( currentCheckboxes ) => ( {
				...currentCheckboxes,
				[ slug ]: ! currentCheckboxes[ slug ],
			} ) ),
		[]
	);

	const handleRecoverModules = useCallback( () => {
		setRecoveringModules( true );
		const modulesToRecover = Object.keys( checkboxes ).filter(
			( module ) => checkboxes[ module ]
		);
		Promise.all(
			modulesToRecover.map( ( module ) => recoverModule( module ) )
		).finally( () => setRecoveringModules( false ) );
	}, [ checkboxes, recoverModule ] );

	useEffect( () => {
		if ( userAccessibleModules !== undefined && checkboxes === null ) {
			const checked = {};

			userAccessibleModules.forEach( ( module ) => {
				checked[ module ] = true;
			} );

			setCheckboxes( checked );
		}
	}, [ checkboxes, userAccessibleModules ] );

	const recoverableModulesList = Object.keys( recoverableModules || {} );
	if (
		recoverableModules === undefined ||
		recoverableModulesList.length === 0
	) {
		return null;
	}

	let description = null;
	let children = null;

	if ( userAccessibleModules === undefined || checkboxes === null ) {
		children = <ProgressBar />;
	} else if ( userAccessibleModules.length === 0 ) {
		if ( recoverableModulesList.length === 1 ) {
			description = sprintf(
				/* translators: %s: module name. */
				__(
					'%s data was previously shared with other users on the site by another admin who no longer has access. To restore access, the module must be recovered by another admin who has access.',
					'google-site-kit'
				),
				recoverableModules[ recoverableModulesList[ 0 ] ].name
			);
		} else {
			description = __(
				'The data for the following modules was previously shared with other users on the site by another admin who no longer has access. To restore access, the module must be recovered by another admin who has access.',
				'google-site-kit'
			);
			children = (
				<ul className="mdc-list mdc-list--non-interactive">
					{ recoverableModulesList.map( ( slug ) => (
						<li className="mdc-list-item" key={ slug }>
							<span className="mdc-list-item__text">
								{ recoverableModules[ slug ].name }
							</span>
						</li>
					) ) }
				</ul>
			);
		}
	} else if ( userAccessibleModules.length === 1 ) {
		description = sprintf(
			/* translators: %s: module name. */
			__(
				'%s data was previously shared with other users on the site by another admin who no longer has access. To restore access, you may recover the module as the new owner.',
				'google-site-kit'
			),
			recoverableModules[ userAccessibleModules[ 0 ] ].name
		);
		children = (
			<Fragment>
				<p>
					{ __(
						'By recovering the module, you will restore access for other users by sharing access via your Google account. This does not make any changes to external services and can be managed at any time via the dashboard sharing settings.',
						'google-site-kit'
					) }
				</p>
				<Button
					onClick={ handleRecoverModules }
					disabled={ recoveringModules }
				>
					{ __( 'Recover', 'google-site-kit' ) }
				</Button>
				<Spinner isSaving={ recoveringModules } />
			</Fragment>
		);
	} else {
		description = __(
			'The data for the following modules was previously shared with other users on the site by another admin who no longer has access. To restore access, you may recover the module as the new owner.',
			'google-site-kit'
		);
		children = (
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
				<p>
					{ __(
						'By recovering the selected modules, you will restore access for other users by sharing access via your Google account. This does not make any changes to external services and can be managed at any time via the dashboard sharing settings.',
						'google-site-kit'
					) }
				</p>
				<Button
					onClick={ handleRecoverModules }
					disabled={
						recoveringModules ||
						! Object.values( checkboxes ).some(
							( checked ) => checked
						)
					}
				>
					{ __( 'Recover', 'google-site-kit' ) }
				</Button>
				<Spinner isSaving={ recoveringModules } />
			</Fragment>
		);
	}

	return (
		<BannerNotification
			id="module-recovery-alert"
			title={ __(
				'Dashboard data for some services has been interrupted',
				'google-site-kit'
			) }
			description={ description }
			learnMoreURL="#"
			learnMoreLabel={ __( 'Learn more', 'google-site-kit' ) }
		>
			{ children }
		</BannerNotification>
	);
}
