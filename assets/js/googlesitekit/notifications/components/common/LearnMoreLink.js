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
 * Internal dependencies
 */
import Link from '../../../../components/Link';
import useNotificationEvents from '../../hooks/useNotificationEvents';

export default function LearnMoreLink( {
	id,
	label,
	url,
	ariaLabel,
	gaTrackingEventArgs,
	...otherProps
} ) {
	const trackEvents = useNotificationEvents( id );

	const handleLearnMore = ( event ) => {
		event.persist();
		trackEvents.clickLearnMore(
			gaTrackingEventArgs?.label,
			gaTrackingEventArgs?.value
		);
	};

	return (
		<Link
			onClick={ handleLearnMore }
			href={ url }
			aria-label={ ariaLabel }
			external
			{ ...otherProps }
		>
			{ label }
		</Link>
	);
}

LearnMoreLink.propTypes = {
	id: PropTypes.string,
	label: PropTypes.string,
	url: PropTypes.string,
	ariaLabel: PropTypes.string,
	gaTrackingEventArgs: PropTypes.shape( {
		label: PropTypes.string,
		value: PropTypes.string,
	} ),
};
