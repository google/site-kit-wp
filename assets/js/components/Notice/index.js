/**
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Icon from './Icon';
import Title from './Title';
import Description from './Description';
import CTAButton from './CTAButton';
import DismissButton from './DismissButton';

const Notice = forwardRef(
	(
		{
			className,
			title,
			description,
			dismissButton,
			ctaButton,
			type = 'info',
			children,
		},
		ref
	) => {
		return (
			<div
				ref={ ref }
				className={ classnames(
					'googlesitekit-notice',
					`googlesitekit-notice--${ type }`,
					className
				) }
			>
				<Icon type={ type } />

				<div className="googlesitekit-notice__content">
					<Title>{ title }</Title>
					<Description>{ description }</Description>
				</div>

				<div className="googlesitekit-notice__action">
					{ children }

					{ dismissButton?.label && dismissButton?.onClick && (
						<DismissButton
							label={ dismissButton.label }
							onDismiss={ dismissButton.onClick }
						/>
					) }
					{ ctaButton?.label && ctaButton?.onClick && (
						<CTAButton
							label={ ctaButton.label }
							onClick={ ctaButton.onClick }
						/>
					) }
				</div>
			</div>
		);
	}
);

const ctaButtonAPI = PropTypes.shape( {
	label: PropTypes.string,
	onClick: PropTypes.func,
} );

Notice.propTypes = {
	className: PropTypes.string,
	title: PropTypes.string,
	description: PropTypes.string,
	type: PropTypes.oneOf( [ 'success', 'warning', 'new', 'error', 'info' ] ),
	dismissButton: ctaButtonAPI,
	ctaButton: ctaButtonAPI,
	children: PropTypes.node,
};

export default Notice;
