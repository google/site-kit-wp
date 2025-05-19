<?php
/**
 * Search_ConsoleTest
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Clients\OAuth_Client;
use Google\Site_Kit\Core\Modules\Module_With_Data_Available_State;
use Google\Site_Kit\Core\Modules\Module_With_Scopes;
use Google\Site_Kit\Core\Modules\Module_With_Settings;
use Google\Site_Kit\Core\Modules\Module_With_Service_Entity;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\Search_Console;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Data_Available_State_ContractTests;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Scopes_ContractTests;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Settings_ContractTests;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Owner_ContractTests;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Service_Entity_ContractTests;
use Google\Site_Kit\Tests\FakeHttp;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\Google\Service\SearchConsole\SitesListResponse;
use Google\Site_Kit_Dependencies\Google\Service\SearchConsole\WmxSite;
use Google\Site_Kit_Dependencies\GuzzleHttp\Promise\FulfilledPromise;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Request;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Response;

/**
 * @group Modules
 */
class Search_ConsoleTest extends TestCase {
	use Module_With_Scopes_ContractTests;
	use Module_With_Settings_ContractTests;
	use Module_With_Owner_ContractTests;
	use Module_With_Service_Entity_ContractTests;
	use Module_With_Data_Available_State_ContractTests;

	public function test_magic_methods() {
		$search_console = new Search_Console( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertEquals( 'search-console', $search_console->slug );
		$this->assertTrue( $search_console->force_active );
		$this->assertEquals( 'https://search.google.com/search-console', $search_console->homepage );
	}

	public function test_register() {
		$search_console = new Search_Console( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$property_url   = 'https://example.com';

		remove_all_filters( 'googlesitekit_auth_scopes' );
		remove_all_filters( 'googlesitekit_setup_complete' );

		$this->assertEmpty( apply_filters( 'googlesitekit_auth_scopes', array() ) );
		$this->assertTrue( apply_filters( 'googlesitekit_setup_complete', true ) );

		// Register search console.
		$search_console->register();

		// Test registers scopes.
		$this->assertEquals(
			$search_console->get_scopes(),
			apply_filters( 'googlesitekit_auth_scopes', array() )
		);

		// Test sitekit setup complete requires property set.
		$this->assertFalse( apply_filters( 'googlesitekit_setup_complete', true ) );
		$options = new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$options->set( 'googlesitekit_search_console_property', $property_url );
		$this->assertTrue( apply_filters( 'googlesitekit_setup_complete', true ) );
	}

	public function test_register__add_googlesitekit_authorize_user_action() {
		$search_console = new Search_Console( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		remove_all_actions( 'googlesitekit_authorize_user' );
		$this->assertFalse( has_action( 'googlesitekit_authorize_user' ) );

		$search_console->register();

		$this->assertTrue( has_action( 'googlesitekit_authorize_user' ) );
	}

	public function test_register__property_id_saved_if_not_set() {
		$search_console = new Search_Console( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		remove_all_actions( 'googlesitekit_authorize_user' );

		$admin = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $admin );

		$search_console->register();

		// Test propertyID is merged if it doesn't exist.
		update_option(
			'googlesitekit_search-console_settings',
			array(
				'propertyID' => '',
				'ownerID'    => '',
			)
		);

		$test_token_response['search_console_property'] = 'https://example.com';
		do_action( 'googlesitekit_authorize_user', $test_token_response );

		$this->assertEqualSets(
			array(
				'propertyID' => 'https://example.com',
				'ownerID'    => '',
			),
			get_option( 'googlesitekit_search-console_settings' )
		);
	}

	public function test_register__property_id_saved_if_current_owner() {
		$search_console = new Search_Console( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		remove_all_actions( 'googlesitekit_authorize_user' );

		$admin = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $admin );

		$search_console->register();

		// Test propertyID is merged if the authorised user is also the owner of Search Console.
		update_option(
			'googlesitekit_search-console_settings',
			array(
				'propertyID' => 'https://example.com',
				'ownerID'    => $admin,
			)
		);

		$test_token_response['search_console_property'] = 'https://example.org';
		do_action( 'googlesitekit_authorize_user', $test_token_response );

		$this->assertEqualSets(
			array(
				'propertyID' => 'https://example.org',
				'ownerID'    => $admin,
			),
			get_option( 'googlesitekit_search-console_settings' )
		);
	}

	public function test_register__property_id_not_updated() {
		$search_console = new Search_Console( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		remove_all_actions( 'googlesitekit_authorize_user' );

		$admin = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $admin );

		$search_console->register();

		// Test propertyID is not merged if the authorised user (another admin)
		// is not the owner of Search Console.
		update_option(
			'googlesitekit_search-console_settings',
			array(
				'propertyID' => 'https://example.com',
				'ownerID'    => $admin + 10, // Make sure $admin is never the owner.
			)
		);

		$test_token_response['search_console_property'] = 'https://example.org';
		do_action( 'googlesitekit_authorize_user', $test_token_response );

		$this->assertEqualSets(
			array(
				'propertyID' => 'https://example.com',
				'ownerID'    => $admin + 10,
			),
			get_option( 'googlesitekit_search-console_settings' )
		);
	}

	public function test_get_datapoints() {
		$search_console = new Search_Console( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertEqualSets(
			array(
				'site',
				'sites',
				'matched-sites',
				'searchanalytics',
			),
			$search_console->get_datapoints()
		);
	}

	public function test_get_data_matched_sites() {
		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );
		$oauth_client = new OAuth_Client( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$oauth_client->set_granted_scopes(
			$oauth_client->get_required_scopes()
		);
		$search_console = new Search_Console( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		// Prepare 2 matching sites to be returned to ensure sorting works as expected.
		// The domain can have www or not, or have a different scheme by default and still be considered a match.
		$site_root = new WmxSite();
		$site_root->setPermissionLevel( 'siteOwner' );
		$site_root->setSiteUrl( home_url() );

		$site_www = new WmxSite();
		$site_www->setPermissionLevel( 'siteOwner' );
		$site_www->setSiteUrl( str_replace( '//', '//www.', home_url() ) );
		// Root should be returned first as they are ordered by URL.
		$sites = array( $site_www, $site_root );

		FakeHttp::fake_google_http_handler(
			$search_console->get_client(),
			function ( Request $request ) use ( $sites ) {
				if ( $request->getUri()->getHost() !== 'searchconsole.googleapis.com' ) {
					return new FulfilledPromise( new Response( 200 ) );
				}

				$sites_response = new SitesListResponse();
				$sites_response->setSiteEntry( $sites );

				return new FulfilledPromise(
					new Response(
						200,
						array(),
						json_encode( $sites_response )
					)
				);
			}
		);

		$data = $search_console->get_data( 'matched-sites' );

		$this->assertNotWPError( $data );
		$this->assertCount( 2, $data );
		$this->assertEquals( $site_root->getSiteUrl(), $data[0]['siteURL'] );
		$this->assertEquals( $site_www->getSiteUrl(), $data[1]['siteURL'] );
	}

	public function test_get_module_scopes() {
		$search_console = new Search_Console( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertEqualSets(
			array(
				'https://www.googleapis.com/auth/webmasters',
			),
			$search_console->get_scopes()
		);
	}

	public function test_data_available_reset_on_property_change() {
		$search_console = new Search_Console( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$search_console->register();
		$search_console->get_settings()->merge(
			array(
				'propertyID' => 'https://example.com',
			)
		);
		$search_console->set_data_available();
		$search_console->get_settings()->merge(
			array(
				'propertyID' => 'https://example.org',
			)
		);

		$this->assertFalse( $search_console->is_data_available() );
	}

	/**
	 * @return Module_With_Scopes
	 */
	protected function get_module_with_scopes() {
		return new Search_Console( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	}

	/**
	 * @return Module_With_Settings
	 */
	protected function get_module_with_settings() {
		return new Search_Console( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	}

	/**
	 * @return Module_With_Owner
	 */
	protected function get_module_with_owner() {
		return new Search_Console( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	}

	/**
	 * @return Module_With_Service_Entity
	 */
	protected function get_module_with_service_entity() {
		return new Search_Console( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	}

	/**
	 * @return Module_With_Data_Available_State
	 */
	protected function get_module_with_data_available_state() {
		return new Search_Console( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	}
}
