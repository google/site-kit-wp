<?php
/**
 * OptionsTestTrait
 *
 * @package   Google\Site_Kit\Tests
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests;

use Google\Site_Kit\Core\Authentication\Credentials;
use Google\Site_Kit\Core\Util\Activation_Flag;
use Google\Site_Kit\Core\Util\Beta_Migration;
use Google\Site_Kit\Modules\AdSense;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Search_Console;
use Google\Site_Kit\Modules\Tag_Manager;

trait OptionsTestTrait {

	protected function get_option_keys() {
		return array(
			'googlesitekit-active-modules',
			'googlesitekit_analytics_adsense_linked',
			'googlesitekit_tracking_optin',
			'googlesitekit_pagespeed_insights_settings',
			Activation_Flag::OPTION_NEW_SITE_POSTS,
			Activation_Flag::OPTION_SHOW_ACTIVATION_NOTICE,
			AdSense\Settings::OPTION,
			Analytics_4\Settings::OPTION,
			Credentials::OPTION,
			Search_Console\Settings::OPTION,
			Tag_Manager\Settings::OPTION,
		);
	}

	protected function init_option_values( $is_network_mode ) {
		foreach ( $this->get_option_keys() as $option_name ) {
			if ( $is_network_mode ) {
				update_network_option( null, $option_name, "test-{$option_name}-value" );
			} else {
				update_option( $option_name, "test-{$option_name}-value" );
			}
		}
	}

	protected function assertOptionsDeleted( $is_network_mode ) {
		foreach ( $this->get_option_keys() as $option_name ) {
			if ( $is_network_mode ) {
				remove_all_filters( "default_site_option_$option_name" );
				$this->assertFalse( get_network_option( null, $option_name ) );
			} else {
				remove_all_filters( "default_option_$option_name" );
				$this->assertFalse( get_option( $option_name ) );
			}
		}
	}
}
