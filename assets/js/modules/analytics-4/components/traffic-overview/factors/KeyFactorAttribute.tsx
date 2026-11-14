/**
 * Key factor attribute.
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
import { FC } from 'react';

/**
 * Internal dependencies
 */
import Link from '@/js/components/Link';
import Typography from '@/js/components/Typography';
import {
	SIZE_SMALL,
	TYPE_BODY,
	TYPE_LABEL,
} from '@/js/components/Typography/constants';
import { formatVisitsChange } from '@/js/modules/analytics-4/components/traffic-overview/utils/formatVisitsChange';

export interface KeyFactorAttributeProps {
	/** The title of the attribute's kind, such as "Landing page". */
	title: string;
	/** The attribute's value, such as a page path or a referring site. */
	label: string;
	/** The change in visits, negative for a drop. */
	change: number;
	/** The address the value links to, or `undefined` when it is not a link. */
	href?: string;
}

const KeyFactorAttribute: FC< KeyFactorAttributeProps > = ( {
	title,
	label,
	change,
	href,
} ) => (
	<div className="googlesitekit-traffic-overview__key-factor-attribute">
		<Typography
			as="dt"
			type={ TYPE_BODY }
			size={ SIZE_SMALL }
			className="googlesitekit-traffic-overview__key-factor-attribute-title"
		>
			{ title }
		</Typography>
		<dd className="googlesitekit-traffic-overview__key-factor-attribute-details">
			{ /* A long value is cut off with an ellipsis, so the `title` gives it in full on hover. */ }
			<Typography
				type={ TYPE_LABEL }
				size={ SIZE_SMALL }
				className="googlesitekit-traffic-overview__key-factor-attribute-value"
				title={ label }
			>
				{ href ? (
					// `noFlex` keeps the link inline, so the ellipsis cuts off
					// its text as it cuts off a value that is not a link.
					<Link
						href={ href }
						external
						hideExternalIndicator
						noFlex
						secondary
					>
						{ label }
					</Link>
				) : (
					label
				) }
			</Typography>
			<Typography
				type={ TYPE_BODY }
				size={ SIZE_SMALL }
				className="googlesitekit-traffic-overview__key-factor-attribute-change"
			>
				{ formatVisitsChange( change ) }
			</Typography>
		</dd>
	</div>
);

export default KeyFactorAttribute;
