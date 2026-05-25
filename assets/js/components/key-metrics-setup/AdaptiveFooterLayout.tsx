/**
 * Adaptive Footer Layout component.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { FC, ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { useLayoutEffect, useRef, useState } from '@wordpress/element';

interface AdaptiveFooterLayoutProps {
	className: string;
	inlineClassName: string;
	footerClassName: string;
	footer: ReactNode;
	children?: ReactNode;
}

const AdaptiveFooterLayout: FC< AdaptiveFooterLayoutProps > = ( {
	className,
	inlineClassName,
	footerClassName,
	footer,
	children,
} ) => {
	const contentRef = useRef< HTMLDivElement >( null );
	const footerRef = useRef< HTMLDivElement >( null );
	const [ footerInline, setFooterInline ] = useState( false );

	useLayoutEffect( () => {
		const view = contentRef.current?.ownerDocument?.defaultView;

		if ( ! view ) {
			return undefined;
		}

		function checkFits() {
			if ( ! contentRef.current || ! footerRef.current ) {
				return;
			}

			const contentBottom =
				contentRef.current.getBoundingClientRect().bottom;
			const footerHeight = footerRef.current.offsetHeight;

			setFooterInline(
				contentBottom + footerHeight <= view!.innerHeight
			);
		}

		checkFits();
		view.addEventListener( 'resize', checkFits );

		return () => view.removeEventListener( 'resize', checkFits );
	}, [] );

	return (
		<div
			ref={ contentRef }
			className={ classnames( className, {
				[ inlineClassName ]: footerInline,
			} ) }
		>
			{ children }
			<div ref={ footerRef } className={ footerClassName }>
				{ footer }
			</div>
		</div>
	);
};

export default AdaptiveFooterLayout;
