<?php
/**
 * Class Google\Site_Kit\Core\Authentication\Connected_Proxy_URLTest
 *
 * @package   Google\Site_Kit\Tests\Core\Authentication
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Authentication;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Authentication\Connected_Proxy_URL;
use Google\Site_Kit\Core\Authentication\Disconnected_Reason;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Tests\Fake_Site_Connection_Trait;
use Google\Site_Kit\Tests\Modules\SettingsTestCase;

/**
 * Connected_Proxy_URLTest
 *
 * @group Authentication
 */
class Connected_Proxy_URLTest extends SettingsTestCase {

	use Fake_Site_Connection_Trait;

	/**
	 * Options object.
	 *
	 * @var Options
	 */
	private $options;

	public function set_up() {
		parent::set_up();
		$this->options = new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		// Drop any sanitize filter the bootstrap plugin instance added, so a
		// test that saves the option before it registers the setting stores
		// the raw value.
		remove_all_filters( 'sanitize_option_' . Connected_Proxy_URL::OPTION );
	}

	public function test_matches_url() {
		$connected_proxy_url = new Connected_Proxy_URL( $this->options );
		$connected_proxy_url->register();

		$connected_proxy_url->set( 'https://example.com' );
		$this->assertTrue( $connected_proxy_url->matches_url( 'https://example.com/' ), 'URL should match after the setter adds a trailing slash.' );

		$connected_proxy_url->set( 'https://example.com/subdirectory' );
		$this->assertTrue( $connected_proxy_url->matches_url( 'https://example.com/subdirectory/' ), 'Subdirectory URL should match after the setter adds a trailing slash.' );

		$connected_proxy_url->set( 'https://example.com/' );
		$this->assertTrue( $connected_proxy_url->matches_url( 'https://example.com/' ), 'URL should match when both URLs have a trailing slash.' );
	}

	public function test_matches_url__with_a_legacy_plain_text_url() {
		$connected_proxy_url = new Connected_Proxy_URL( $this->options );

		// Store the option in plain text, the way earlier plugin versions saved it.
		$this->update_option( 'https://example.com/' );

		$connected_proxy_url->register();

		$this->assertTrue( $connected_proxy_url->matches_url( 'https://example.com' ), 'URL should match a legacy plain text value.' );
		$this->assertFalse( $connected_proxy_url->matches_url( 'https://other.example.com' ), "A different URL shouldn't match a legacy plain text value." );
	}

	public function test_set__stores_an_encoded_url() {
		$connected_proxy_url = new Connected_Proxy_URL( $this->options );
		$connected_proxy_url->register();

		$connected_proxy_url->set( 'https://example.com' );

		$this->assertEquals(
			base64_encode( 'https://example.com/' ),
			$this->options->get( Connected_Proxy_URL::OPTION ),
			'Setter should store the URL base64-encoded with a trailing slash.'
		);
	}

	public function test_set__avoids_double_encoding() {
		$connected_proxy_url = new Connected_Proxy_URL( $this->options );
		$connected_proxy_url->register();

		$connected_proxy_url->set( base64_encode( 'https://example.com/' ) );

		$this->assertEquals(
			base64_encode( 'https://example.com/' ),
			$this->options->get( Connected_Proxy_URL::OPTION ),
			'Setter should not encode an already encoded value a second time.'
		);
		$this->assertEquals(
			'https://example.com/',
			$connected_proxy_url->get(),
			'Getter should return the plain URL after saving an encoded value.'
		);
	}

	public function test_get__decodes_the_stored_url() {
		$connected_proxy_url = new Connected_Proxy_URL( $this->options );
		$connected_proxy_url->register();

		$connected_proxy_url->set( 'https://example.com' );

		$this->assertEquals( 'https://example.com/', $connected_proxy_url->get(), 'Getter should return the URL in plain text.' );
	}

	public function test_get__returns_a_legacy_plain_text_url() {
		$connected_proxy_url = new Connected_Proxy_URL( $this->options );

		// Store the option in plain text, the way earlier plugin versions saved it.
		$this->update_option( 'https://example.com/' );

		$connected_proxy_url->register();

		$this->assertEquals( 'https://example.com/', $connected_proxy_url->get(), 'Getter should return a legacy plain text value unchanged.' );
	}

	public function test_get__returns_false_when_not_set() {
		$connected_proxy_url = new Connected_Proxy_URL( $this->options );
		$connected_proxy_url->register();

		$this->assertFalse( $connected_proxy_url->get(), 'Getter should return FALSE when no value exists.' );
	}

	public function test_get__returns_a_value_that_fails_to_decode_unchanged() {
		$connected_proxy_url = new Connected_Proxy_URL( $this->options );

		$this->update_option( 'not*a*valid*value' );

		$connected_proxy_url->register();

		$this->assertEquals( 'not*a*valid*value', $connected_proxy_url->get(), 'Getter should leave a value that fails to decode unchanged.' );
	}

	public function test_sanitize_callback__encodes_a_url_saved_directly() {
		$connected_proxy_url = new Connected_Proxy_URL( $this->options );
		$connected_proxy_url->register();

		// Save the option directly, as an update on the options screen would.
		$this->update_option( 'https://example.com' );

		$this->assertEquals(
			base64_encode( 'https://example.com/' ),
			$this->options->get( Connected_Proxy_URL::OPTION ),
			'Sanitize callback should encode a value that update_option saves.'
		);
		$this->assertEquals( 'https://example.com/', $connected_proxy_url->get(), 'Getter should return the plain URL after a direct save.' );
	}

	public function test_matches_url__stored_url_survives_search_and_replace() {
		$connected_proxy_url = new Connected_Proxy_URL( $this->options );
		$connected_proxy_url->register();

		$connected_proxy_url->set( 'https://old-site.example.com' );

		// Simulate a database search and replace of the site URL.
		$stored_connected_url  = $this->options->get( Connected_Proxy_URL::OPTION );
		$search_replace_result = str_replace( 'old-site.example.com', 'new-site.example.com', $stored_connected_url );

		$this->assertSame( $stored_connected_url, $search_replace_result, 'Search and replace should not find the URL inside the encoded value.' );
		$this->assertTrue( $connected_proxy_url->matches_url( 'https://old-site.example.com' ), 'Stored URL should still match the original URL after search and replace.' );
		$this->assertFalse( $connected_proxy_url->matches_url( 'https://new-site.example.com' ), "Stored URL shouldn't match the new URL, so Site Kit detects the change." );
	}

	public function test_matches_url__flags_a_url_change_after_a_database_search_and_replace() {
		remove_all_actions( 'admin_init' );

		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$user_options = new User_Options( $context );

		$authentication = new Authentication( $context, $this->options, $user_options );
		$authentication->register();

		// Connect the site with its current URL.
		$authentication->get_connected_proxy_url_instance()->set( $context->get_canonical_home_url() );

		// Simulate proxy credentials and an OAuth access token.
		$this->fake_proxy_site_connection();
		$authentication->get_oauth_client()->set_token( array( 'access_token' => 'valid-auth-token' ) );

		// Grant the administrator the setup capability regardless of authentication state.
		add_filter(
			'user_has_cap',
			function ( $capabilities ) {
				$capabilities[ Permissions::SETUP ] = true;
				return $capabilities;
			}
		);

		$connected_host       = wp_parse_url( $context->get_canonical_home_url(), PHP_URL_HOST );
		$stored_connected_url = $this->options->get( Connected_Proxy_URL::OPTION );

		// Simulate a database search and replace: it rewrites the home option,
		// and finds no host to rewrite inside the encoded value.
		update_option( 'home', 'https://new-domain.example.com' );

		$this->assertSame(
			$stored_connected_url,
			str_replace( $connected_host, 'new-domain.example.com', $stored_connected_url ),
			'Search and replace should find no host to rewrite inside the stored value.'
		);

		do_action( 'admin_init' );

		$this->assertEquals(
			'connected_url_mismatch',
			$user_options->get( Disconnected_Reason::OPTION ),
			'Site Kit should flag the URL change after a database search and replace.'
		);
	}

	/**
	 * @inheritDoc
	 */
	protected function get_option_name() {
		return Connected_Proxy_URL::OPTION;
	}
}
