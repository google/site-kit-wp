/**
 * PageHeader component.
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
 * Internal dependencies
 */
import { Cell, Row } from '../material-components';
import ConnectedIcon from '../../svg/icons/connected.svg';
import ExclamationIcon from '../../svg/icons/exclamation.svg';
import IconWrapper from './IconWrapper';

export default function PageHeader( props ) {
	const { title, icon, className, status, statusText, fullWidth, children } =
		props;

	const titleCellProps = fullWidth
		? {
				size: 12,
		  }
		: {
				smSize: 4,
				mdSize: 4,
				lgSize: 6,
		  };

	// Determine whether the details cell should display.
	const hasDetails = '' !== status || Boolean( children );

	return (
		<header className="googlesitekit-page-header">
			<Row>
				{ title && (
					<Cell { ...titleCellProps }>
						{ icon }
						<h1
							className={ classnames(
								'googlesitekit-page-header__title',
								className
							) }
						>
							{ title }
						</h1>
					</Cell>
				) }
				{ hasDetails && (
					<Cell
						alignBottom
						mdAlignRight
						smSize={ 4 }
						mdSize={ 4 }
						lgSize={ 6 }
					>
						<div className="googlesitekit-page-header__details">
							{ status && (
								<span
									className={ classnames(
										'googlesitekit-page-header__status',
										`googlesitekit-page-header__status--${ status }`
									) }
								>
									{ statusText }
									<IconWrapper>
										{ 'connected' === status ? (
											<ConnectedIcon
												width={ 10 }
												height={ 8 }
											/>
										) : (
											<ExclamationIcon
												width={ 2 }
												height={ 12 }
											/>
										) }
									</IconWrapper>
								</span>
							) }
							{ children }
						</div>
					</Cell>
				) }
			</Row>
		</header>
	);
}

PageHeader.propTypes = {
	title: PropTypes.string,
	icon: PropTypes.node,
	className: PropTypes.string,
	status: PropTypes.string,
	statusText: PropTypes.string,
	fullWidth: PropTypes.bool,
};

PageHeader.defaultProps = {
	title: '',
	icon: null,
	className: 'googlesitekit-heading-3',
	status: '',
	statusText: '',
	fullWidth: false,
};
