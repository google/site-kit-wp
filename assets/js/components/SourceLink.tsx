/**
 * SourceLink component.
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

/**
 * WordPress dependencies
 */
import { createInterpolateElement, useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import useWidget from '@/js/googlesitekit/widgets/hooks/useWidget';
import useViewContext from '@/js/hooks/useViewContext';
import useViewOnly from '@/js/hooks/useViewOnly';
import { trackEvent } from '@/js/util';
import Link from './Link';

export interface SourceLinkProps {
	name?: string;
	href?: string;
	className?: string;
	external?: boolean;
}

function SourceLink( {
	name = '',
	href = '',
	className = '',
	external = false,
}: SourceLinkProps ) {
	const viewContext = useViewContext();
	const viewOnlyDashboard = useViewOnly();
	const widget = useWidget();

	const handleClick = useCallback( () => {
		if ( ! widget.slug || ! viewContext ) {
			return;
		}

		trackEvent(
			`${ viewContext }_widget`,
			'click_source_link',
			widget.slug
		);
	}, [ viewContext, widget ] );

	if ( viewOnlyDashboard ) {
		return null;
	}

	return (
		<div className={ classnames( 'googlesitekit-source-link', className ) }>
			{ createInterpolateElement(
				sprintf(
					/* translators: %s: source link */
					__( 'Source: %s', 'google-site-kit' ),
					`<a>${ name }</a>`
				),
				{
					a: (
						<Link
							key="link"
							// @ts-expect-error - The `Link` component is not currently typed.
							href={ href }
							external={ external }
							onClick={ handleClick }
						/>
					),
				}
			) }
		</div>
	);
}

SourceLink.propTypes = {
	name: PropTypes.string,
	href: PropTypes.string,
	className: PropTypes.string,
	external: PropTypes.bool,
};

export default SourceLink;
