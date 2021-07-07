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
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { Grid, Row, Cell } from '../../material-components';
import Link from '../Link';
import Switch from '../Switch';
const { useSelect } = Data;

export default function SettingsAdminSharing() {
	const currentUserID = useSelect( ( select ) => select( CORE_USER ).getID() );

	if ( ! currentUserID ) {
		return null;
	}

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

	const activeModulesWithReporting = [
		{
			slug: 'search-console',
			name: 'Search Console',
			ownerID: 1,
			delegatedAccess: false,
		},
		{
			slug: 'analytics',
			name: 'Analytics',
			ownerID: 1,
			delegatedAccess: false,
		},
		{
			slug: 'adsense',
			name: 'AdSense',
			ownerID: 2,
			delegatedAccess: false,
		},
	];

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
							{ __( 'Share with people or roles', 'google-site-kit' ) }
						</h3>
						<p>
							{ __( 'Share the Site Kit dashboard with other users of your site', 'google-site-kit' ) }
						</p>
					</Cell>
				</Row>
				<Row>
					<Cell size={ 12 }>
						<Combobox className="autocomplete__wrapper googlesitekit-permission-autocomplete">
							<ComboboxInput
								className="autocomplete__input autocomplete__input--default"
								type="text"
							/>
						</Combobox>
						<div className="googlesitekit-permission-list" role="list">
							<div id="googlesitekit-permission-list__item--admin" className="googlesitekit-permission-list__item googlesitekit-permission-list__item--role googlesitekit-permission-list__item--disabled" role="listitem">
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
					</Cell>
				</Row>
				<Row>
					<Cell size={ 12 }>
						<h4>
							{ __( 'Delegate module data access', 'google-site-kit' ) }
						</h4>
						<p>
							{ __( 'Delegate data access for the active modules that you would like the above people to see in the shared Site Kit dashboard', 'google-site-kit' ) }
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
												__( 'Enabling this checkbox will allow the above users to access %s data on your behalf', 'google-site-kit' ),
												module.name
											) }
											{ currentUserID !== module.ownerID && sprintf(
												/* translators: %s: module name */
												__( 'You cannot control delegation of %s data as the module is managed by another administrator', 'google-site-kit' ),
												module.name
											) }
										</div>
									</div>
									<div className="googlesitekit-module-sharing-list__item__actions">
										<Switch
											label={ __( 'Delegate access', 'google-site-kit' ) }
											checked={ module.delegatedAccess }
											disabled={ currentUserID !== module.ownerID }
											hideLabel={ true }
										/>
									</div>
								</div>
							) ) }
							<div id="googlesitekit-module-sharing-list__item--pagespeed-insights" className="googlesitekit-module-sharing-list__item googlesitekit-module-sharing-list__item--disabled" role="listitem">
								<div className="googlesitekit-module-sharing-list__item__main">
									<div className="googlesitekit-module-sharing-list__item__main__primary">
										PageSpeed Insights
									</div>
									<div className="googlesitekit-module-sharing-list__item__main__secondary">
										The PageSpeed Insights module is always accessible to all users who the dashboard is shared with
									</div>
								</div>
								<div className="googlesitekit-module-sharing-list__item__actions">
									<Switch
										label={ __( 'Delegate access', 'google-site-kit' ) }
										checked={ true }
										disabled={ true }
										hideLabel={ true }
									/>
								</div>
							</div>
						</div>
					</Cell>
				</Row>
			</Grid>
		</div>
	);
}
