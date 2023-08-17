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
import { useCallback, useRef, useState, useEffect } from '@wordpress/element';
import { ESCAPE, ENTER } from '@wordpress/keycodes';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { Button, ProgressBar } from 'googlesitekit-components';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import { EXPERIMENTAL_MODULES } from '../../dashboard-sharing/DashboardSharingSettings/constants';
import { Grid, Row, Cell } from '../../../material-components';
import { useKeyCodesInside } from '../../../hooks/useKeyCodesInside';
import ModuleIcon from '../../ModuleIcon';
import Badge from '../../Badge';
import { trackEvent } from '../../../util';
import useViewContext from '../../../hooks/useViewContext';
import { CORE_FORMS } from '../../../googlesitekit/datastore/forms/constants';
import { FORM_SETUP } from '../../../modules/analytics/datastore/constants';
const { useSelect, useDispatch } = Data;

export default function Header( { slug } ) {
	const [ viewNotificationSent, setViewNotificationSent ] = useState( false );

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

	const isGA4Connected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'analytics-4' )
	);

	const hasAnalyticsAccess = useSelect( ( select ) => {
		if ( ! ( slug === 'analytics' && module?.connected ) ) {
			return false;
		}

		return select( CORE_MODULES ).hasModuleOwnershipOrAccess( 'analytics' );
	} );

	const { setValues } = useDispatch( CORE_FORMS );

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

	const eventCategory = `${ viewContext }_module-list`;
	useEffect( () => {
		// Only trigger the view event if the notification is visible and we haven't
		// already sent this notification.
		if (
			! viewNotificationSent &&
			connected &&
			slug === 'analytics' &&
			! isGA4Connected
		) {
			trackEvent( eventCategory, 'view_ga4_button' );
			// Don't send the view event again.
			setViewNotificationSent( true );
		}
	}, [
		eventCategory,
		connected,
		slug,
		viewNotificationSent,
		isGA4Connected,
	] );

	const handleConnectGA4ButtonClick = useCallback(
		async ( event ) => {
			// Prevent this click from toggling the header, which is
			// the default action for a click on any element in the header.
			event.stopPropagation();

			await trackEvent( eventCategory, 'click_ga4_button' );

			setValues( FORM_SETUP, {
				// Pre-enable GA4 controls.
				enableGA4: true,
				// Enable tooltip highlighting GA4 property select.
				enableGA4PropertyTooltip: true,
			} );
			history.push( `/connected-services/${ slug }/edit` );
		},
		[ eventCategory, history, setValues, slug ]
	);

	if ( ! module ) {
		return null;
	}

	// Do not show a "Connected" status for the Analytics module if GA4 is not connected.
	const showAsConnected =
		connected && ( 'analytics' !== slug || isGA4Connected );

	let moduleStatus = null;

	if ( showAsConnected ) {
		moduleStatus = <p>{ __( 'Connected', 'google-site-kit' ) }</p>;
	} else if ( 'analytics' === slug && connected && ! isGA4Connected ) {
		if ( hasAnalyticsAccess ) {
			moduleStatus = (
				<Button onClick={ handleConnectGA4ButtonClick }>
					{ __( 'Connect Google Analytics 4', 'google-site-kit' ) }
				</Button>
			);
		} else if ( hasAnalyticsAccess !== undefined ) {
			moduleStatus = (
				<p>
					{ __(
						'Google Analytics 4 is not connected',
						'google-site-kit'
					) }
				</p>
			);
		} else {
			moduleStatus = <ProgressBar height={ 36 } small />;
		}
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
										showAsConnected,
									'googlesitekit-settings-module__status--not-connected':
										! showAsConnected,
									'googlesitekit-settings-module__status--loading':
										'analytics' === slug &&
										! isGA4Connected &&
										! hasAnalyticsAccess,
								}
							) }
						>
							{ moduleStatus }
							<span
								className={ classnames(
									'googlesitekit-settings-module__status-icon',
									{
										'googlesitekit-settings-module__status-icon--connected':
											showAsConnected,
										'googlesitekit-settings-module__status-icon--not-connected':
											! showAsConnected,
									}
								) }
							/>
						</div>
					</Cell>
				</Row>
			</Grid>
		</div>
	);
}

Header.propTypes = {
	slug: PropTypes.string.isRequired,
};
