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
import { KeyFactorLinkClickHandler } from '@/js/modules/analytics-4/components/traffic-overview/hooks/useKeyFactorLinkClick';
import {
	formatClicksChange,
	formatVisitsChange,
} from '@/js/modules/analytics-4/components/traffic-overview/utils';

export interface KeyFactorAttributeProps {
	/** The title of the attribute's kind, such as "Landing page". */
	title: string;
	/** The attribute's value, such as a page path or a referring site. */
	label: string;
	/** The change, negative for a drop. */
	change: number;
	/** What the change counts: visits, or a search keyword's clicks in Search Console. Default `visits`. */
	unit?: 'visits' | 'clicks';
	/**
	 * What the change is a share of, such as "75% of the change", under the
	 * change, or null when the attribute shows its change alone.
	 */
	shareText?: string | null;
	/** The Site Kit page the value links to, such as a landing page's entity dashboard, or `undefined` when it is not a link. */
	href?: string;
	/** Called on a click on the link, with the click event and `href`. */
	onLinkClick?: KeyFactorLinkClickHandler;
}

const KeyFactorAttribute: FC< KeyFactorAttributeProps > = ( {
	title,
	label,
	change,
	unit = 'visits',
	shareText,
	href,
	onLinkClick,
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
					// its text as it cuts off a value that is not a link. The
					// link leads to another Site Kit dashboard, so it opens in
					// the same tab.
					<Link
						href={ href }
						onClick={ ( event ) => onLinkClick?.( event, href ) }
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
				{ unit === 'clicks'
					? formatClicksChange( change )
					: formatVisitsChange( change ) }
			</Typography>
		</dd>
		{ /* The share is a second description of the same term, so a row larger than its card says why, rather than showing a bare larger number. */ }
		{ shareText && (
			<Typography
				as="dd"
				type={ TYPE_BODY }
				size={ SIZE_SMALL }
				className="googlesitekit-traffic-overview__key-factor-attribute-share"
			>
				{ shareText }
			</Typography>
		) }
	</div>
);

export default KeyFactorAttribute;
