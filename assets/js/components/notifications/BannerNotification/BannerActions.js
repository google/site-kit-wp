/**
 * Site Kit by Google, Copyright 2023 Google LLC
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
import { useState } from '@wordpress/element';

/*
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { Button, SpinnerButton } from 'googlesitekit-components';
import { CORE_LOCATION } from '../../../googlesitekit/datastore/location/constants';
import Link from '../../Link';
const { useSelect } = Data;

export default function BannerActions( props ) {
	const {
		ctaLink,
		ctaLabel,
		ctaComponent,
		ctaTarget,
		ctaCallback,
		dismissLabel,
		dismissCallback,
	} = props;

	const [ isAwaitingCTAResponse, setIsAwaitingCTAResponse ] =
		useState( false );

	const isMounted = useMountedState();

	const isNavigatingToCTALink = useSelect( ( select ) =>
		ctaLink ? select( CORE_LOCATION ).isNavigatingTo( ctaLink ) : false
	);

	const handleCTAClick = async ( ...params ) => {
		setIsAwaitingCTAResponse( true );
		await ctaCallback?.( ...params );
		if ( isMounted() ) {
			setIsAwaitingCTAResponse( false );
		}
	};

	if ( ! ctaLink && ! dismissLabel && ! ctaComponent ) {
		return null;
	}

	// ctaLink links are always buttons, in which case the dismiss should be a Link.
	// If there is only a dismiss however, it should be the primary action with a Button.
	const DismissComponent = ctaLink || ctaComponent ? Link : Button;

	return (
		<div className="googlesitekit-publisher-win__actions">
			{ ctaComponent }

			{ ctaLabel && (
				<SpinnerButton
					className="googlesitekit-notification__cta"
					href={ ctaLink }
					target={ ctaTarget }
					onClick={ handleCTAClick }
					disabled={ isAwaitingCTAResponse || isNavigatingToCTALink }
					isSaving={ isAwaitingCTAResponse || isNavigatingToCTALink }
				>
					{ ctaLabel }
				</SpinnerButton>
			) }

			{ dismissLabel && (
				<DismissComponent
					onClick={ dismissCallback }
					disabled={ isAwaitingCTAResponse || isNavigatingToCTALink }
				>
					{ dismissLabel }
				</DismissComponent>
			) }
		</div>
	);
}

BannerActions.propTypes = {
	ctaLink: PropTypes.string,
	ctaLabel: PropTypes.string,
	ctaComponent: PropTypes.element,
	ctaTarget: PropTypes.string,
	ctaCallback: PropTypes.func,
	dismissLabel: PropTypes.string,
	dismissCallback: PropTypes.func,
};
