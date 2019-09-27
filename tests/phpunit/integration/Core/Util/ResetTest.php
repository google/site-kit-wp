<?php
/**
 * ResetTest
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Clients\OAuth_Client;
use Google\Site_Kit\Core\Authentication\Credentials;
use Google\Site_Kit\Core\Authentication\First_Admin;
use Google\Site_Kit\Core\Authentication\GCP_Project;
use Google\Site_Kit\Core\Authentication\Profile;
use Google\Site_Kit\Core\Authentication\Verification;
use Google\Site_Kit\Core\Authentication\Verification_Tag;
use Google\Site_Kit\Core\Util\Activation;
use Google\Site_Kit\Core\Util\Reset;
use Google\Site_Kit\Modules\AdSense;
use Google\Site_Kit\Modules\Analytics;
use Google\Site_Kit\Modules\Optimize;
use Google\Site_Kit\Modules\PageSpeed_Insights;
use Google\Site_Kit\Modules\Search_Console;
use Google\Site_Kit\Modules\TagManager;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Util
 */
class ResetTest extends TestCase {

	public function test_all() {
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->assertFalse( $context->is_network_mode() );

		$this->run_reset( $context );
	}

	/**
	 * @group ms-required
	 */
	public function test_network_mode_all() {
		$this->network_activate_site_kit();
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->assertTrue( $context->is_network_mode() );

		$this->run_reset( $context );
	}

	protected function run_reset( Context $context ) {
		wp_load_alloptions();
		$this->assertNotFalse( wp_cache_get( 'alloptions', 'options' ) );
		$user_id         = $this->factory()->user->create();
		$reset           = new Reset( $context );
		$is_network_mode = $context->is_network_mode();
		$this->init_option_values( $is_network_mode );
		$this->init_user_option_values( $user_id, $is_network_mode );
		$this->init_transient_values( $is_network_mode );

		$reset->all();

		// Ensure options cache is flushed (must check before accessing other options as this will re-prime the cache)
		$this->assertFalse( wp_cache_get( 'alloptions', 'options' ) );
		$this->assertOptionsDeleted( $is_network_mode );
		$this->assertUserOptionsDeleted( $user_id, $is_network_mode );
		$this->assertTransientsDeleted( $is_network_mode );
	}

	protected function get_option_keys() {
		return array(
			'googlesitekit-active-modules',
			'googlesitekit_analytics_adsense_linked',
			Activation::OPTION_NEW_SITE_POSTS,
			Activation::OPTION_SHOW_ACTIVATION_NOTICE,
			AdSense::OPTION,
			Analytics::OPTION,
			Credentials::OPTION,
			First_Admin::OPTION,
			GCP_Project::OPTION,
			Optimize::OPTION,
			PageSpeed_Insights::OPTION,
			Search_Console::PROPERTY_OPTION,
			TagManager::OPTION,
		);
	}

	protected function get_user_option_keys() {
		return array(
			OAuth_Client::OPTION_ACCESS_TOKEN,
			OAuth_Client::OPTION_ACCESS_TOKEN_CREATED,
			OAuth_Client::OPTION_ACCESS_TOKEN_EXPIRES_IN,
			OAuth_Client::OPTION_AUTH_SCOPES,
			OAuth_Client::OPTION_ERROR_CODE,
			OAuth_Client::OPTION_REDIRECT_URL,
			OAuth_Client::OPTION_REFRESH_TOKEN,
			Profile::OPTION,
			Verification::OPTION,
			Verification_Tag::OPTION,
		);
	}

	protected function get_transient_keys() {
		return array(
			'googlesitekit_verification_meta_tags',
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

	protected function init_user_option_values( $user_id, $is_network_mode ) {
		foreach ( $this->get_user_option_keys() as $option_name ) {
			if ( $is_network_mode ) {
				update_user_meta( $user_id, $option_name, "test-{$option_name}-value" );
			} else {
				update_user_option( $user_id, $option_name, "test-{$option_name}-value" );
			}
		}
	}

	protected function init_transient_values( $is_network_mode ) {
		foreach ( $this->get_transient_keys() as $transient_key ) {
			if ( $is_network_mode ) {
				set_site_transient( $transient_key, "test-{$transient_key}-value" );
			} else {
				set_transient( $transient_key, "test-{$transient_key}-value" );
			}
		}
	}

	protected function assertOptionsDeleted( $is_network_mode ) {
		foreach ( $this->get_option_keys() as $option_name ) {
			if ( $is_network_mode ) {
				$this->assertFalse( get_network_option( null, $option_name ) );
			} else {
				$this->assertFalse( get_option( $option_name ) );
			}
		}
	}

	protected function assertUserOptionsDeleted( $user_id, $is_network_mode ) {
		foreach ( $this->get_user_option_keys() as $option_name ) {
			if ( $is_network_mode ) {
				$this->assertFalse( metadata_exists( 'user', $user_id, $option_name ) );
			} else {
				$this->assertFalse( get_user_option( $option_name, $user_id ) );
			}
		}
	}

	protected function assertTransientsDeleted( $is_network_mode ) {
		foreach ( $this->get_transient_keys() as $transient_key ) {
			if ( $is_network_mode ) {
				$this->assertFalse( get_site_transient( $transient_key ) );
			} else {
				$this->assertFalse( get_transient( $transient_key ) );
			}
		}
	}

	/**
	 * @TODO pull into base TestCase
	 */
	protected function network_activate_site_kit() {
		add_filter(
			'pre_site_option_active_sitewide_plugins',
			function () {
				return array( GOOGLESITEKIT_PLUGIN_BASENAME => true );
			}
		);
	}
}
