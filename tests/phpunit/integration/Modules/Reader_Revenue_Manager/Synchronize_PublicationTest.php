<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager\Synchronize_PublicationTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\Reader_Revenue_Manager;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Synchronize_Publication;
use Google\Site_Kit\Tests\Fake_Site_Connection_Trait;
use Google\Site_Kit\Tests\FakeHttp;
use Google\Site_Kit\Tests\ModulesHelperTrait;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\Google\Service\SubscribewithGoogle\ListPublicationsResponse;
use Google\Site_Kit_Dependencies\Google\Service\SubscribewithGoogle\PaymentOptions;
use Google\Site_Kit_Dependencies\Google\Service\SubscribewithGoogle\Product;
use Google\Site_Kit_Dependencies\Google\Service\SubscribewithGoogle\Publication;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Request;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Response;

/**
 * @group Modules
 * @group Reader_Revenue_Manager
 */
class Synchronize_PublicationTest extends TestCase {

	use Fake_Site_Connection_Trait;
	use ModulesHelperTrait;

	/**
	 * @var Synchronize_Publication
	 */
	protected $synchronize_publication;

	/**
	 * @var Reader_Revenue_Manager
	 */
	protected $reader_revenue_manager;

	/**
	 * @var User_Options
	 */
	protected $user_options;

	/**
	 * @var Options
	 */
	protected $options;

	/**
	 * @var Authentication
	 */
	protected $authentication;

	public function set_up() {
		parent::set_up();
		$user_id = self::factory()->user->create( array( 'role' => 'administrator' ) );

		$context              = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->options        = new Options( $context );
		$this->user_options   = new User_Options( $context, $user_id );
		$this->authentication = new Authentication( $context, $this->options, $this->user_options );

		// Fake a valid authentication token on the client.
		$this->authentication->get_oauth_client()->set_token( array( 'access_token' => 'valid-auth-token' ) );
		$this->authentication->verification()->set( true );

		$this->fake_site_connection();
		add_filter( 'googlesitekit_setup_complete', '__return_true', 100 );

		$this->reader_revenue_manager = new Reader_Revenue_Manager( $context, $this->options, $this->user_options, $this->authentication );
		$this->authentication->get_oauth_client()->set_granted_scopes(
			$this->reader_revenue_manager->get_scopes()
		);
		$this->user_options->switch_user( 0 );
		$this->reader_revenue_manager->get_settings()->register();

		$this->reader_revenue_manager->get_settings()->merge(
			array(
				'publicationID'                     => '123456789',
				'publicationOnboardingState'        => 'ONBOARDING_ACTION_REQUIRED',
				'publicationOnboardingStateChanged' => false,
				'productID'                         => 'openaccess',
				'productIDs'                        => array(),
				'paymentOption'                     => '',
				'ownerID'                           => $user_id,
			),
		);

		$this->synchronize_publication = new Synchronize_Publication( $this->reader_revenue_manager, $this->user_options );
	}

	public function fake_sync_publication() {
		$publication_id = $this->reader_revenue_manager->get_settings()->get()['publicationID'];

		FakeHttp::fake_google_http_handler(
			$this->reader_revenue_manager->get_client(),
			function ( Request $request ) use ( $publication_id ) {
				$url = parse_url( $request->getUri() );

				if ( '/v1/publications' === $url['path'] ) {
					$basic_product = new Product();
					$basic_product->setName( 'testpubID:basic' );

					$advanced_product = new Product();
					$advanced_product->setName( 'testpubID:advanced' );

					$payment_options                = new PaymentOptions();
					$payment_options->subscriptions = true;

					$publication = new Publication();
					$publication->setPublicationId( $publication_id );
					$publication->setOnboardingState( 'ONBOARDING_COMPLETE' );
					$publication->setProducts(
						array(
							$basic_product,
							$advanced_product,
						)
					);
					$publication->setPaymentOptions( $payment_options );

					$response = new ListPublicationsResponse();
					$response->setPublications( array( $publication ) );

					return new Response(
						200,
						array( 'content-type' => 'application/json' ),
						json_encode( $response )
					);
				}

				return new Response( 200 );
			}
		);
	}

	public function test_register() {
		remove_all_actions( Synchronize_Publication::CRON_SYNCHRONIZE_PUBLICATION );
		$this->synchronize_publication->register();

		$this->assertEquals( 10, has_action( Synchronize_Publication::CRON_SYNCHRONIZE_PUBLICATION ) );
	}

	public function test_synchronize_onboarding_state() {
		$this->fake_sync_publication();

		$this->assertTrue( $this->reader_revenue_manager->is_connected() );

		$settings = $this->reader_revenue_manager->get_settings()->get();
		$this->synchronize_publication->register();

		$this->assertEquals(
			'ONBOARDING_ACTION_REQUIRED',
			$settings['publicationOnboardingState']
		);
		$this->assertFalse( $settings['publicationOnboardingStateChanged'] );

		do_action( Synchronize_Publication::CRON_SYNCHRONIZE_PUBLICATION );

		$settings = $this->reader_revenue_manager->get_settings()->get();

		$this->assertEquals(
			'ONBOARDING_COMPLETE',
			$settings['publicationOnboardingState']
		);
		$this->assertTrue( $settings['publicationOnboardingStateChanged'] );
	}

	public function test_synchronize_onboarding_state_with_non_existent_publication() {
		$this->fake_sync_publication();

		$this->assertTrue( $this->reader_revenue_manager->is_connected() );

		$settings = $this->reader_revenue_manager->get_settings()->get();
		$this->synchronize_publication->register();

		$this->assertEquals(
			'ONBOARDING_ACTION_REQUIRED',
			$settings['publicationOnboardingState']
		);
		$this->assertFalse( $settings['publicationOnboardingStateChanged'] );

		$this->reader_revenue_manager->get_settings()->merge(
			array(
				'publicationID' => '987654321',
			),
		);

		do_action( Synchronize_Publication::CRON_SYNCHRONIZE_PUBLICATION );

		$settings = $this->reader_revenue_manager->get_settings()->get();

		$this->assertEquals(
			'ONBOARDING_ACTION_REQUIRED',
			$settings['publicationOnboardingState']
		);
		$this->assertFalse( $settings['publicationOnboardingStateChanged'] );
	}

	public function test_synchronize_product_ids() {
		$this->enable_feature( 'rrmModuleV2' );
		$this->fake_sync_publication();

		$this->assertTrue( $this->reader_revenue_manager->is_connected() );

		$settings = $this->reader_revenue_manager->get_settings()->get();
		$this->synchronize_publication->register();

		$this->assertEmpty( $settings['productIDs'] );

		do_action( Synchronize_Publication::CRON_SYNCHRONIZE_PUBLICATION );

		$settings = $this->reader_revenue_manager->get_settings()->get();
		$this->assertEquals( array( 'basic', 'advanced' ), $settings['productIDs'] );
	}

	public function test_synchronize_product_ids_with_non_existent_publication() {
		$this->enable_feature( 'rrmModuleV2' );
		$this->fake_sync_publication();

		$this->assertTrue( $this->reader_revenue_manager->is_connected() );

		$settings = $this->reader_revenue_manager->get_settings()->get();
		$this->synchronize_publication->register();

		$this->reader_revenue_manager->get_settings()->merge(
			array(
				'publicationID' => '987654321',
			),
		);

		$this->assertEmpty( $settings['productIDs'] );

		do_action( Synchronize_Publication::CRON_SYNCHRONIZE_PUBLICATION );

		$settings = $this->reader_revenue_manager->get_settings()->get();
		$this->assertEmpty( $settings['productIDs'] );
	}

	public function test_synchronize_payment_option() {
		$this->enable_feature( 'rrmModuleV2' );
		$this->fake_sync_publication();

		$this->assertTrue( $this->reader_revenue_manager->is_connected() );

		$settings = $this->reader_revenue_manager->get_settings()->get();
		$this->synchronize_publication->register();

		$this->assertEmpty( $settings['paymentOption'] );

		do_action( Synchronize_Publication::CRON_SYNCHRONIZE_PUBLICATION );

		$settings = $this->reader_revenue_manager->get_settings()->get();
		$this->assertEquals( 'subscriptions', $settings['paymentOption'] );
	}

	public function test_synchronize_payment_option_with_non_existent_publication() {
		$this->enable_feature( 'rrmModuleV2' );
		$this->fake_sync_publication();

		$this->assertTrue( $this->reader_revenue_manager->is_connected() );

		$settings = $this->reader_revenue_manager->get_settings()->get();
		$this->synchronize_publication->register();

		$this->reader_revenue_manager->get_settings()->merge(
			array(
				'publicationID' => '987654321',
			),
		);

		$this->assertEmpty( $settings['paymentOption'] );

		do_action( Synchronize_Publication::CRON_SYNCHRONIZE_PUBLICATION );

		$settings = $this->reader_revenue_manager->get_settings()->get();
		$this->assertEmpty( $settings['paymentOption'] );
	}

	public function test_maybe_schedule_synchronize_publication() {
		$this->assertFalse( wp_next_scheduled( Synchronize_Publication::CRON_SYNCHRONIZE_PUBLICATION ) );
		$this->synchronize_publication->maybe_schedule_synchronize_publication();

		$this->assertTrue(
			(bool) wp_next_scheduled( Synchronize_Publication::CRON_SYNCHRONIZE_PUBLICATION )
		);
	}
}
