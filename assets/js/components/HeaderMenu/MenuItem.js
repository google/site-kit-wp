/**
 * HeaderMenu MenuItem component.
 *
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
import classnames from 'classnames';
import PropTypes from 'prop-types';

export default function MenuItem( {
	id,
	className,
	role,
	isInteractive = true,
	onClick,
	icon,
	label,
	description,
	trailing,
	children,
	itemClassName = 'googlesitekit-header-menu__item',
	iconClassName = 'googlesitekit-header-menu__item-icon',
	labelClassName = 'googlesitekit-header-menu__item-label',
	descriptionClassName = 'googlesitekit-header-menu__item-description',
	trailingClassName = 'googlesitekit-header-menu__item-trailing',
} ) {
	const content = children || (
		<div className={ itemClassName }>
			{ icon && <div className={ iconClassName }>{ icon }</div> }
			{ label && <span className={ labelClassName }>{ label }</span> }
			{ description && (
				<span className={ descriptionClassName }>{ description }</span>
			) }
			{ trailing && (
				<span className={ trailingClassName }>{ trailing }</span>
			) }
		</div>
	);

	const listRole = role === undefined && isInteractive ? 'menuitem' : role;
	const listClassName = classnames( className, {
		'mdc-list-item': isInteractive,
	} );
	const hasAction = typeof onClick === 'function';

	return (
		<li
			id={ id }
			className={ listClassName || undefined }
			role={ listRole }
		>
			{ hasAction ? (
				<button
					type="button"
					className="googlesitekit-header-menu__item-button"
					onClick={ onClick }
				>
					{ content }
				</button>
			) : (
				content
			) }
		</li>
	);
}

MenuItem.propTypes = {
	id: PropTypes.string,
	className: PropTypes.string,
	role: PropTypes.string,
	isInteractive: PropTypes.bool,
	onClick: PropTypes.func,
	icon: PropTypes.node,
	label: PropTypes.node,
	description: PropTypes.node,
	trailing: PropTypes.node,
	children: PropTypes.node,
	itemClassName: PropTypes.string,
	iconClassName: PropTypes.string,
	labelClassName: PropTypes.string,
	descriptionClassName: PropTypes.string,
	trailingClassName: PropTypes.string,
};
