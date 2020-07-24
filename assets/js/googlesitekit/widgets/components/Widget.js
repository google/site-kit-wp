/**
 * Widget component.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import classnames from 'classnames';
import { node, string } from 'prop-types';

const Widget = ( { children, className, slug } ) => {
	return (
		<div className={ classnames( 'googlesitekit-widget', `googlesitekit-widget--${ slug }`, className ) }>
			{ children }
		</div>
	);
};

Widget.defaultProps = {
	children: undefined,
};

Widget.propTypes = {
	children: node,
	slug: string.isRequired,
};

export default Widget;
