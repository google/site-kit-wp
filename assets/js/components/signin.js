/**
 * SignIn component.
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
 * Internal dependencies
 */
import Button from './button';

const { __ } = wp.i18n;
const { Component } = wp.element;

class SignIn extends Component {
	render() {
		return (
			<div className={ `googlesitekit-signin-box ${ this.props.className }` }>
				{ this.props.children }
				<Button href={ this.props.authentication_url }>{ __( 'Sign in with Google', 'google-site-kit' ) }</Button>
			</div>

		);
	}
}

export default SignIn;
