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
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import useNotificationEvents from '../../hooks/useNotificationEvents';
import { Button, CircularProgress } from 'googlesitekit-components';
import ExternalSVG from '../../../../../svg/icons/external.svg';

export default function CTALinkSubtle( {
	id,
	ctaLink,
	ctaLabel,
	onCTAClick,
	isCTALinkExternal = false,
	gaTrackingEventArgs,
	tertiary = false,
	isSaving = false,
} ) {
	const trackEvents = useNotificationEvents( id );

	const handleCTAClick = async ( event ) => {
		await onCTAClick?.( event );

		trackEvents.confirm(
			gaTrackingEventArgs?.label,
			gaTrackingEventArgs?.value
		);
	};

	return (
		<Button
			className={ classnames( 'googlesitekit-subtle-notification__cta', {
				'googlesitekit-subtle-notification__cta--spinner__running':
					isSaving,
			} ) }
			href={ ctaLink }
			onClick={ handleCTAClick }
			target={ isCTALinkExternal ? '_blank' : '_self' }
			trailingIcon={
				isCTALinkExternal ? (
					<ExternalSVG width={ 14 } height={ 14 } />
				) : undefined
			}
			icon={ isSaving && <CircularProgress size={ 14 } /> }
			tertiary={ tertiary }
		>
			{ ctaLabel }
		</Button>
	);
}

// eslint-disable-next-line sitekit/acronym-case
CTALinkSubtle.propTypes = {
	id: PropTypes.string,
	ctaLink: PropTypes.string,
	ctaLabel: PropTypes.string,
	onCTAClick: PropTypes.func,
	isCTALinkExternal: PropTypes.bool,
	gaTrackingEventArgs: PropTypes.shape( {
		label: PropTypes.string,
		value: PropTypes.string,
	} ),
	tertiary: PropTypes.bool,
	isSaving: PropTypes.bool,
};
