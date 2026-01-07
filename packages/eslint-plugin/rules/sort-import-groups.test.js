/**
 * ESLint rules: sort-import-groups tests.
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
import { RuleTester } from 'eslint';

/**
 * Internal dependencies
 */
import rule from './sort-import-groups';

const ruleTester = new RuleTester( {
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 2015,
	},
} );

ruleTester.run( 'sort-import-groups', rule, {
	valid: [
		// Properly sorted with all three groups
		{
			code: `
/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import { useIntersection } from 'react-use';

/**
 * WordPress dependencies
 */
import { useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import Banner from './Banner';
`,
		},

		// Only external dependencies
		{
			code: `
/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';
`,
		},

		// Only WordPress dependencies
		{
			code: `
/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
`,
		},

		// Only internal dependencies
		{
			code: `
/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import Banner from './Banner';
`,
		},

		// Sorted members within import
		{
			code: `
/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useState } from '@wordpress/element';
`,
		},

		// Different internal dependency patterns
		{
			code: `
/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import Component from '../components/Component';
import LocalComponent from './LocalComponent';
`,
		},

		// Require statements
		{
			code: `
/**
 * External dependencies
 */
const globToRegExp = require( 'glob-to-regexp' );
const path = require( 'path' );
`,
		},
	],

	invalid: [
		// Missing comment block for external dependencies
		{
			code: `
import PropTypes from 'prop-types';
import React from 'react';
`,
			errors: [
				{
					message:
						'Import from \'prop-types\' should be preceded by a "External dependencies" comment block.',
				},
			],
			output: `
/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';
`,
		},

		// Missing comment block for WordPress dependencies
		{
			code: `
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
`,
			errors: [
				{
					message:
						'Import from \'@wordpress/element\' should be preceded by a "WordPress dependencies" comment block.',
				},
			],
			output: `
/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
`,
		},

		// Missing comment block for internal dependencies
		{
			code: `
import { useSelect } from 'googlesitekit-data';
import Banner from './Banner';
`,
			errors: [
				{
					message:
						'Import from \'googlesitekit-data\' should be preceded by a "Internal dependencies" comment block.',
				},
			],
			output: `
/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import Banner from './Banner';
`,
		},

		// Unsorted imports in same group
		{
			code: `
/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
`,
			errors: [
				{
					message:
						"Import from 'prop-types' should be sorted alphabetically (before 'react').",
				},
			],
			output: `
/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';
`,
		},

		// Unsorted WordPress dependencies
		{
			code: `
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useCallback } from '@wordpress/element';
`,
			errors: [
				{
					message:
						"Import from '@wordpress/element' should be sorted alphabetically (before '@wordpress/i18n').",
				},
			],
			output: `
/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
`,
		},

		// Unsorted members
		{
			code: `
/**
 * WordPress dependencies
 */
import { useState, useCallback, useEffect } from '@wordpress/element';
`,
			errors: [
				{
					message:
						"Member 'useCallback' of the import declaration should be sorted alphabetically.",
				},
			],
			output: `
/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useState } from '@wordpress/element';
`,
		},

		// Multiple groups without proper comments
		{
			code: `
import PropTypes from 'prop-types';
import { __ } from '@wordpress/i18n';
import { useSelect } from 'googlesitekit-data';
`,
			errors: [
				{
					message:
						'Import from \'prop-types\' should be preceded by a "External dependencies" comment block.',
				},
				{
					message:
						'Import from \'@wordpress/i18n\' should be preceded by a "WordPress dependencies" comment block.',
				},
				{
					message:
						'Import from \'googlesitekit-data\' should be preceded by a "Internal dependencies" comment block.',
				},
			],
			output: `
/**
 * External dependencies
 */
import PropTypes from 'prop-types';
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
`,
		},

		// Wrong order - should reorganize
		{
			code: `
import { useSelect } from 'googlesitekit-data';
import PropTypes from 'prop-types';
`,
			errors: [
				{
					message:
						"Import from 'prop-types' should come before Internal dependencies imports.",
				},
			],
			output: `
/**
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';

`,
		},

		// Unsorted internal dependencies
		{
			code: `
/**
 * Internal dependencies
 */
import LocalComponent from './LocalComponent';
import { useSelect } from 'googlesitekit-data';
`,
			errors: [
				{
					message:
						"Import from 'googlesitekit-data' should be sorted alphabetically (before './LocalComponent').",
				},
			],
			output: `
/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import LocalComponent from './LocalComponent';
`,
		},

		// Mixed require and import - will need two passes to fully fix
		{
			code: `
const path = require( 'path' );
const globToRegExp = require( 'glob-to-regexp' );
`,
			errors: [
				{
					message:
						'Import from \'path\' should be preceded by a "External dependencies" comment block.',
				},
				{
					message:
						"Import from 'glob-to-regexp' should be sorted alphabetically (before 'path').",
				},
			],
			// First pass adds the comment
			output: `
/**
 * External dependencies
 */
const path = require( 'path' );
const globToRegExp = require( 'glob-to-regexp' );
`,
		},

		// Complex sorting scenario
		{
			code: `
/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useEffect, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Banner from './Banner';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
`,
			errors: [
				{
					message:
						"Import from 'prop-types' should be sorted alphabetically (before 'react').",
				},
				{
					message:
						"Import from 'classnames' should be sorted alphabetically (before 'prop-types').",
				},
				{
					message:
						"Member 'useCallback' of the import declaration should be sorted alphabetically.",
				},
				{
					message:
						"Import from '@/js/googlesitekit/datastore/user/constants' should be sorted alphabetically (before './Banner').",
				},
			],
			output: `
/**
 * External dependencies
 */
import classnames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

/**
 * WordPress dependencies
 */
import { useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import Banner from './Banner';
`,
		},

		// Duplicate comment blocks within same group
		{
			code: `
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
`,
			errors: [
				{
					message:
						'Duplicate or misplaced dependency comment block should be removed.',
				},
				{
					message:
						"Import from '@wordpress/element' should not have blank lines before it within the same group.",
				},
				{
					message:
						"Import from '@wordpress/element' should be sorted alphabetically (before '@wordpress/i18n').",
				},
			],
			output: `
/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
`,
		},

		// Orphaned imports after non-import code
		{
			code: `
/**
 * Internal dependencies
 */
import { Button } from 'googlesitekit-components';
import { useSelect } from 'googlesitekit-data';

const someConstant = 'value';

import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
`,
			errors: [
				{
					message:
						"Import from '@/js/googlesitekit/modules/datastore/constants' is separated from other imports. All imports should be grouped together at the top of the file.",
				},
			],
			output: `
/**
 * Internal dependencies
 */
import { Button } from 'googlesitekit-components';
import { useSelect } from 'googlesitekit-data';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';


const someConstant = 'value';


`,
		},
	],
} );
