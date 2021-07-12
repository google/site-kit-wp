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
import { useParams } from 'react-router-dom';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import { Grid, Row, Cell } from '../../../material-components';
import Link from '../../Link';
import ModuleIcon from '../../ModuleIcon';
const { useSelect } = Data;

export default function Header( { slug } ) {
	const { moduleSlug } = useParams();
	const isOpen = moduleSlug === slug;

	const module = useSelect( ( select ) => select( CORE_MODULES ).getModule( slug ) );

	if ( ! module ) {
		return null;
	}

	const { name, connected } = module;

	return (
		<Link
			className={ classnames(
				'googlesitekit-settings-module__header',
				{ 'googlesitekit-settings-module__header--open': isOpen }
			) }
			id={ `googlesitekit-settings-module__header--${ slug }` }
			type="button"
			role="tab"
			aria-selected={ isOpen }
			aria-expanded={ isOpen }
			aria-controls={ `googlesitekit-settings-module__content--${ slug }` }
			to={ `/connected-services${ isOpen ? '' : `/${ slug }` }` }
		>
			<Grid>
				<Row>
					<Cell lgSize={ 6 } mdSize={ 4 } smSize={ 4 }>
						<h3 className="googlesitekit-heading-4 googlesitekit-settings-module__title">
							<ModuleIcon slug={ slug } size={ 24 } className="googlesitekit-settings-module__title-icon" />
							{ name }
						</h3>
					</Cell>

					<Cell className="mdc-layout-grid__cell--align-right-tablet" lgSize={ 6 } mdSize={ 4 } smSize={ 4 } alignMiddle>
						<p className="googlesitekit-settings-module__status">
							{
								connected
									? sprintf(
										/* translators: %s: module name. */
										__( '%s is connected', 'google-site-kit' ),
										name
									)
									: sprintf(
										/* translators: %s: module name. */
										__( '%s is not connected', 'google-site-kit' ),
										name
									)
							}

							<span
								className={ classnames(
									'googlesitekit-settings-module__status-icon',
									{
										'googlesitekit-settings-module__status-icon--connected': connected,
										'googlesitekit-settings-module__status-icon--not-connected': ! connected,
									},
								) }
							/>
						</p>
					</Cell>
				</Row>
			</Grid>
		</Link>
	);
}

Header.propTypes = {
	slug: PropTypes.string.isRequired,
};
