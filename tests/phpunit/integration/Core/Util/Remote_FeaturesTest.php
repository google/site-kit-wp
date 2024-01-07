<?php
/**
 * Remote_FeaturesTest
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Authentication\Google_Proxy;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Util\Remote_Features;
use Google\Site_Kit\Tests\Fake_Site_Connection_Trait;
use Google\Site_Kit\Tests\TestCase;
use WP_Error;

/**
 * @group Util
 */
class Remote_FeaturesTest extends TestCase {

	use Fake_Site_Connection_Trait;

	/**
	 * @var Context
	 */
	private $context;

	/**
	 * @var Authentication
	 */
	private $authentication;

	/**
	 * @var Options
	 */
	private $options;

	/**
	 * @var Remote_Features
	 */
	private $remote_features;

	public function set_up() {
		parent::set_up();

		$this->context         = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->options         = new Options( $this->context );
		$this->authentication  = new Authentication( $this->context, $this->options );
		$this->remote_features = new Remote_Features( $this->options, $this->authentication );
	}

	public function test_register__setup_remote_features_cron() {
		remove_all_actions( 'googlesitekit_cron_update_remote_features' );
		wp_clear_scheduled_hook( 'googlesitekit_cron_update_remote_features' );

		$this->assertFalse( has_action( 'googlesitekit_cron_update_remote_features' ) );
		$this->assertFalse(
			wp_next_scheduled( 'googlesitekit_cron_update_remote_features' )
		);

		$current_time = time();

		$this->remote_features->register();

		$this->assertTrue( has_action( 'googlesitekit_cron_update_remote_features' ) );
		$this->assertGreaterThanOrEqual(
			$current_time,
			wp_next_scheduled( 'googlesitekit_cron_update_remote_features' )
		);
	}

	public function test_filter_features() {
		remove_all_filters( 'googlesitekit_is_feature_enabled' );

		$this->assertFalse( has_filter( 'googlesitekit_is_feature_enabled' ) );
		$this->remote_features->register();
		$this->assertTrue( has_filter( 'googlesitekit_is_feature_enabled' ) );

		// Test original feature values are returned when feature flags within options are not set.
		delete_option( Remote_Features::OPTION );
		$this->assertFalse( apply_filters( 'googlesitekit_is_feature_enabled', false, 'nonExistentFeature' ) );
		$this->assertFalse( apply_filters( 'googlesitekit_is_feature_enabled', false, 'test.featureOne' ) );
		$this->assertTrue( apply_filters( 'googlesitekit_is_feature_enabled', true, 'test.featureTwo' ) );

		// Update option with feature flag data.
		$feature_flags = array(
			'gm3Components'   => array( 'enabled' => true ),
			'test.featureOne' => array( 'enabled' => true ),
			'test.featureTwo' => array( 'enabled' => false ),
		);
		update_option( Remote_Features::OPTION, $feature_flags );

		// Test values are returned correctly from the feature flags stored in the database.
		$this->assertFalse( apply_filters( 'googlesitekit_is_feature_enabled', false, 'nonExistentFeature' ) );
		$this->assertTrue( apply_filters( 'googlesitekit_is_feature_enabled', false, 'test.featureOne' ) );
		$this->assertFalse( apply_filters( 'googlesitekit_is_feature_enabled', true, 'test.featureTwo' ) );
	}

	public function test_cron_update_remote_features() {
		remove_all_actions( 'googlesitekit_cron_update_remote_features' );

		$this->assertFalse( has_action( 'googlesitekit_cron_update_remote_features' ) );
		$this->remote_features->register();
		$this->assertTrue( has_action( 'googlesitekit_cron_update_remote_features' ) );

		$google_proxy          = $this->authentication->get_google_proxy();
		$features_request_url  = $google_proxy->url( Google_Proxy::FEATURES_URI );
		$proxy_server_requests = array();
		// Collect any HTTP requests to the proxy server to fetch enabled features.
		$this->subscribe_to_wp_http_requests(
			function ( $url, $args ) use ( &$proxy_server_requests, $features_request_url ) {
				if ( $features_request_url === $url ) {
					$proxy_server_requests[] = $args;
				}
			}
		);

		// No requests should be made when the site is not connected.
		do_action( 'googlesitekit_cron_update_remote_features' );
		$this->assertEmpty( $proxy_server_requests );

		$this->fake_proxy_site_connection();

		// Test that a request to the Google Proxy server is made when the site is connected.
		do_action( 'googlesitekit_cron_update_remote_features' );
		$this->assertCount( 1, $proxy_server_requests );
	}

	public function test_cron_update_remote_features__wp_error() {
		remove_all_actions( 'googlesitekit_cron_update_remote_features' );

		$this->remote_features->register();

		$google_proxy          = $this->authentication->get_google_proxy();
		$proxy_server_requests = array();

		// Fake an unsuccessful response IF a request is made to the Google Proxy server.
		add_filter(
			'pre_http_request',
			function( $preempt, $args, $url ) use ( $google_proxy, &$proxy_server_requests ) {
				if ( $google_proxy->url( Google_Proxy::FEATURES_URI ) !== $url ) {
					return $preempt;
				}
				// Collect any HTTP requests to the proxy server to fetch enabled features.
				$proxy_server_requests[] = $args;
				return new WP_Error( 'test_error', 'test_error_message' );
			},
			10,
			3
		);

		$this->fake_proxy_site_connection();
		$test_features = array(
			'gm3Components'   => array( 'enabled' => true ),
			'test.featureOne' => array( 'enabled' => true ),
			'test.featureTwo' => array( 'enabled' => false ),
		);
		// Set the persistent option to mock saved data from a previous successful fetch.
		update_option( 'googlesitekitpersistent_remote_features', $test_features );
		$this->assertOptionExists( 'googlesitekitpersistent_remote_features' );

		// Execute the cron action and test if a request was made to the Google Proxy server.
		do_action( 'googlesitekit_cron_update_remote_features' );
		$this->assertCount( 1, $proxy_server_requests );

		// Test that the persistent option remains untouched for an unsuccesful response.
		$this->assertEquals( $test_features, get_option( 'googlesitekitpersistent_remote_features' ) );
	}
}
