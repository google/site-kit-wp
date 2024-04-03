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
import { useCallback, useRef } from '@wordpress/element';
import { ESCAPE, ENTER } from '@wordpress/keycodes';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { Button } from 'googlesitekit-components';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import { EXPERIMENTAL_MODULES } from '../../dashboard-sharing/DashboardSharingSettings/constants';
import { Grid, Row, Cell } from '../../../material-components';
import { useKeyCodesInside } from '../../../hooks/useKeyCodesInside';
import ModuleIcon from '../../ModuleIcon';
import Badge from '../../Badge';
import NewBadge from '../../NewBadge';
import { trackEvent } from '../../../util';
import useViewContext from '../../../hooks/useViewContext';
import ConnectedIcon from '../../../../svg/icons/connected.svg';
import WarningIcon from '../../../../svg/icons/warning-v2.svg';
import ChevronDown from '../../../../svg/icons/chevron-down-v2.svg';
import IconWrapper from '../../IconWrapper';
const { useSelect } = Data;

export default function Header( { slug } ) {
	const viewContext = useViewContext();
	const history = useHistory();
	const headerRef = useRef();

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

	const openHeader = useCallback( () => {
		if ( isOpen ) {
			return;
		}

		history.push( `/connected-services/${ slug }` );
		trackEvent(
			`${ viewContext }_module-list`,
			'view_module_settings',
			slug
		);
	}, [ history, slug, viewContext, isOpen ] );

	const closeHeader = useCallback( () => {
		if ( ! isOpen ) {
			return;
		}

		history.push( '/connected-services' );
		trackEvent(
			`${ viewContext }_module-list`,
			'close_module_settings',
			slug
		);
	}, [ history, slug, viewContext, isOpen ] );

	const onActionClick = useCallback(
		( event ) => event.stopPropagation(),
		[]
	);

	useKeyCodesInside(
		[ ENTER ],
		headerRef,
		isOpen ? closeHeader : openHeader
	);
	useKeyCodesInside( [ ESCAPE ], headerRef, closeHeader );

	const { name, connected } = module;

	if ( ! module ) {
		return null;
	}

	let moduleStatus = null;

	if ( connected ) {
		moduleStatus = <p>{ __( 'Connected', 'google-site-kit' ) }</p>;
	} else {
		moduleStatus = (
			<Button href={ adminReauthURL } onClick={ onActionClick }>
				{ sprintf(
					/* translators: %s: module name. */
					__( 'Complete setup for %s', 'google-site-kit' ),
					name
				) }
			</Button>
		);
	}

	return (
		// eslint-disable-next-line jsx-a11y/click-events-have-key-events
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
			onClick={ isOpen ? closeHeader : openHeader }
			ref={ headerRef }
			tabIndex="0"
		>
			<Grid>
				<Row>
					<Cell
						lgSize={ 6 }
						mdSize={ 4 }
						smSize={ 4 }
						className="googlesitekit-settings-module__heading"
					>
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
									hasLeftSpacing
								/>
							) }
							{ slug === 'ads' && <NewBadge hasLeftSpacing /> }
						</div>
					</Cell>

					<Cell
						lgSize={ 6 }
						mdSize={ 4 }
						smSize={ 4 }
						alignMiddle
						mdAlignRight
					>
						<div
							className={ classnames(
								'googlesitekit-settings-module__status',
								{
									'googlesitekit-settings-module__status--connected':
										connected,
									'googlesitekit-settings-module__status--not-connected':
										! connected,
								}
							) }
						>
							{ moduleStatus }
							<span
								className={ classnames(
									'googlesitekit-settings-module__status-icon',
									{
										'googlesitekit-settings-module__status-icon--connected':
											connected,
										'googlesitekit-settings-module__status-icon--not-connected':
											! connected,
									}
								) }
							>
								{ connected ? (
									<ConnectedIcon width={ 10 } height={ 8 } />
								) : (
									<WarningIcon width={ 19 } height={ 17 } />
								) }
							</span>
						</div>
					</Cell>
				</Row>
			</Grid>
			<IconWrapper>
				<ChevronDown
					width={ 12 }
					height={ 8 }
					className="icon-chevron-down"
				/>
			</IconWrapper>
		</div>
	);
}

Header.propTypes = {
	slug: PropTypes.string.isRequired,
};
