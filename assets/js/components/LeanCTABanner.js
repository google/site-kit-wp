/**
 * LeanCTABanner component.
 *
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
import classnames from 'classnames';
import PropTypes from 'prop-types';

export default function LeanCTABanner( {
	className,
	children,
	Icon,
	SVGGraphic,
} ) {
	return (
		<div
			className={ classnames(
				'googlesitekit-lean-cta-banner',
				className
			) }
		>
			<div className="googlesitekit-lean-cta-banner--body">
				{ Icon && (
					<div className="googlesitekit-lean-cta-banner--body__icon">
						<Icon width="32" height="32" />
					</div>
				) }
				{
					<div className="googlesitekit-lean-cta-banner--body__content">
						{ children }
					</div>
				}
			</div>
			{ SVGGraphic && (
				<div className="googlesitekit-lean-cta-banner--graphic">
					<SVGGraphic />
				</div>
			) }
		</div>
	);
}

LeanCTABanner.propTypes = {
	className: PropTypes.string,
	children: PropTypes.node.isRequired,
	Icon: PropTypes.elementType,
	SVGGraphic: PropTypes.elementType,
};
