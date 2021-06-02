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
import { useCallback, createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_USER } from '../googlesitekit/datastore/user/constants';
import { toggleTracking, trackEvent } from '../util/tracking';
import Checkbox from './Checkbox';
import Link from './Link';
const { useSelect, useDispatch } = Data;

export default function OptIn( { id, name, className, optinAction } ) {
	const enabled = useSelect( ( select ) => select( CORE_USER ).isTrackingEnabled() );
	const saving = useSelect( ( select ) => select( CORE_USER ).isSavingTrackingEnabled() );
	const error = useSelect( ( select ) => select( CORE_USER ).getErrorForAction( 'setTrackingEnabled', [ ! enabled ] ) );

	const { setTrackingEnabled } = useDispatch( CORE_USER );
	const handleOptIn = useCallback( async ( e ) => {
		const {
			response,
			error: responseError,
		} = await setTrackingEnabled( !! e.target.checked );

		if ( ! responseError ) {
			toggleTracking( response.enabled );
			if ( response.enabled ) {
				trackEvent( 'tracking_plugin', optinAction );
			}
		}
	}, [ optinAction, setTrackingEnabled ] );

	if ( enabled === undefined ) {
		return null;
	}

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
				<span>{ __( 'Help us improve Site Kit by sharing anonymous usage data.', 'google-site-kit' ) }{ ' ' }</span>
				<span>
					{ createInterpolateElement(
						__( 'All collected data is treated in accordance with the <a>Google Privacy Policy.</a>', 'google-site-kit' ),
						{
							a: <Link
								key="link"
								href={ 'https://policies.google.com/privacy' }
								external
								inherit
							/>,
						}
					)
					}
				</span>
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
