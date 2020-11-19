/**
 * Switch component.
 *
 * Site Kit by Google, Copyright 2019 Google LLC
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
import { useInstanceId } from '@wordpress/compose';
import { Fragment, useCallback, useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { MDCSwitch } from '../material-components';

const Switch = ( {
	onClick,
	label,
	checked,
	disabled,
	hideLabel,
} ) => {
	// eslint-disable-next-line sitekit/camelcase-acronyms
	const instanceID = useInstanceId( Switch );
	const switchRef = useRef( null );

	useEffect( () => {
		MDCSwitch.attachTo( switchRef.current );
	} );

	const onKeyDown = useCallback( ( event ) => {
		// If the Enter key is pressed.
		if ( typeof onClick === 'function' && event.keyCode === '13' ) {
			onClick( event );
		}
	}, [ onClick ] );

	const id = `googlesitekit-switch-${ instanceID }`;

	return (
		<Fragment>
			<div
				aria-checked={ checked ? 'true' : 'false' }
				className={ classnames(
					'mdc-switch',
					{
						'mdc-switch--checked': checked,
						'mdc-switch--disabled': disabled,
					}
				) }
				onClick={ onClick }
				onKeyDown={ onKeyDown }
				role="switch"
				ref={ switchRef }
				tabIndex={ 0 }
			>
				<div className="mdc-switch__track">&nbsp;</div>
				<div className="mdc-switch__thumb-underlay">
					<div className="mdc-switch__thumb">
						<input
							type="checkbox"
							id={ id }
							className="mdc-switch__native-control"
							role="switch"
							checked={ checked }
							disabled={ disabled }
							readOnly
						/>
					</div>
				</div>
			</div>
			<label
				className={ classnames( { 'screen-reader-only': hideLabel } ) }
				htmlFor={ id }
			>
				{ label }
			</label>
		</Fragment>
	);
};

Switch.propTypes = {
	id: PropTypes.string,
	onClick: PropTypes.func,
	label: PropTypes.string.isRequired,
	checked: PropTypes.bool,
	disabled: PropTypes.bool,
	hideLabel: PropTypes.bool,
};

Switch.defaultProps = {
	checked: false,
	disabled: false,
	hideLabel: true,
};

export default Switch;
