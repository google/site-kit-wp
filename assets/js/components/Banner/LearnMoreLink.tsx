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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Link from '@/js/components/Link';
import { FC } from 'react';

/**
 * A "Learn More" link component, usually used to append "Learn more" with a
 * specified URL to content like a paragraph.
 *
 * @since 1.153.0
 */
const LearnMoreLink: FC< {
	href: string;
	className?: string;
	label?: string;
	external?: boolean;
	onClick?: () => void;
} > = ( {
	href,
	className,
	label = __( 'Learn more', 'google-site-kit' ),
	external = true,
	onClick = () => {},
} ) => {
	// Return null if no href is provided.
	//
	// This arguably shouldn't be optional, but until all usage of this
	// component are via typed code, we need this safeguard.
	if ( ! href ) {
		return null;
	}

	return (
		// @ts-expect-error `Link` component is not currently typed, so this
		// results in an error.
		<Link
			href={ href }
			className={ className }
			onClick={ onClick }
			external={ external }
		>
			{ label }
		</Link>
	);
};

export default LearnMoreLink;
