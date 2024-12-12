/**
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { useMountedState } from 'react-use';

/*
 * WordPress dependencies
 */
import { Fragment, useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useDispatch, useSelect } from 'googlesitekit-data';
import { CORE_NOTIFICATIONS } from '../../datastore/constants';
import { CORE_LOCATION } from '../../../datastore/location/constants';
import { CORE_SITE } from '../../../datastore/site/constants';
import useNotificationEvents from '../../hooks/useNotificationEvents';
import { SpinnerButton } from 'googlesitekit-components';
import ErrorText from '../../../../components/ErrorText';

export default function CTALink( {
	id,
	ctaLink,
	ctaLabel,
	onCTAClick,
	dismissOnCTAClick = false,
	dismissExpires = 0,
	showError = true,
} ) {
	const [ isAwaitingCTAResponse, setIsAwaitingCTAResponse ] =
		useState( false );
	const isMounted = useMountedState();

	const trackEvents = useNotificationEvents( id );

	const isNavigatingToCTALink = useSelect( ( select ) => {
		return ctaLink
			? select( CORE_LOCATION ).isNavigatingTo( ctaLink )
			: false;
	} );

	const ctaError = useSelect( ( select ) => {
		return select( CORE_SITE ).getError( 'notificationCTAClick', [ id ] );
	} );

	const { clearError, receiveError } = useDispatch( CORE_SITE );

	const { dismissNotification } = useDispatch( CORE_NOTIFICATIONS );
	const { navigateTo } = useDispatch( CORE_LOCATION );

	const handleCTAClick = async ( event ) => {
		clearError( 'notificationCTAClick', [ id ] );

		event.persist();
		if ( ! event.defaultPrevented && ctaLink ) {
			event.preventDefault();
		}

		setIsAwaitingCTAResponse( true );

		const { error } = ( await onCTAClick?.( event ) ) || {};

		if ( isMounted() ) {
			setIsAwaitingCTAResponse( false );
		}

		if ( error ) {
			receiveError( error, 'notificationCTAClick', [ id ] );
			return;
		}

		const ctaClickActions = [ trackEvents.confirm() ];

		if ( dismissOnCTAClick ) {
			ctaClickActions.push(
				dismissNotification( id, {
					expiresInSeconds: dismissExpires,
					skipHidingFromQueue: true,
				} )
			);
		}

		await Promise.all( ctaClickActions );

		if ( ctaLink ) {
			navigateTo( ctaLink );
		}
	};

	useEffect( () => {
		return () => {
			clearError( 'notificationCTAClick', [ id ] );
		};
	}, [ clearError, id ] );

	return (
		<Fragment>
			{ showError && ctaError && (
				<ErrorText message={ ctaError.message } />
			) }

			<SpinnerButton
				className="googlesitekit-notification__cta"
				href={ ctaLink }
				onClick={ handleCTAClick }
				disabled={ isAwaitingCTAResponse || isNavigatingToCTALink }
				isSaving={ isAwaitingCTAResponse || isNavigatingToCTALink }
			>
				{ ctaLabel }
			</SpinnerButton>
		</Fragment>
	);
}

// eslint-disable-next-line sitekit/acronym-case
CTALink.propTypes = {
	id: PropTypes.string,
	ctaLink: PropTypes.string,
	ctaLabel: PropTypes.string,
	onCTAClick: PropTypes.func,
	dismissExpires: PropTypes.number,
	showError: PropTypes.bool,
};
