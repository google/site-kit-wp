/**
 * Widget component.
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
import classnames from 'classnames';
import PropTypes from 'prop-types';

const Widget = ( {
	children,
	className,
	widgetSlug,
	noPadding,
	Header,
	Footer,
} ) => {
	return (
		<div
			className={ classnames(
				'googlesitekit-tw-bg-white',
				'googlesitekit-tw-rounded-sm',
				'googlesitekit-tw-flex',
				'googlesitekit-tw-flex-col',
				'googlesitekit-tw-h-full',
				`googlesitekit-widget--${ widgetSlug }`,
				{ 'googlesitekit-widget--no-padding': noPadding },
				{ 'googlesitekit-widget--with-header': Header },
				className
			) }
		>
			{ Header && (
				<div className="googlesitekit-widget__header googlesitekit-tw-border-b googlesitekit-tw-border-solid googlesitekit-tw-border-neutral-n-50 md:googlesitekit-tw-flex md:googlesitekit-tw-justify-between">
					<Header />
				</div>
			) }
			<div
				className={ classnames( 'googlesitekit-tw-flex-1', {
					'googlesitekit-tw-p-0': noPadding,
				} ) }
			>
				{ children }
			</div>
			{ Footer && (
				<div className="googlesitekit-widget__footer">
					<Footer />
				</div>
			) }
		</div>
	);
};

Widget.defaultProps = {
	children: undefined,
	noPadding: false,
};

Widget.propTypes = {
	children: PropTypes.node,
	widgetSlug: PropTypes.string.isRequired,
	noPadding: PropTypes.bool,
	Header: PropTypes.elementType,
	Footer: PropTypes.elementType,
};

export default Widget;
