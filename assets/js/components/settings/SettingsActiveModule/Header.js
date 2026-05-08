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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import {
	NEW_MODULES,
	BETA_MODULES,
	EXPERIMENTAL_MODULES,
} from '@/js/components/settings/constants';
import { Grid, Row, Cell } from '@/js/material-components';
import { useKeyCodesInside } from '@/js/hooks/useKeyCodesInside';
import ModuleIcon from '@/js/components/ModuleIcon';
import Badge from '@/js/components/Badge';
import NewBadge from '@/js/components/NewBadge';
import { trackEvent } from '@/js/util';
import useViewContext from '@/js/hooks/useViewContext';
import ChevronDown from '@/svg/icons/chevron-down-v2.svg';
import IconWrapper from '@/js/components/IconWrapper';
import Typography from '@/js/components/Typography';

export default function Header( { slug } ) {
	const viewContext = useViewContext();
	const history = useHistory();
	const headerRef = useRef();

	const { moduleSlug } = useParams();
	const isOpen = moduleSlug === slug;

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

	useKeyCodesInside(
		[ ENTER ],
		headerRef,
		isOpen ? closeHeader : openHeader
	);
	useKeyCodesInside( [ ESCAPE ], headerRef, closeHeader );

	const { name, SettingsStatusComponent } = module;

	if ( ! module ) {
		return null;
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
							size={ 40 }
							className="googlesitekit-settings-module__heading-icon"
						/>

						<Typography
							as="h3"
							type="title"
							size="large"
							className="googlesitekit-settings-module__title"
						>
							{ name }
						</Typography>

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
							{ BETA_MODULES.includes( slug ) && (
								<Badge
									className="googlesitekit-badge--beta"
									label={ __( 'Beta', 'google-site-kit' ) }
									hasLeftSpacing
								/>
							) }
							{ NEW_MODULES.includes( slug ) && (
								<NewBadge hasLeftSpacing />
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
						<SettingsStatusComponent slug={ slug } />
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
