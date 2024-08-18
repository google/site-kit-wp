/**
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
 * Internal dependencies
 */
import { Cell, Grid, Row } from '../../../../material-components';
import Description from '../common/Description';
import Title from '../common/Title';

export default function NotificationWithSmallSVG( {
	title,
	description,
	learnMoreLink,
	actions,
	SmallImageSVG,
} ) {
	return (
		<Grid>
			<Row>
				<Cell
					size={ 1 }
					className="googlesitekit-publisher-win__small-media"
				>
					<SmallImageSVG />
				</Cell>

				<Cell
					smSize={ 3 }
					mdSize={ 7 }
					lgSize={ 11 }
					className="googlesitekit-publisher-win__content"
				>
					<Title title={ title }></Title>

					<Description
						description={ description }
						learnMoreLink={ learnMoreLink }
					></Description>

					{ actions }
				</Cell>
			</Row>
		</Grid>
	);
}
