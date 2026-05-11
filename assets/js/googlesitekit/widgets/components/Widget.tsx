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
import { ElementType, FC, ReactNode } from 'react';
import { useMount } from 'react-use';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { forwardRef, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ChevronDown from '@/svg/icons/chevron-down-v2.svg';
import IconWrapper from '@/js/components/IconWrapper';

export interface WidgetProps {
	className?: string;
	collapsible?: boolean;
	defaultCollapsed?: boolean;
	isCollapsed?: boolean;
	Header?: ElementType;
	headerContents?: ReactNode;
	Footer?: ElementType;
	noPadding?: boolean;
	widgetSlug: string;
}

const Widget: FC< WidgetProps > = forwardRef< HTMLDivElement, WidgetProps >(
	(
		{
			className = '',
			children,
			collapsible = false,
			defaultCollapsed,
			isCollapsed: isCollapsedProp,
			Header,
			headerContents,
			Footer,
			noPadding = false,
			widgetSlug,
		},
		ref
	) => {
		const [ isCollapsed, setIsCollapsed ] = useState( !! defaultCollapsed );

		const instanceID = useInstanceId( Widget );

		// If the `isCollapsed` prop is provided, it will control the collapsed
		// state of the widget. This allows the parent component to manage the
		// state of the widget, while still allowing the widget to manage its
		// own state when the prop is not provided.
		useEffect( () => {
			if ( isCollapsedProp !== undefined ) {
				setIsCollapsed( isCollapsedProp );
			}
		}, [ isCollapsedProp ] );

		function toggleIsCollapsed() {
			if ( collapsible ) {
				setIsCollapsed( ( prevState ) => ! prevState );
			}
		}

		useMount( () => {
			if (
				defaultCollapsed !== undefined &&
				isCollapsedProp !== undefined
			) {
				// This console warning is meant to help developers understand
				// that the `defaultCollapsed` prop should not be combibed with
				// the `isCollapsed` prop, so this console statement should be
				// allowed.
				// eslint-disable-next-line no-console
				console.warn(
					`Error in \`Widget\` compoenent:The \`defaultCollapsed\` prop should not be used together with the \`isCollapsed\` prop. Providing the \`isCollapsed\` prop means the \`Widget\` component for slug "${ widgetSlug }" is controlled by its parent component, and the \`defaultCollapsed\` prop will be ignored.`
				);
			}
		} );

		// Check if the widget is collapsible and uncontrolled (i.e.
		// `isCollapsed` prop is not provided). If so, set the appropriate
		// aria-label for the toggle button.
		const collapsibleAndUncontrolled =
			!! collapsible && isCollapsedProp === undefined;

		let ariaLabel: string | undefined;
		if ( collapsibleAndUncontrolled ) {
			ariaLabel = isCollapsed
				? __( 'Expand section', 'google-site-kit' )
				: __( 'Hide section', 'google-site-kit' );
		}

		return (
			<div
				className={ classnames(
					'googlesitekit-widget',
					`googlesitekit-widget--${ widgetSlug }`,
					{ 'googlesitekit-widget--no-padding': noPadding },
					{ 'googlesitekit-widget--with-header': Header },
					className
				) }
				ref={ ref }
			>
				{ Header && (
					<div
						aria-expanded={
							collapsibleAndUncontrolled
								? ! isCollapsed
								: undefined
						}
						aria-controls={
							collapsibleAndUncontrolled
								? `googlesitekit-widget-body-${ instanceID }`
								: undefined
						}
						aria-label={
							collapsibleAndUncontrolled ? ariaLabel : undefined
						}
						className={ classnames(
							'googlesitekit-widget__header',
							{
								'googlesitekit-widget__header--collapsible':
									collapsible,
								'googlesitekit-widget__header--collapsed':
									isCollapsed,
							}
						) }
						onClick={
							collapsibleAndUncontrolled
								? toggleIsCollapsed
								: undefined
						}
						onKeyUp={
							collapsibleAndUncontrolled
								? ( event ) => {
										if ( event.key === 'Enter' ) {
											toggleIsCollapsed();
										}
								  }
								: undefined
						}
						role={
							collapsibleAndUncontrolled ? 'button' : undefined
						}
						tabIndex={ collapsibleAndUncontrolled ? 0 : undefined }
					>
						<Header>
							<div className="googlesitekit-widget__header-inner">
								{ !! collapsible && (
									<IconWrapper
										marginLeft={ 4 }
										marginRight={ 8 }
									>
										<ChevronDown
											width={ 12 }
											height={ 12 }
											className={ classnames( {
												'googlesitekit-widget__header-icon--collapsed':
													isCollapsed,
											} ) }
										/>
									</IconWrapper>
								) }
								{ headerContents }
							</div>
						</Header>
					</div>
				) }
				<div
					className={ classnames( 'googlesitekit-widget__body', {
						'googlesitekit-widget__body--collapsed': !! isCollapsed,
					} ) }
					id={
						!! collapsible
							? `googlesitekit-widget-body-${ instanceID }`
							: undefined
					}
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
	}
);

export default Widget;
