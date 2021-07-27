/**
 * SettingsAdminSharing component.
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
import {
	Combobox,
	ComboboxInput,
} from '@reach/combobox';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Fragment, useState, useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import { Grid, Row, Cell } from '../../material-components';
import Link from '../Link';
import Switch from '../Switch';
const { useSelect } = Data;

export default function SettingsAdminSharing() {
	const currentUserID = useSelect( ( select ) => select( CORE_USER ).getID() );
	const modules = useSelect( ( select ) => select( CORE_MODULES ).getModules() );

	const [ sharedModules, setSharedModules ] = useState( {} );
	const toggleShareModule = useCallback( async ( e ) => {
		const moduleSlug = e.target.id.replace( 'share-', '' );
		const shared = !! e.target.checked;

		setSharedModules( {
			...sharedModules,
			[ moduleSlug ]: shared,
		} );
	}, [ sharedModules, setSharedModules ] );

	if ( ! currentUserID || ! modules ) {
		return null;
	}

	// This variable just exists to show two different UIs. The MVP will only having role-sharing,
	// which is what is most common in WordPress.
	// A future enhancement could be to allow sharing also with individual users, which is closer
	// to what Google services allow.
	const roleSharingOnly = true;

	// The 'administrator' role is not included here since it is always shared with.
	const allRoles = [
		{
			id: 'editor',
			label: 'Editors',
			shared: true,
		},
		{
			id: 'author',
			label: 'Authors',
			shared: false,
		},
		{
			id: 'contributor',
			label: 'Contributors',
			shared: false,
		},
	];

	const users = [
		{
			type: 'role',
			id: 'editor',
			primary: 'All editors',
			secondary: '',
			thumbnail: '',
		},
		{
			type: 'user',
			id: 4,
			primary: 'Felix Arntz (Editor)',
			secondary: 'flixos90@gmail.com',
			thumbnail: 'https://lh3.googleusercontent.com/a-/AOh14GhAmSJzOmGmvAt5j1jJ0rncXtE_kKxzKAL53SMe=s100',
		},
		{
			type: 'user',
			id: 3,
			primary: 'Mariya Moeva (Author)',
			secondary: 'mmoeva@google.com',
			thumbnail: 'https://lh3.googleusercontent.com/a-/AOh14GgiqeXisUJDFTAE3amM1fQtD7XLwMN_yWlIGMYxHSs=s100',
		},
	];

	const delegatedAccessMockData = {
		'search-console': {
			delegatedAccess: true,
		},
		analytics: {
			delegatedAccess: true,
		},
		adsense: {
			ownerID: 2,
			ownerLogin: 'janedoe',
			delegatedAccess: false,
		},
	};

	// Show only modules in list that can be shared.
	const activeModulesWithReporting = Object.values( modules ).filter( ( module ) => module.active && module.connected && ! module.internal && module.shareable ).map( ( module ) => {
		// Modules without ownership don't require access delegation, so this can be true by default.
		const defaultDelegatedAccess = ! module.owner ? true : false;

		return {
			slug: module.slug,
			name: module.name,
			ownerID: delegatedAccessMockData[ module.slug ]?.ownerID || module.owner?.id || 0,
			ownerLogin: delegatedAccessMockData[ module.slug ]?.ownerLogin || module.owner?.login || '',
			delegatedAccess: delegatedAccessMockData[ module.slug ]?.delegatedAccess || defaultDelegatedAccess,
			shared: sharedModules[ module.slug ] || false,
		};
	} );

	return (
		<div className="
            googlesitekit-settings-module
            googlesitekit-settings-module--active
            googlesitekit-settings-user-input
        ">
			<Grid>
				<Row>
					<Cell size={ 12 }>
						<h3 className="
                            googlesitekit-heading-4
                            googlesitekit-settings-module__title
                        ">
							{ roleSharingOnly ? __( 'Share with roles', 'google-site-kit' ) : __( 'Share with people or roles', 'google-site-kit' ) }
						</h3>
						<p>
							{ __( 'Share the Site Kit dashboard with other users of your site', 'google-site-kit' ) }
						</p>
					</Cell>
				</Row>
				<Row>
					<Cell size={ 12 }>
						{ roleSharingOnly && (
							<div className="googlesitekit-role-list" role="list">
								<div id={ `googlesitekit-role-list__item--administrator` } className="googlesitekit-role-list__item" role="listitem">
									<Switch
										label="Administrators"
										checked={ true }
										disabled={ true }
										hideLabel={ false }
									/>
								</div>
								{ allRoles.map( ( role ) => (
									<div key={ role.id } id={ `googlesitekit-role-list__item--${ role.id }` } className="googlesitekit-role-list__item" role="listitem">
										<Switch
											label={ role.label }
											checked={ role.shared }
											hideLabel={ false }
										/>
									</div>
								) ) }
							</div>
						) }
						{ ! roleSharingOnly && (
							<Fragment>
								<Combobox className="autocomplete__wrapper googlesitekit-permission-autocomplete">
									<ComboboxInput
										className="autocomplete__input autocomplete__input--default"
										type="text"
									/>
								</Combobox>
								<div className="googlesitekit-permission-list" role="list">
									<div id="googlesitekit-permission-list__item--administrator" className="googlesitekit-permission-list__item googlesitekit-permission-list__item--role googlesitekit-permission-list__item--disabled" role="listitem">
										<div className="googlesitekit-permission-list__item__icon">
											<div className="googlesitekit-permission-list__item__icon__wrapper">
												<div className="dashicons dashicons-admin-users"></div>
											</div>
										</div>
										<div className="googlesitekit-permission-list__item__main">
											<div className="googlesitekit-permission-list__item__main__primary">
												All administrators
											</div>
											<div className="googlesitekit-permission-list__item__main__secondary">
												Administrators can always access the dashboard
											</div>
										</div>
										<div className="googlesitekit-permission-list__item__actions">
										</div>
									</div>
									{ users.map( ( user ) => (
										<div key={ user.id } id={ `googlesitekit-permission-list__item--${ user.id }` } className={ `googlesitekit-permission-list__item googlesitekit-permission-list__item--${ user.type }` } role="listitem">
											<div className="googlesitekit-permission-list__item__icon">
												<div className="googlesitekit-permission-list__item__icon__wrapper">
													{ user.type === 'user' && (
														<img src={ user.thumbnail } alt="" />
													) }
													{ user.type === 'role' && (
														<div className="dashicons dashicons-admin-users"></div>
													) }
												</div>
											</div>
											<div className="googlesitekit-permission-list__item__main">
												<div className="googlesitekit-permission-list__item__main__primary">
													{ user.primary }
												</div>
												{ user.secondary && (
													<div className="googlesitekit-permission-list__item__main__secondary">
														{ user.secondary }
													</div>
												) }
											</div>
											<div className="googlesitekit-permission-list__item__actions">
												<Link>Remove</Link>
											</div>
										</div>
									) ) }
								</div>
							</Fragment>
						) }
					</Cell>
				</Row>
				<Row>
					<Cell size={ 12 }>
						<h4>
							{ __( 'Share module data access', 'google-site-kit' ) }
						</h4>
						<p>
							{ __( 'Share data access for the active modules that you would like the above people to see in the shared Site Kit dashboard. You can only share a module if the module owner has agreed to delegate their access', 'google-site-kit' ) }
						</p>
					</Cell>
				</Row>
				<Row>
					<Cell size={ 12 }>
						<div className="googlesitekit-module-sharing-list" role="list">
							{ activeModulesWithReporting.map( ( module ) => (
								<div key={ module.slug } id={ `googlesitekit-module-sharing-list__item--${ module.slug }` } className={ classnames( 'googlesitekit-module-sharing-list__item', { 'googlesitekit-module-sharing-list__item--disabled': currentUserID !== module.ownerID } ) } role="listitem">
									<div className="googlesitekit-module-sharing-list__item__main">
										<div className="googlesitekit-module-sharing-list__item__main__primary">
											{ module.name }
										</div>
										<div className="googlesitekit-module-sharing-list__item__main__secondary">
											{ currentUserID === module.ownerID && sprintf(
												/* translators: %s: module name */
												__( 'Enabling this checkbox will allow the above users to view %s data on your behalf', 'google-site-kit' ),
												module.name,
											) }
											{ ( currentUserID !== module.ownerID && module.ownerID === 0 ) && sprintf(
												/* translators: %s: module name */
												__( 'Enabling this checkbox will allow the above users to view %s data', 'google-site-kit' ),
												module.name,
											) }
											{ ( currentUserID !== module.ownerID && module.ownerID !== 0 && module.delegatedAccess ) && sprintf(
												/* translators: 1: module name, 2: module owner login */
												__( 'Enabling this checkbox will allow the above users to view %1$s data on behalf of the module owner %2$s', 'google-site-kit' ),
												module.name,
												module.ownerLogin,
											) }
											{ ( currentUserID !== module.ownerID && module.ownerID !== 0 && ! module.delegatedAccess ) && sprintf(
												/* translators: 1: module name, 2: module owner login */
												__( 'You cannot share %1$s data since the module owner %2$s has not agreed to delegate their data access', 'google-site-kit' ),
												module.name,
												module.ownerLogin,
											) }
										</div>
									</div>
									<div className="googlesitekit-module-sharing-list__item__actions">
										<Switch
											id={ `share-${ module.slug }` }
											label={ __( 'Delegate access', 'google-site-kit' ) }
											checked={ module.shared }
											disabled={ currentUserID !== module.ownerID && module.ownerID !== 0 && ! module.delegatedAccess }
											hideLabel={ true }
											onChange={ toggleShareModule }
										/>
									</div>
								</div>
							) ) }
						</div>
					</Cell>
				</Row>
			</Grid>
		</div>
	);
}
