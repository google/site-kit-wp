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

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { CORE_LOCATION } from '../../../datastore/location/constants';
import Dismiss from './Dismiss';
import CTALink from './CTALink';

export default function ActionsCTALinkDismiss( {
	id,
	className = 'googlesitekit-publisher-win__actions',
	ctaLink,
	ctaLabel,
	ctaDisabled = false,
	onCTAClick,
	ctaDismissOptions,
	isSaving = false,
	onDismiss = () => {},
	dismissLabel = __( 'OK, Got it!', 'google-site-kit' ),
	dismissOnCTAClick = true,
	dismissExpires = 0,
	dismissOptions = {},
	gaTrackingEventArgs = {},
} ) {
	const isNavigatingToCTALink = useSelect( ( select ) => {
		return ctaLink
			? select( CORE_LOCATION ).isNavigatingTo( ctaLink )
			: false;
	} );

	return (
		<Fragment>
			<div className={ className }>
				<CTALink
					id={ id }
					ctaLink={ ctaLink }
					ctaLabel={ ctaLabel }
					onCTAClick={ onCTAClick }
					dismissOnCTAClick={ dismissOnCTAClick }
					dismissExpires={ dismissExpires }
					dismissOptions={ ctaDismissOptions }
					gaTrackingEventArgs={ gaTrackingEventArgs }
					isSaving={ isSaving }
					disabled={ ctaDisabled }
				/>

				<Dismiss
					id={ id }
					primary={ false }
					dismissLabel={ dismissLabel }
					dismissExpires={ dismissExpires }
					disabled={ isNavigatingToCTALink }
					onDismiss={ onDismiss }
					dismissOptions={ dismissOptions }
					gaTrackingEventArgs={ gaTrackingEventArgs }
				/>
			</div>
		</Fragment>
	);
}

ActionsCTALinkDismiss.propTypes = {
	id: PropTypes.string,
	className: PropTypes.string,
	ctaLink: PropTypes.string,
	ctaLabel: PropTypes.string,
	onCTAClick: PropTypes.func,
	isSaving: PropTypes.bool,
	onDismiss: PropTypes.func,
	ctaDismissOptions: PropTypes.object,
	dismissLabel: PropTypes.string,
	dismissOnCTAClick: PropTypes.bool,
	dismissExpires: PropTypes.number,
	dismissOptions: PropTypes.object,
	gaTrackingEventArgs: PropTypes.object,
};
