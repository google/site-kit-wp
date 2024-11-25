/**
 * SetupModule component.
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
 * External dependencies
 */
import PropTypes from 'prop-types';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { sprintf, __ } from '@wordpress/i18n';
import { useState, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import ModuleIcon from '../ModuleIcon';
import Spinner from '../Spinner';
import Link from '../Link';
import Badge from '../Badge';
import ModuleSettingsWarning from '../notifications/ModuleSettingsWarning.js';
import NewBadge from '../NewBadge.js';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import { CORE_LOCATION } from '../../googlesitekit/datastore/location/constants';
import { NEW_MODULES, BETA_MODULES, EXPERIMENTAL_MODULES } from './constants';
import { setItem } from '../../googlesitekit/api/cache';
import { trackEvent } from '../../util';
import useViewContext from '../../hooks/useViewContext';

export default function SetupModule( { slug, name, description } ) {
	const viewContext = useViewContext();

	const [ isSaving, setIsSaving ] = useState( false );

	const { activateModule } = useDispatch( CORE_MODULES );
	const { navigateTo } = useDispatch( CORE_LOCATION );
	const { setInternalServerError } = useDispatch( CORE_SITE );

	const onSetup = useCallback( async () => {
		setIsSaving( true );
		const { error, response } = await activateModule( slug );

		if ( ! error ) {
			await trackEvent(
				`${ viewContext }_module-list`,
				'activate_module',
				slug
			);

			await setItem( 'module_setup', slug, { ttl: 300 } );

			navigateTo( response.moduleReauthURL );
		} else {
			setInternalServerError( {
				id: 'activate-module-error',
				description: error.message,
			} );
			setIsSaving( false );
		}
	}, [
		activateModule,
		navigateTo,
		setInternalServerError,
		slug,
		viewContext,
	] );

	const canActivateModule = useSelect( ( select ) =>
		select( CORE_MODULES ).canActivateModule( slug )
	);

	return (
		<div
			className={ classnames(
				'googlesitekit-settings-connect-module',
				`googlesitekit-settings-connect-module--${ slug }`
			) }
			key={ slug }
		>
			<div className="googlesitekit-settings-connect-module__switch">
				<Spinner isSaving={ isSaving } />
			</div>
			<div className="googlesitekit-settings-connect-module__logo">
				<ModuleIcon slug={ slug } />
			</div>
			<div className="googlesitekit-settings-connect-module__heading">
				<h3
					className="
					googlesitekit-subheading-1
					googlesitekit-settings-connect-module__title
				"
				>
					{ name }
				</h3>
				<div className="googlesitekit-settings-connect-module__badges">
					{ EXPERIMENTAL_MODULES.includes( slug ) && (
						<Badge
							label={ __( 'Experimental', 'google-site-kit' ) }
						/>
					) }
					{ BETA_MODULES.includes( slug ) && (
						<Badge
							className="googlesitekit-beta-badge"
							label={ __( 'Beta', 'google-site-kit' ) }
						/>
					) }
					{ NEW_MODULES.includes( slug ) && (
						<NewBadge hasNoSpacing />
					) }
				</div>
			</div>
			<p className="googlesitekit-settings-connect-module__text">
				{ description }
			</p>

			<p className="googlesitekit-settings-connect-module__cta">
				<Link
					onClick={ onSetup }
					href=""
					disabled={ ! canActivateModule }
					arrow
				>
					{ sprintf(
						/* translators: %s: module name */
						__( 'Set up %s', 'google-site-kit' ),
						name
					) }
				</Link>
			</p>

			<ModuleSettingsWarning slug={ slug } />
		</div>
	);
}

SetupModule.propTypes = {
	slug: PropTypes.string.isRequired,
	name: PropTypes.string.isRequired,
	description: PropTypes.string.isRequired,
};
