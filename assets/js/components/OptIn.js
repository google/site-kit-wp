/**
 * OptIn component.
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

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_USER } from '../googlesitekit/datastore/user/constants';
import { sanitizeHTML } from '../util';
import { toggleTracking, trackEvent } from '../util/tracking';
import Checkbox from './Checkbox';
const { useSelect, useDispatch } = Data;

export default function OptIn( { id, name, className, optinAction } ) {
	const enabled = useSelect( ( select ) => select( CORE_USER ).isTrackingEnabled() );
	const saving = useSelect( ( select ) => select( CORE_USER ).isSavingUserTracking() );
	const error = useSelect( ( select ) => select( CORE_USER ).getErrorForAction( 'saveUserTracking', [ ! enabled ] ) );

	const { saveUserTracking } = useDispatch( CORE_USER );
	const handleOptIn = useCallback( ( e ) => {
		const checked = !! e.target.checked;

		toggleTracking( checked );
		if ( checked ) {
			trackEvent( 'tracking_plugin', optinAction );
		}

		saveUserTracking( checked );
	}, [ enabled, optinAction ] );

	if ( enabled === undefined ) {
		return null;
	}

	const labelHTML = sprintf(
		/* translators: %s: privacy policy URL */
		__( 'Help us improve the Site Kit plugin by allowing tracking of anonymous usage stats. All data are treated in accordance with <a href="%s" target="_blank" rel="noopener noreferrer">Google Privacy Policy</a>', 'google-site-kit' ),
		'https://policies.google.com/privacy'
	);

	const allowedDOM = {
		ALLOWED_TAGS: [ 'a' ],
		ALLOWED_ATTR: [ 'href', 'target', 'rel' ],
	};

	return (
		<div className={ classnames( 'googlesitekit-opt-in', className ) }>
			<Checkbox
				id={ id }
				name={ name }
				value="1"
				checked={ enabled }
				disabled={ saving }
				onChange={ handleOptIn }
			>
				<span dangerouslySetInnerHTML={ sanitizeHTML( labelHTML, allowedDOM ) } />
			</Checkbox>

			{ error?.message && (
				<div className="googlesitekit-error-text">
					{ error?.message }
				</div>
			) }
		</div>
	);
}

OptIn.propTypes = {
	id: PropTypes.string,
	name: PropTypes.string,
	className: PropTypes.string,
	optinAction: PropTypes.string,
};

OptIn.defaultProps = {
	id: 'googlesitekit-opt-in',
	name: 'optIn',
};
