/* global __STORYBOOK_CLIENT_API__ */
/**
 * External dependencies
 */
import React from 'react';
import { addDecorator, configure } from '@storybook/react';

/**
 * WordPress dependencies
 */
import {
	Component,
	createRef,
	Fragment,
	createElement,
} from '@wordpress/element';
import {
	withFilters,
} from '@wordpress/components';
import { __, sprintf, setLocaleData } from '@wordpress/i18n';
import {
	getQueryString,
	addQueryArgs,
} from '@wordpress/url';
import lodash from 'lodash';
import {
	addFilter,
	removeFilter,
	addAction,
	doAction,
	applyFilters,
	removeAction,
	removeAllFilters,
} from '@wordpress/hooks';
/**
 * Internal dependencies
 */
import '../dist/assets/css/wpdashboard.css';
import '../dist/assets/css/adminbar.css';
import '../dist/assets/css/admin.css';
import '../vendor/johnpbloch/wordpress-core/wp-admin/css/common.css';
import '../vendor/johnpbloch/wordpress-core/wp-admin/css/dashboard.css';
import '../vendor/johnpbloch/wordpress-core/wp-admin/css/edit.css';
import '../vendor/johnpbloch/wordpress-core/wp-admin/css/forms.css';
import { googlesitekit as dashboardData } from '../.storybook/data/wp-admin-admin.php-page=googlesitekit-dashboard-googlesitekit';

// Default Data.
const googlesitekit = dashboardData;

// Setup.
window.wp = window.wp || {};
wp.element = wp.element || {};
wp.components = wp.components || {};
wp.i18n = wp.i18n || {};
wp.hooks = wp.hooks || {};
wp.url = {
	getQueryString,
	addQueryArgs,
};
wp.hooks.addFilter = addFilter;
wp.hooks.removeFilter = removeFilter;
wp.hooks.addAction = addAction;
wp.hooks.doAction = doAction;
wp.hooks.applyFilters = applyFilters;
wp.hooks.removeAction = removeAction;
wp.hooks.removeAllFilters = removeAllFilters;
wp.element.Component = Component;
wp.element.createRef = createRef;
wp.element.Fragment = Fragment;
wp.element.createElement = createElement;
wp.components.withFilters = withFilters;
window.lodash = lodash;
wp.i18n.__ = __ || {};
wp.i18n.setLocaleData = setLocaleData || {};
wp.i18n.sprintf = sprintf || {};
window.React = React;
window.lodash = lodash;
window.googlesitekit = window.googlesitekit || googlesitekit;
window.googlesitekit.setup = window.googlesitekit.setup || googlesitekit.setup;
window.googlesitekit.admin = window.googlesitekit.admin || googlesitekit.admin;
window.googlesitekit.modules = window.googlesitekit.modules || googlesitekit.modules;
window.googlesitekit.admin.assetsRoot = '/assets/';
window.googlesitekit.isStorybook = true;
wp.apiFetch = ( vars ) => {
	const matches = vars.path.match( '/google-site-kit/v1/modules/(.*)/data/(.*[^/])' );

	if ( window.googlesitekit.modules[ matches[ 1 ] ][ matches[ 2 ] ] ) {
		return Promise.resolve( window.googlesitekit.modules[ matches[ 1 ] ][ matches[ 2 ] ] );
	}
	return {
		then: () => {
			return {
				catch: () => false,
			};
		},
	};
};
wp.sanitize = {
	stripTags( s ) {
		return s;
	},
};

// Global Decorator.
addDecorator( ( story ) => <div className="googlesitekit-plugin-preview">
	<div className="googlesitekit-plugin">{ story() }</div>
</div> );

const req = require.context( '../stories', true, /\.stories\.js$/ );

function loadStories() {
	req.keys().forEach( ( filename ) => req( filename ) );
}

configure( loadStories, module );

// TODO Would be nice if this wrote to a file. This logs our Storybook data to the browser console. Currently it gets put in .storybook/storybook-data and used in tests/backstop/scenarios.js.
// eslint-disable-next-line no-console
console.log( '__STORYBOOK_CLIENT_API__.raw()', __STORYBOOK_CLIENT_API__.raw() );
