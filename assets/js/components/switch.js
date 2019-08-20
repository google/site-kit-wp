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
import { MDCSwitch } from 'SiteKitCore/material-components';
import PropTypes from 'prop-types';

const { Component, Fragment, createRef } = wp.element;

class Switch extends Component {
	constructor( props ) {
		super( props );
		this.switchRef = createRef();
	}

	componentDidMount() {
		new MDCSwitch( this.switchRef.current );
	}

	render() {
		const { id, onClick, label, checked, hideLabel } = this.props;

		return (
			<Fragment>
				<div
					className={ `mdc-switch ${ checked ? 'mdc-switch--checked' : '' }` }
					onClick={ onClick }
					ref={ this.switchRef }>
					<div className="mdc-switch__track">&nbsp;</div>
					<div className="mdc-switch__thumb-underlay">
						<div className="mdc-switch__thumb">
							<input
								type="checkbox"
								id={ id }
								className="mdc-switch__native-control"
								role="switch"
								checked={ checked }
								onChange={ () => {} }
							/>
						</div>
					</div>
				</div>
				<label
					className={ hideLabel ? 'screen-reader-only' : '' }
					htmlFor={ id }>
					{ label }
				</label>
			</Fragment>
		);
	}
}

Switch.propTypes = {
	id: PropTypes.string.isRequired,
	onClick: PropTypes.func,
	label: PropTypes.string.isRequired,
	checked: PropTypes.bool,
	hideLabel: PropTypes.bool,
};

Switch.defaultProps = {
	checked: false,
	hideLabel: true,
};

export default Switch;
