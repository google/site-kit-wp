<?php
/**
 * Remote_Features_ProviderTest
 *
 * @package   Google\Site_Kit\Tests\Core\Remote_Features
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Remote_Features;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Credentials;
use Google\Site_Kit\Core\Remote_Features\Remote_Features;
use Google\Site_Kit\Core\Remote_Features\Remote_Features_Provider;
use Google\Site_Kit\Core\Remote_Features\Remote_Features_Sync;
use Google\Site_Kit\Core\Storage\Encrypted_Options;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Tests\Fake_Site_Connection_Trait;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Remote_Features
 */
class Remote_Features_ProviderTest extends TestCase {
	use Fake_Site_Connection_Trait;

	public function set_up() {
		parent::set_up();
		// Clean up side-effects from load in Plugin class.
		remove_all_actions( 'admin_init' );
		remove_all_filters( 'googlesitekit_is_feature_enabled' );
		remove_all_actions( Remote_Features_Sync::CRON_ACTION );
		unregister_setting( Remote_Features::OPTION, Remote_Features::OPTION );
	}

	public function test_register() {
		$provider = $this->new_instance();
		$this->assertSettingNotRegistered( Remote_Features::OPTION );

		$provider->register();

		$this->assertSettingRegistered( Remote_Features::OPTION );
		$this->assertTrue( has_action( 'admin_init' ) );
		$this->assertTrue( has_action( Remote_Features_Sync::CRON_ACTION ) );
		$this->assertTrue( has_filter( 'googlesitekit_is_feature_enabled' ) );
	}

	public function test_register__admin_init__no_proxy() {
		$this->fake_site_connection();
		$provider = $this->new_instance();
		$provider->register();
		$http_requests = array();
		$this->subscribe_to_wp_http_requests(
			function ( $url ) use ( &$http_requests ) {
				$http_requests[] = $url;
			}
		);

		do_action( 'admin_init' );

		$this->assertFalse(
			wp_next_scheduled( Remote_Features_Sync::CRON_ACTION )
		);
		// Simulate change to credentials.
		list( $oauth2_client_id, $oauth2_client_secret ) = $this->get_fake_site_credentials();
		( new Credentials( new Encrypted_Options( new Options( new Context( '' ) ) ) ) )->set(
			compact( 'oauth2_client_id', 'oauth2_client_secret' )
		);

		$this->assertEmpty( $http_requests );
	}

	public function test_register__admin_init__proxy() {
		$this->fake_proxy_site_connection();
		$provider = $this->new_instance();
		$provider->register();
		$http_requests = array();
		$this->subscribe_to_wp_http_requests(
			function ( $url ) use ( &$http_requests ) {
				$http_requests[] = $url;
			}
		);

		do_action( 'admin_init' );

		$this->assertNotEmpty(
			wp_next_scheduled( Remote_Features_Sync::CRON_ACTION )
		);
		// Simulate change to credentials.
		list( $oauth2_client_id, $oauth2_client_secret ) = $this->get_fake_proxy_credentials();
		( new Credentials( new Encrypted_Options( new Options( new Context( '' ) ) ) ) )->set(
			compact( 'oauth2_client_id', 'oauth2_client_secret' )
		);

		$this->assertContains( 'https://sitekit.withgoogle.com/site-management/features/', $http_requests );
	}

	protected function new_instance() {
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );

		return new Remote_Features_Provider(
			$context,
			new Options( $context )
		);
	}
}
