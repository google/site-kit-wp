/**
 * Header component for SettingsActiveModule.
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
import { useHistory, useParams } from 'react-router-dom';

/**
 * WordPress dependencies
 */
import { Fragment, useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import { EXPERIMENTAL_MODULES } from '../../dashboard-sharing/DashboardSharingSettings/constants';
import { Grid, Row, Cell } from '../../../material-components';
import Button from '../../Button';
import ModuleIcon from '../../ModuleIcon';
import Badge from '../../Badge';
import { trackEvent } from '../../../util';
import useViewContext from '../../../hooks/useViewContext';
const { useSelect } = Data;

export default function Header( { slug } ) {
	const viewContext = useViewContext();
	const history = useHistory();

	const { moduleSlug } = useParams();
	const isOpen = moduleSlug === slug;

	const storeName = useSelect( ( select ) =>
		select( CORE_MODULES ).getModuleStoreName( slug )
	);
	const adminReauthURL = useSelect( ( select ) =>
		select( storeName )?.getAdminReauthURL?.()
	);
	const module = useSelect( ( select ) =>
		select( CORE_MODULES ).getModule( slug )
	);

	const onHeaderClick = useCallback( () => {
		history.push( `/connected-services${ isOpen ? '' : `/${ slug }` }` );

		if ( isOpen ) {
			return trackEvent(
				`${ viewContext }_module-list`,
				'close_module_settings',
				slug
			);
		}

		return trackEvent(
			`${ viewContext }_module-list`,
			'view_module_settings',
			slug
		);
	}, [ history, isOpen, slug, viewContext ] );

	if ( ! module ) {
		return null;
	}

	const { name, connected } = module;

	return (
		<div
			className={ classnames( 'googlesitekit-settings-module__header', {
				'googlesitekit-settings-module__header--open': isOpen,
			} ) }
			id={ `googlesitekit-settings-module__header--${ slug }` }
			type="button"
			role="tab"
			aria-selected={ isOpen }
			aria-expanded={ isOpen }
			aria-controls={ `googlesitekit-settings-module__content--${ slug }` }
			to={ `/connected-services${ isOpen ? '' : `/${ slug }` }` }
			onClick={ onHeaderClick }
			onKeyDown={ onHeaderClick }
			tabIndex="-1"
		>
			<Grid>
				<Row>
					<Cell lgSize={ 6 } mdSize={ 4 } smSize={ 4 }>
						<div className="googlesitekit-settings-module__heading">
							<ModuleIcon
								slug={ slug }
								size={ 24 }
								className="googlesitekit-settings-module__heading-icon"
							/>

							<h3 className="googlesitekit-heading-4 googlesitekit-settings-module__title">
								{ name }
							</h3>

							<div className="googlesitekit-settings-module__heading-badges">
								{ EXPERIMENTAL_MODULES.includes( slug ) && (
									<Badge
										label={ __(
											'Experimental',
											'google-site-kit'
										) }
										hasLeftSpacing={ true }
									/>
								) }

								{ 'thank-with-google' === slug && (
									<Badge
										label={ __(
											'US Only',
											'google-site-kit'
										) }
										hasLeftSpacing={ true }
									/>
								) }
							</div>
						</div>
					</Cell>

					<Cell
						lgSize={ 6 }
						mdSize={ 4 }
						smSize={ 4 }
						alignMiddle
						mdAlignRight
					>
						{ connected && (
							<p className="googlesitekit-settings-module__status">
								{ __( 'Connected', 'google-site-kit' ) }

								<span className="googlesitekit-settings-module__status-icon googlesitekit-settings-module__status-icon--connected" />
							</p>
						) }

						{ ! connected && (
							<Fragment>
								<Button href={ adminReauthURL }>
									{ sprintf(
										/* translators: %s: module name. */
										__(
											'Complete setup for %s',
											'google-site-kit'
										),
										name
									) }
								</Button>
								<span className="googlesitekit-settings-module__status-icon googlesitekit-settings-module__status-icon--not-connected" />
							</Fragment>
						) }
					</Cell>
				</Row>
			</Grid>
		</div>
	);
}

Header.propTypes = {
	slug: PropTypes.string.isRequired,
};
