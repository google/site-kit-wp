<?php
/**
 * Analytics_4Test
 *
 * @package   Google\Site_Kit\Tests\Modules
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules;

use Closure;
use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Dismissals\Dismissed_Items;
use Google\Site_Kit\Core\Modules\Module;
use Google\Site_Kit\Core\Modules\Module_Sharing_Settings;
use Google\Site_Kit\Core\Modules\Module_With_Data_Available_State;
use Google\Site_Kit\Core\Modules\Module_With_Owner;
use Google\Site_Kit\Core\Modules\Module_With_Scopes;
use Google\Site_Kit\Core\Modules\Module_With_Settings;
use Google\Site_Kit\Core\Modules\Module_With_Service_Entity;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\Transients;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Tags\GTag;
use Google\Site_Kit\Modules\AdSense;
use Google\Site_Kit\Modules\AdSense\Settings as AdSense_Settings;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Analytics_4\Custom_Dimensions_Data_Available;
use Google\Site_Kit\Modules\Analytics_4\GoogleAnalyticsAdmin\EnhancedMeasurementSettingsModel;
use Google\Site_Kit\Modules\Analytics_4\Resource_Data_Availability_Date;
use Google\Site_Kit\Modules\Analytics_4\Settings;
use Google\Site_Kit\Modules\Analytics_4\Synchronize_AdSenseLinked;
use Google\Site_Kit\Modules\Analytics_4\Synchronize_Property;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Data_Available_State_ContractTests;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Owner_ContractTests;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Scopes_ContractTests;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Service_Entity_ContractTests;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Settings_ContractTests;
use Google\Site_Kit\Tests\Exception\RedirectException;
use Google\Site_Kit\Tests\FakeHttp;
use Google\Site_Kit\Tests\ModulesHelperTrait;
use Google\Site_Kit\Tests\MutableInput;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit\Tests\UserAuthenticationTrait;
use Google\Site_Kit_Dependencies\Google\Service\Exception;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1alphaEnhancedMeasurementSettings;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1alphaListAudiencesResponse;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaConversionEvent;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaCustomDimension;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaDataStream;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaDataStreamWebStreamData;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaListConversionEventsResponse;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaListCustomDimensionsResponse;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaProvisionAccountTicketResponse;
use Google\Site_Kit_Dependencies\Google\Service\TagManager\Container;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Request;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Response;
use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1betaProperty;
use Google_Service_GoogleAnalyticsAdmin_GoogleAnalyticsAdminV1alphaAdSenseLink;
use Google_Service_GoogleAnalyticsAdmin_GoogleAnalyticsAdminV1alphaListAdSenseLinksResponse;
use WP_Query;
use WP_User;
use ReflectionMethod;

/**
 * @group Modules
 */
class Analytics_4Test extends TestCase {

	use Module_With_Data_Available_State_ContractTests;
	use Module_With_Owner_ContractTests;
	use Module_With_Scopes_ContractTests;
	use Module_With_Service_Entity_ContractTests;
	use Module_With_Settings_ContractTests;
	use ModulesHelperTrait;
	use UserAuthenticationTrait;

	/**
	 * Context object.
	 *
	 * @var Context
	 */
	private $context;

	/**
	 * Options object.
	 *
	 * @var Options
	 */
	private $options;

	/**
	 * User object.
	 *
	 * @var WP_User
	 */
	private $user;

	/**
	 * User Options object.
	 *
	 * @var User_Options
	 */
	private $user_options;

	/**
	 * Authentication object.
	 *
	 * @var Authentication
	 */
	private $authentication;

	/**
	 * Analytics 4 object.
	 *
	 * @var Analytics_4
	 */
	private $analytics;

	/**
	 * Fake HTTP request handler calls.
	 *
	 * @var array
	 */
	private $request_handler_calls;

	public function set_up() {
		parent::set_up();
		$this->request_handler_calls = array();

		$this->context        = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->options        = new Options( $this->context );
		$this->user           = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		$this->user_options   = new User_Options( $this->context, $this->user->ID );
		$this->authentication = new Authentication( $this->context, $this->options, $this->user_options );
		$this->analytics      = new Analytics_4( $this->context, $this->options, $this->user_options, $this->authentication );
		wp_set_current_user( $this->user->ID );
		remove_all_actions( 'wp_enqueue_scripts' );
		( new GTag( $this->options ) )->register();
	}

	public function test_register() {
		remove_all_filters( 'googlesitekit_auth_scopes' );
		remove_all_actions( 'wp_head' );
		remove_all_actions( 'web_stories_story_head' );

		$this->analytics->register();

		// Adding required scopes.
		$this->assertEquals(
			array_merge(
				$this->analytics->get_scopes(),
				array( 'https://www.googleapis.com/auth/tagmanager.readonly' )
			),
			apply_filters( 'googlesitekit_auth_scopes', array() )
		);

		// Test actions for tracking opt-out are added.
		$this->assertTrue( has_action( 'wp_head' ) );
		$this->assertTrue( has_action( 'web_stories_story_head' ) );
	}

	public function test_register__reset_adsense_link_settings() {
		$this->analytics->get_settings()->merge(
			array(
				'propertyID'                => '12345678',
				'adSenseLinked'             => true,
				'adSenseLinkedLastSyncedAt' => 1705938374500,
			)
		);

		$this->analytics->register();

		$this->analytics->get_settings()->merge(
			array(
				'propertyID' => '87654321',
			)
		);

		$settings = $this->analytics->get_settings()->get();

		$this->assertFalse( $settings['adSenseLinked'] );
		$this->assertEquals( $settings['adSenseLinkedLastSyncedAt'], 0 );
	}

	public function test_register__reset_ads_link_settings() {
		$this->analytics->get_settings()->merge(
			array(
				'propertyID'            => '12345678',
				'adsLinked'             => true,
				'adsLinkedLastSyncedAt' => 1705938374500,
			)
		);

		$this->analytics->register();

		$this->analytics->get_settings()->merge(
			array(
				'propertyID' => '87654321',
			)
		);

		$settings = $this->analytics->get_settings()->get();

		$this->assertFalse( $settings['adsLinked'] );
		$this->assertEquals( $settings['adsLinkedLastSyncedAt'], 0 );
	}

	public function test_register__reset_resource_data_availability_date__on_property_id_change() {

		list(
			,
			,
			,
			$test_resource_data_availability_transient_audience,
			$test_resource_data_availability_transient_custom_dimension,
			$test_resource_data_availability_transient_property,
		) = $this->set_test_resource_data_availability_dates();

		$this->assertNotFalse( get_transient( $test_resource_data_availability_transient_audience ) );
		$this->assertNotFalse( get_transient( $test_resource_data_availability_transient_custom_dimension ) );
		$this->assertNotFalse( get_transient( $test_resource_data_availability_transient_property ) );

		$this->analytics->get_settings()->merge(
			array(
				'propertyID' => '87654321',
			)
		);

		$this->assertFalse( get_transient( $test_resource_data_availability_transient_audience ) );
		$this->assertFalse( get_transient( $test_resource_data_availability_transient_custom_dimension ) );
		$this->assertFalse( get_transient( $test_resource_data_availability_transient_property ) );
	}

	public function test_register__reset_resource_data_availability_date__on_measurement_id_change() {

		list(
			,
			,
			,
			$test_resource_data_availability_transient_audience,
			$test_resource_data_availability_transient_custom_dimension,
			$test_resource_data_availability_transient_property,
		) = $this->set_test_resource_data_availability_dates();

		$this->assertNotFalse( get_transient( $test_resource_data_availability_transient_audience ) );
		$this->assertNotFalse( get_transient( $test_resource_data_availability_transient_custom_dimension ) );
		$this->assertNotFalse( get_transient( $test_resource_data_availability_transient_property ) );

		$this->analytics->get_settings()->merge(
			array(
				'measurementID' => 'B1B2C3D4E5',
			)
		);

		$this->assertFalse( get_transient( $test_resource_data_availability_transient_audience ) );
		$this->assertFalse( get_transient( $test_resource_data_availability_transient_custom_dimension ) );
		$this->assertFalse( get_transient( $test_resource_data_availability_transient_property ) );
	}

	public function test_register__reset_resource_data_availability_date__on_available_audiences_change() {

		list(
			$test_resource_slug_audience,
			,
			,
			$test_resource_data_availability_transient_audience,
			$test_resource_data_availability_transient_custom_dimension,
			$test_resource_data_availability_transient_property,
		) = $this->set_test_resource_data_availability_dates();

		$this->assertNotFalse( get_transient( $test_resource_data_availability_transient_audience ) );
		$this->assertNotFalse( get_transient( $test_resource_data_availability_transient_custom_dimension ) );
		$this->assertNotFalse( get_transient( $test_resource_data_availability_transient_property ) );

		// Should not reset audience when it is available.
		$this->analytics->get_settings()->merge(
			array(
				'availableAudiences' => array(
					array(
						'name' => $test_resource_slug_audience,
					),
					array(
						'name' => 'properties/12345678/audiences/67890',
					),
				),
			)
		);

		$this->assertNotFalse( get_transient( $test_resource_data_availability_transient_audience ) );

		// Should reset audience when it is no longer available.
		$this->analytics->get_settings()->merge(
			array(
				'availableAudiences' => array(
					array(
						'name' => 'properties/12345678/audiences/67890',
					),
				),
			)
		);

		$this->assertFalse( get_transient( $test_resource_data_availability_transient_audience ) );

		// Should not reset other resources.
		$this->assertNotFalse( get_transient( $test_resource_data_availability_transient_custom_dimension ) );
		$this->assertNotFalse( get_transient( $test_resource_data_availability_transient_property ) );
	}

	public function test_register__reset_resource_data_availability_date__on_deactivation() {

		list(
			,
			,
			,
			$test_resource_data_availability_transient_audience,
			$test_resource_data_availability_transient_custom_dimension,
			$test_resource_data_availability_transient_property,
		) = $this->set_test_resource_data_availability_dates();

		$this->assertNotFalse( get_transient( $test_resource_data_availability_transient_audience ) );
		$this->assertNotFalse( get_transient( $test_resource_data_availability_transient_custom_dimension ) );
		$this->assertNotFalse( get_transient( $test_resource_data_availability_transient_property ) );

		$this->analytics->on_deactivation();

		$this->assertFalse( get_transient( $test_resource_data_availability_transient_audience ) );
		$this->assertFalse( get_transient( $test_resource_data_availability_transient_custom_dimension ) );
		$this->assertFalse( get_transient( $test_resource_data_availability_transient_property ) );
	}

	public function test_register__if_analytics_is_active_sync_adsense_link_settings() {
		remove_all_actions( Synchronize_AdSenseLinked::CRON_SYNCHRONIZE_ADSENSE_LINKED );

		$this->force_connect_modules( AdSense::MODULE_SLUG );

		$this->analytics->register();

		// Set the needed option values so checks can pass.
		$this->analytics->get_settings()->merge(
			array(
				'propertyID' => '123456',
			)
		);

		$this->assertEquals(
			did_action( Synchronize_AdSenseLinked::CRON_SYNCHRONIZE_ADSENSE_LINKED ),
			1
		);
	}

	public function test_handle_provisioning_callback() {
		$context   = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE, new MutableInput() );
		$analytics = new Analytics_4( $context );

		$admin_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $admin_id );
		// Ensure admin user has Permissions::MANAGE_OPTIONS cap regardless of authentication.
		add_filter(
			'map_meta_cap',
			function ( $caps, $cap ) {
				if ( Permissions::MANAGE_OPTIONS === $cap ) {
					return array( 'manage_options' );
				}
				return $caps;
			},
			99,
			2
		);

		$dashboard_url               = $context->admin_url();
		$account_ticked_id_transient = Analytics_4::PROVISION_ACCOUNT_TICKET_ID . '::' . get_current_user_id();

		$_GET['gatoscallback']   = '1';
		$_GET['accountTicketId'] = '123456';

		$class  = new \ReflectionClass( Analytics_4::class );
		$method = $class->getMethod( 'handle_provisioning_callback' );
		$method->setAccessible( true );

		// Results in an error for a mismatch (or no account ticket ID stored from before at all).
		try {
			$method->invokeArgs( $analytics, array() );
			$this->fail( 'Expected redirect to module page with "account_ticket_id_mismatch" error' );
		} catch ( RedirectException $redirect ) {
			$this->assertEquals(
				add_query_arg( 'error_code', 'account_ticket_id_mismatch', $dashboard_url ),
				$redirect->get_location()
			);
		}

		// Results in an error when there is an error parameter.
		set_transient( $account_ticked_id_transient, $_GET['accountTicketId'] );
		$_GET['error'] = 'user_cancel';
		try {
			$method->invokeArgs( $analytics, array() );
			$this->fail( 'Expected redirect to module page with "user_cancel" error' );
		} catch ( RedirectException $redirect ) {
			$this->assertEquals(
				add_query_arg( 'error_code', 'user_cancel', $dashboard_url ),
				$redirect->get_location()
			);
			// Ensure transient was deleted by the method despite error.
			$this->assertFalse( get_transient( $account_ticked_id_transient ) );
		}
		unset( $_GET['error'] );

		// Intercept Google API requests to avoid failures.
		FakeHttp::fake_google_http_handler(
			$analytics->get_client()
		);

		// Results in an dashboard redirect on success, with new data being stored.
		set_transient( $account_ticked_id_transient, $_GET['accountTicketId'] );
		$_GET['accountId'] = '12345678';

		try {
			$method->invokeArgs( $analytics, array() );
			$this->fail( 'Expected redirect to module page with "authentication_success" notification' );
		} catch ( RedirectException $redirect ) {
			$this->assertEquals(
				add_query_arg(
					array(
						'page'         => 'googlesitekit-dashboard',
						'notification' => 'authentication_success',
						'slug'         => 'analytics-4',
					),
					admin_url( 'admin.php' )
				),
				$redirect->get_location()
			);

			// Ensure transient was deleted by the method.
			$this->assertFalse( get_transient( $account_ticked_id_transient ) );
			// Ensure settings were set correctly.
			$settings = $analytics->get_settings()->get();

			$this->assertEquals( $_GET['accountId'], $settings['accountID'] );
			$this->assertEquals( $admin_id, $settings['ownerID'] );
		}
	}

	public function test_provision_property_webdatastream() {
		$account_id              = '12345678';
		$property_id             = '1001';
		$webdatastream_id        = '2001';
		$measurement_id          = 'G-1A2BCD345E';
		$google_tag_account_id   = '123';
		$google_tag_container_id = '456';
		$tag_ids                 = array( 'GT-123', 'G-456' );

		$options = new Options( $this->context );
		$options->set(
			Settings::OPTION,
			array(
				'accountID'       => $account_id,
				'propertyID'      => '',
				'webDataStreamID' => '',
				'measurementID'   => '',
			)
		);

		FakeHttp::fake_google_http_handler(
			$this->analytics->get_client(),
			function ( Request $request ) use ( $property_id, $webdatastream_id, $measurement_id, $google_tag_account_id, $google_tag_container_id, $tag_ids ) {
				$url = parse_url( $request->getUri() );

				if ( ! in_array( $url['host'], array( 'analyticsadmin.googleapis.com', 'tagmanager.googleapis.com' ), true ) ) {
					return new Response( 200 );
				}

				switch ( $url['path'] ) {
					case '/v1beta/properties':
						return new Response(
							200,
							array(),
							json_encode(
								array(
									'name' => "properties/{$property_id}",
								)
							)
						);
					case "/v1beta/properties/{$property_id}/dataStreams":
						$data = new GoogleAnalyticsAdminV1betaDataStreamWebStreamData();
						$data->setMeasurementId( $measurement_id );
						$datastream = new GoogleAnalyticsAdminV1betaDataStream();
						$datastream->setName( "properties/{$property_id}/dataStreams/{$webdatastream_id}" );
						$datastream->setType( 'WEB_DATA_STREAM' );
						$datastream->setWebStreamData( $data );

						return new Response(
							200,
							array(),
							json_encode( $datastream->toSimpleObject() )
						);
					case '/tagmanager/v2/accounts/containers:lookup':
						$data = new Container();
						$data->setAccountId( $google_tag_account_id );
						$data->setContainerId( $google_tag_container_id );
						$data->setTagIds( $tag_ids );
						return new Response(
							200,
							array(),
							json_encode(
								$data->toSimpleObject()
							)
						);

					default:
						return new Response( 200 );
				}
			}
		);

		$this->analytics->register();
		$this->authentication->get_oauth_client()->set_granted_scopes(
			$this->authentication->get_oauth_client()->get_required_scopes()
		);

		$this->assertEqualSetsWithIndex(
			array(
				'accountID'                            => $account_id,
				'propertyID'                           => '',
				'webDataStreamID'                      => '',
				'measurementID'                        => '',
				'ownerID'                              => 0,
				'adsConversionID'                      => '',
				'trackingDisabled'                     => array( 'loggedinUsers' ),
				'useSnippet'                           => true,
				'googleTagID'                          => '',
				'googleTagAccountID'                   => '',
				'googleTagContainerID'                 => '',
				'googleTagContainerDestinationIDs'     => null,
				'googleTagLastSyncedAtMs'              => 0,
				'availableCustomDimensions'            => null,
				'propertyCreateTime'                   => 0,
				'adSenseLinked'                        => false,
				'adSenseLinkedLastSyncedAt'            => 0,
				'adsConversionIDMigratedAtMs'          => 0,
				'adsLinked'                            => false,
				'adsLinkedLastSyncedAt'                => 0,
				'availableAudiences'                   => null,
				'availableAudiencesLastSyncedAt'       => 0,
				'audienceSegmentationSetupCompletedBy' => null,
				'detectedEvents'                       => array(),
				'lostConversionEventsLastUpdateAt'     => 0,
				'newConversionEventsLastUpdateAt'      => 0,
			),
			$options->get( Settings::OPTION )
		);

		$method = new ReflectionMethod( Analytics_4::class, 'provision_property_webdatastream' );
		$method->setAccessible( true );
		$method->invoke( $this->analytics, $account_id, new Analytics_4\Account_Ticket() );

		$this->assertEqualSetsWithIndex(
			array(
				'accountID'                            => $account_id,
				'propertyID'                           => $property_id,
				'webDataStreamID'                      => $webdatastream_id,
				'measurementID'                        => $measurement_id,
				'ownerID'                              => 0,
				'adsConversionID'                      => '',
				'trackingDisabled'                     => array( 'loggedinUsers' ),
				'useSnippet'                           => true,
				'googleTagID'                          => 'GT-123',
				'googleTagAccountID'                   => $google_tag_account_id,
				'googleTagContainerID'                 => $google_tag_container_id,
				'googleTagContainerDestinationIDs'     => null,
				'googleTagLastSyncedAtMs'              => 0,
				'availableCustomDimensions'            => null,
				'propertyCreateTime'                   => 0,
				'adSenseLinked'                        => false,
				'adSenseLinkedLastSyncedAt'            => 0,
				'adsConversionIDMigratedAtMs'          => 0,
				'adsLinked'                            => false,
				'adsLinkedLastSyncedAt'                => 0,
				'availableAudiences'                   => null,
				'availableAudiencesLastSyncedAt'       => 0,
				'audienceSegmentationSetupCompletedBy' => false,
				'detectedEvents'                       => array(),
				'lostConversionEventsLastUpdateAt'     => 0,
				'newConversionEventsLastUpdateAt'      => 0,
			),
			$options->get( Settings::OPTION )
		);
	}

	public function test_provision_property_webdatastream__with_failing_container_lookup() {
		$account_id       = '12345678';
		$property_id      = '1001';
		$webdatastream_id = '2001';
		$measurement_id   = 'G-1A2BCD345E';

		$options = new Options( $this->context );
		$options->set(
			Settings::OPTION,
			array(
				'accountID'       => $account_id,
				'propertyID'      => '',
				'webDataStreamID' => '',
				'measurementID'   => '',
			)
		);

		FakeHttp::fake_google_http_handler(
			$this->analytics->get_client(),
			function ( Request $request ) use ( $property_id, $webdatastream_id, $measurement_id ) {
				$url = parse_url( $request->getUri() );

				if ( ! in_array( $url['host'], array( 'analyticsadmin.googleapis.com', 'tagmanager.googleapis.com' ), true ) ) {
					return new Response( 200 );
				}

				switch ( $url['path'] ) {
					case '/v1beta/properties':
						return new Response(
							200,
							array(),
							json_encode(
								array(
									'name' => "properties/{$property_id}",
								)
							)
						);
					case "/v1beta/properties/{$property_id}/dataStreams":
						$data = new GoogleAnalyticsAdminV1betaDataStreamWebStreamData();
						$data->setMeasurementId( $measurement_id );
						$datastream = new GoogleAnalyticsAdminV1betaDataStream();
						$datastream->setName( "properties/{$property_id}/dataStreams/{$webdatastream_id}" );
						$datastream->setType( 'WEB_DATA_STREAM' );
						$datastream->setWebStreamData( $data );

						return new Response(
							200,
							array(),
							json_encode( $datastream->toSimpleObject() )
						);
					case '/tagmanager/v2/accounts/containers:lookup':
						return new Response(
							403,
							array(),
							json_encode(
								array(
									'error' => array(
										'code'    => 403,
										'message' => 'Request had insufficient authentication scopes.',
										'errors'  => array(
											array(
												'message' => 'Insufficient Permission',
												'domain'  => 'global',
												'reason'  => 'insufficientPermissions',
											),
										),
										'status'  => 'PERMISSION_DENIED',
										'details' => array(
											array(
												'@type'    => 'type.googleapis.com/google.rpc.ErrorInfo',
												'reason'   => 'ACCESS_TOKEN_SCOPE_INSUFFICIENT',
												'domain'   => 'googleapis.com',
												'metadata' => array(
													'method'  => 'container_tag.apiary_v2.TagManagerServiceV2.LookupContainer',
													'service' => 'tagmanager.googleapis.com',
												),
											),
										),
									),
								)
							)
						);

					default:
						return new Response( 200 );
				}
			}
		);

		$this->analytics->register();
		// Here we're providing all the required scopes which is necessary to make sure
		// the Google API request is made now, for the purpose of testing an error.
		$this->authentication->get_oauth_client()->set_granted_scopes(
			$this->authentication->get_oauth_client()->get_required_scopes()
		);

		$this->assertEqualSetsWithIndex(
			array(
				'accountID'                            => $account_id,
				'propertyID'                           => '',
				'webDataStreamID'                      => '',
				'measurementID'                        => '',
				'ownerID'                              => 0,
				'adsConversionID'                      => '',
				'trackingDisabled'                     => array( 'loggedinUsers' ),
				'useSnippet'                           => true,
				'googleTagID'                          => '',
				'googleTagAccountID'                   => '',
				'googleTagContainerID'                 => '',
				'googleTagContainerDestinationIDs'     => null,
				'googleTagLastSyncedAtMs'              => 0,
				'availableCustomDimensions'            => null,
				'propertyCreateTime'                   => 0,
				'adSenseLinked'                        => false,
				'adSenseLinkedLastSyncedAt'            => 0,
				'adsConversionIDMigratedAtMs'          => 0,
				'adsLinked'                            => false,
				'adsLinkedLastSyncedAt'                => 0,
				'availableAudiences'                   => null,
				'availableAudiencesLastSyncedAt'       => 0,
				'audienceSegmentationSetupCompletedBy' => null,
				'detectedEvents'                       => array(),
				'lostConversionEventsLastUpdateAt'     => 0,
				'newConversionEventsLastUpdateAt'      => 0,
			),
			$options->get( Settings::OPTION )
		);

		$method = new ReflectionMethod( Analytics_4::class, 'provision_property_webdatastream' );
		$method->setAccessible( true );
		$method->invoke( $this->analytics, $account_id, new Analytics_4\Account_Ticket() );

		$this->assertArrayIntersection(
			array(
				'googleTagID'             => '',
				'googleTagAccountID'      => '',
				'googleTagContainerID'    => '',
				'googleTagLastSyncedAtMs' => 0,
			),
			$options->get( Settings::OPTION )
		);
	}

	public function test_provision_property_webdatastream__with_enhancedMeasurement_streamEnabled() {
		$account_id       = '12345678';
		$property_id      = '1001';
		$webdatastream_id = '2001';
		$measurement_id   = 'G-1A2BCD345E';

		$options = new Options( $this->context );
		$options->set(
			Settings::OPTION,
			array(
				'accountID'       => $account_id,
				'propertyID'      => '',
				'webDataStreamID' => '',
				'measurementID'   => '',
			)
		);

		// TODO: Rework this giant handler into one composed of per-request handlers.
		FakeHttp::fake_google_http_handler(
			$this->analytics->get_client(),
			function ( Request $request ) use ( $property_id, $webdatastream_id, $measurement_id ) {
				$url    = parse_url( $request->getUri() );
				$params = json_decode( (string) $request->getBody(), true );

				$this->request_handler_calls[] = array(
					'url'    => $url,
					'params' => $params,
				);

				if ( 'analyticsadmin.googleapis.com' !== $url['host'] ) {
					return new Response( 403 ); // Includes container lookup
				}

				switch ( $url['path'] ) {
					case '/v1beta/properties':
						$property = new GoogleAnalyticsAdminV1betaProperty();
						$property->setCreateTime( '2022-09-09T09:18:05.968Z' );
						$property->setName( "properties/{$property_id}" );

						return new Response(
							200,
							array(),
							json_encode(
								$property
							)
						);
					case "/v1beta/properties/{$property_id}/dataStreams":
						$data = new GoogleAnalyticsAdminV1betaDataStreamWebStreamData();
						$data->setMeasurementId( $measurement_id );
						$datastream = new GoogleAnalyticsAdminV1betaDataStream();
						$datastream->setName( "properties/{$property_id}/dataStreams/{$webdatastream_id}" );
						$datastream->setType( 'WEB_DATA_STREAM' );
						$datastream->setWebStreamData( $data );

						return new Response(
							200,
							array(),
							json_encode( $datastream->toSimpleObject() )
						);
					case "/v1alpha/properties/{$property_id}/dataStreams/$webdatastream_id/enhancedMeasurementSettings":
						$body = json_decode( $request->getBody(), true );
						$data = new GoogleAnalyticsAdminV1alphaEnhancedMeasurementSettings( $body );

						return new Response(
							200,
							array(),
							json_encode( $data->toSimpleObject() )
						);

					default:
						return new Response( 200 );
				}
			}
		);

		$this->analytics->register();
		$this->authentication->get_oauth_client()->set_granted_scopes(
			array_merge(
				$this->authentication->get_oauth_client()->get_required_scopes(),
				array( Analytics_4::EDIT_SCOPE )
			)
		);

		$this->assertEqualSetsWithIndex(
			array(
				'accountID'                            => $account_id,
				'propertyID'                           => '',
				'webDataStreamID'                      => '',
				'measurementID'                        => '',
				'ownerID'                              => 0,
				'adsConversionID'                      => '',
				'trackingDisabled'                     => array( 'loggedinUsers' ),
				'useSnippet'                           => true,
				'googleTagID'                          => '',
				'googleTagAccountID'                   => '',
				'googleTagContainerID'                 => '',
				'googleTagContainerDestinationIDs'     => null,
				'googleTagLastSyncedAtMs'              => 0,
				'availableCustomDimensions'            => null,
				'propertyCreateTime'                   => 0,
				'adSenseLinked'                        => false,
				'adSenseLinkedLastSyncedAt'            => 0,
				'adsConversionIDMigratedAtMs'          => 0,
				'adsLinked'                            => false,
				'adsLinkedLastSyncedAt'                => 0,
				'availableAudiences'                   => null,
				'availableAudiencesLastSyncedAt'       => 0,
				'audienceSegmentationSetupCompletedBy' => null,
				'detectedEvents'                       => array(),
				'lostConversionEventsLastUpdateAt'     => 0,
				'newConversionEventsLastUpdateAt'      => 0,
			),
			$options->get( Settings::OPTION )
		);

		$account_ticket = new Analytics_4\Account_Ticket();
		$account_ticket->set_enhanced_measurement_stream_enabled( true );

		$method = new ReflectionMethod( Analytics_4::class, 'provision_property_webdatastream' );
		$method->setAccessible( true );
		$method->invoke( $this->analytics, $account_id, $account_ticket );

		$this->assertEqualSetsWithIndex(
			array(
				'accountID'                            => $account_id,
				'propertyID'                           => $property_id,
				'webDataStreamID'                      => $webdatastream_id,
				'measurementID'                        => $measurement_id,
				'ownerID'                              => 0,
				'adsConversionID'                      => '',
				'trackingDisabled'                     => array( 'loggedinUsers' ),
				'useSnippet'                           => true,
				'googleTagID'                          => '',
				'googleTagAccountID'                   => '',
				'googleTagContainerID'                 => '',
				'googleTagContainerDestinationIDs'     => null,
				'googleTagLastSyncedAtMs'              => 0,
				'availableCustomDimensions'            => null,
				'propertyCreateTime'                   => Synchronize_Property::convert_time_to_unix_ms( '2022-09-09T09:18:05.968Z' ),
				'adSenseLinked'                        => false,
				'adSenseLinkedLastSyncedAt'            => 0,
				'adsConversionIDMigratedAtMs'          => 0,
				'adsLinked'                            => false,
				'adsLinkedLastSyncedAt'                => 0,
				'availableAudiences'                   => null,
				'availableAudiencesLastSyncedAt'       => 0,
				'audienceSegmentationSetupCompletedBy' => false,
				'detectedEvents'                       => array(),
				'lostConversionEventsLastUpdateAt'     => 0,
				'newConversionEventsLastUpdateAt'      => 0,
			),
			$options->get( Settings::OPTION )
		);

		// Reduce the handler calls to only those for enhanced measurement settings.
		$enhanced_measurement_settings_requests = array_filter(
			$this->request_handler_calls,
			function ( $call ) {
				return false !== strpos( $call['url']['path'], 'enhancedMeasurementSettings' );
			}
		);

		// Ensure the enhanced measurement settings request was made.
		$this->assertCount( 1, $enhanced_measurement_settings_requests );
		list( $request ) = array_values( $enhanced_measurement_settings_requests );
		$this->assertArrayIntersection(
			array( 'streamEnabled' => true ),
			$request['params']
		);
	}

	public function data_create_account_ticket_required_parameters() {
		return array(
			'displayName'    => array( 'displayName' ),
			'regionCode'     => array( 'regionCode' ),
			'propertyName'   => array( 'propertyName' ),
			'dataStreamName' => array( 'dataStreamName' ),
			'timezone'       => array( 'timezone' ),
		);
	}

	/**
	 * @dataProvider data_create_account_ticket_required_parameters
	 */
	public function test_create_account_ticket__required_parameters( $required_param ) {
		$provision_account_ticket_request = null;
		FakeHttp::fake_google_http_handler(
			$this->analytics->get_client(),
			function ( Request $request ) use ( &$provision_account_ticket_request ) {
				$url = parse_url( $request->getUri() );

				if (
					'sitekit.withgoogle.com' === $url['host']
					&& '/v1beta/accounts:provisionAccountTicket' === $url['path']
				) {
					$provision_account_ticket_request = $request;
				}

				return new Response( 200 );
			}
		);

		$this->analytics->register();
		// Grant required scopes.
		$this->grant_scope( Analytics_4::EDIT_SCOPE );

		$data = array(
			'displayName'    => 'test account name',
			'regionCode'     => 'US',
			'propertyName'   => 'test property name',
			'dataStreamName' => 'test stream name',
			'timezone'       => 'UTC',
		);
		// Remove the required parameter under test.
		unset( $data[ $required_param ] );

		$response = $this->analytics->set_data( 'create-account-ticket', $data );

		$this->assertWPError( $response );
		$this->assertEquals( 'missing_required_param', $response->get_error_code() );
		$this->assertEquals( "Request parameter is empty: $required_param.", $response->get_error_message() );
		// Ensure transient is not set in the event of a failure.
		$this->assertFalse( get_transient( Analytics_4::PROVISION_ACCOUNT_TICKET_ID . '::' . $this->user->ID ) );
		// Ensure remote request was not made.
		$this->assertNull( $provision_account_ticket_request );
	}

	public function test_create_account_ticket() {
		$account_ticket_id     = 'test-account-ticket-id';
		$account_display_name  = 'test account name';
		$region_code           = 'US';
		$property_display_name = 'test property name';
		$stream_display_name   = 'test stream name';
		$timezone              = 'UTC';

		$provision_account_ticket_request = null;
		FakeHttp::fake_google_http_handler(
			$this->analytics->get_client(),
			function ( Request $request ) use ( &$provision_account_ticket_request, $account_ticket_id ) {
				$url = parse_url( $request->getUri() );

				if ( 'sitekit.withgoogle.com' !== $url['host'] ) {
					return new Response( 200 );
				}

				switch ( $url['path'] ) {
					case '/v1beta/accounts:provisionAccountTicket':
						$provision_account_ticket_request = $request;

						$response = new GoogleAnalyticsAdminV1betaProvisionAccountTicketResponse();
						$response->setAccountTicketId( $account_ticket_id );

						return new Response( 200, array(), json_encode( $response ) );

					default:
						throw new Exception( 'Not implemented' );
				}
			}
		);

		$this->analytics->register();
		$data = array(
			'displayName'                      => $account_display_name,
			'regionCode'                       => $region_code,
			'propertyName'                     => $property_display_name,
			'dataStreamName'                   => $stream_display_name,
			'timezone'                         => $timezone,
			'enhancedMeasurementStreamEnabled' => true,
		);

		$response = $this->analytics->set_data( 'create-account-ticket', $data );
		// Assert that the Analytics edit scope is required.
		$this->assertWPError( $response );
		$this->assertEquals( 'missing_required_scopes', $response->get_error_code() );
		$this->grant_scope( Analytics_4::EDIT_SCOPE );

		$response = $this->analytics->set_data( 'create-account-ticket', $data );

		// Assert request was made with expected arguments.
		$this->assertNotWPError( $response );
		$account_ticket_request = new Analytics_4\GoogleAnalyticsAdmin\Proxy_GoogleAnalyticsAdminProvisionAccountTicketRequest(
			json_decode( $provision_account_ticket_request->getBody()->getContents(), true ) // must be array to hydrate model.
		);
		$this->assertEquals( $account_display_name, $account_ticket_request->getAccount()->getDisplayName() );
		$this->assertEquals( $region_code, $account_ticket_request->getAccount()->getRegionCode() );
		$redirect_uri = $this->authentication->get_google_proxy()->get_site_fields()['analytics_redirect_uri'];
		$this->assertEquals( $redirect_uri, $account_ticket_request->getRedirectUri() );

		// Assert transient is set with params.
		$account_ticket_params = get_transient( Analytics_4::PROVISION_ACCOUNT_TICKET_ID . '::' . $this->user->ID );
		$this->assertEquals( $account_ticket_id, $account_ticket_params['id'] );
		$this->assertEquals( $property_display_name, $account_ticket_params['property_name'] );
		$this->assertEquals( $stream_display_name, $account_ticket_params['data_stream_name'] );
		$this->assertEquals( $timezone, $account_ticket_params['timezone'] );
		$this->assertEquals( true, $account_ticket_params['enhanced_measurement_stream_enabled'] );
	}

	public function test_get_scopes() {
		$this->assertEqualSets(
			array(
				'https://www.googleapis.com/auth/analytics.readonly',
			),
			$this->analytics->get_scopes()
		);
	}

	/**
	 * @dataProvider data_scopes
	 */
	public function test_auth_scopes_( array $granted_scopes, array $expected_scopes ) {
		remove_all_filters( 'googlesitekit_auth_scopes' );
		$this->analytics->register();

		$this->authentication->get_oauth_client()->set_granted_scopes( $granted_scopes );

		$this->assertEqualSets(
			$expected_scopes,
			apply_filters( 'googlesitekit_auth_scopes', array() )
		);
	}

	public function data_scopes() {
		return array(
			'with analytics and tag manager scopes granted' => array(
				array(
					Analytics_4::READONLY_SCOPE,
					'https://www.googleapis.com/auth/tagmanager.readonly',
				),
				array(
					Analytics_4::READONLY_SCOPE,
					'https://www.googleapis.com/auth/tagmanager.readonly',
				),
			),
			'with analytics scope granted' => array(
				array(
					Analytics_4::READONLY_SCOPE,
				),
				array(
					Analytics_4::READONLY_SCOPE,
				),
			),
			'with no scopes granted'       => array(
				array(),
				array(
					Analytics_4::READONLY_SCOPE,
					'https://www.googleapis.com/auth/tagmanager.readonly',
				),
			),
		);
	}

	public function test_is_connected() {
		$options   = new Options( $this->context );
		$analytics = new Analytics_4( $this->context, $options );

		$this->assertFalse( $analytics->is_connected() );

		$options->set(
			Settings::OPTION,
			array(
				'accountID'       => '12345678',
				'propertyID'      => '987654321',
				'webDataStreamID' => '1234567890',
				'measurementID'   => 'A1B2C3D4E5',
			)
		);

		$this->assertTrue( $analytics->is_connected() );
	}

	public function test_data_available_reset_on_property_change() {
		$this->analytics->register();
		$this->analytics->get_settings()->merge(
			array(
				'propertyID' => '987654321',
			)
		);
		$this->analytics->set_data_available();
		$this->analytics->get_settings()->merge(
			array(
				'propertyID' => '887654321',
			)
		);

		$this->assertFalse( $this->analytics->is_data_available() );
	}

	public function test_data_available_reset_on_measurement_id_change() {
		$this->analytics->register();
		$this->analytics->get_settings()->merge(
			array(
				'measurementID' => 'A1B2C3D4E5',
			)
		);
		$this->analytics->set_data_available( true );
		$this->analytics->get_settings()->merge(
			array(
				'measurementID' => 'F6G7H8I9J0',
			)
		);

		$this->assertFalse( $this->analytics->is_data_available() );
	}

	public function test_available_custom_dimensions_reset_on_property_id_change() {
		// Given: Analytics 4 is registered with a specific propertyID.
		$this->analytics->register();
		$this->analytics->get_settings()->register();
		$this->analytics->get_settings()->merge(
			array(
				'availableCustomDimensions' => array( 'googlesitekit_dimension1', 'googlesitekit_dimension2' ),
			)
		);

		// Assert that the availableCustomDimensions are set correctly before the change.
		$initial_settings = $this->analytics->get_settings()->get();
		$this->assertEquals( array( 'googlesitekit_dimension1', 'googlesitekit_dimension2' ), $initial_settings['availableCustomDimensions'] );

		// When: The propertyID is changed.
		$this->analytics->get_settings()->merge(
			array(
				'propertyID' => '7654321',
			)
		);

		// Then: The availableCustomDimensions should be reset to null.
		$settings = $this->analytics->get_settings()->get();
		$this->assertNull( $settings['availableCustomDimensions'] );
	}

	public function test_only_googlesitekit_prefixed_dimensions_are_retained() {
		// Given: Analytics 4 is registered with a mixture of valid and invalid custom dimensions.
		$this->analytics->register();
		$this->analytics->get_settings()->register();
		$this->analytics->get_settings()->merge(
			array(
				'availableCustomDimensions' => array(
					'googlesitekit_dimension1',
					'invalid_dimension',
					'googlesitekit_dimension2',
					'another_invalid_dimension',
				),
			)
		);

		// When: The settings are fetched after merging.
		$current_settings = $this->analytics->get_settings()->get();

		// Then: Only the dimensions with the 'googlesitekit_' prefix should be retained.
		$this->assertEquals(
			array( 'googlesitekit_dimension1', 'googlesitekit_dimension2' ),
			$current_settings['availableCustomDimensions']
		);
	}


	public function test_on_activation() {
		$dismissed_items = new Dismissed_Items( $this->user_options );

		$dismissed_items->add( 'key-metrics-connect-ga4-cta-widget' );

		$this->assertEqualSets(
			array(
				'key-metrics-connect-ga4-cta-widget' => 0,
			),
			$dismissed_items->get()
		);

		$this->analytics->on_activation();

		$this->assertEqualSets(
			array(),
			$dismissed_items->get()
		);
	}

	public function test_on_deactivation() {
		$options = new Options( $this->context );
		$options->set( Settings::OPTION, 'test-value' );

		$analytics = new Analytics_4( $this->context, $options );
		$analytics->set_data_available();
		$analytics->on_deactivation();

		$this->assertOptionNotExists( Settings::OPTION );
		$this->assertFalse( $analytics->is_data_available() );
	}

	public function test_get_datapoints() {
		$this->assertEqualSets(
			array(
				'account-summaries',
				'accounts',
				'ads-links',
				'adsense-links',
				'container-lookup',
				'container-destinations',
				'google-tag-settings',
				'conversion-events',
				'create-property',
				'create-webdatastream',
				'pivot-report',
				'properties',
				'property',
				'report',
				'webdatastreams',
				'webdatastreams-batch',
				'create-account-ticket',
				'enhanced-measurement-settings',
				'create-custom-dimension',
				'sync-custom-dimensions',
				'custom-dimension-data-available',
				'set-google-tag-id-mismatch',
			),
			$this->analytics->get_datapoints()
		);
	}

	public function test_get_datapoints__audienceSegmentation() {

		$this->assertEqualSets(
			array(
				'account-summaries',
				'accounts',
				'ads-links',
				'adsense-links',
				'container-lookup',
				'container-destinations',
				'google-tag-settings',
				'conversion-events',
				'create-property',
				'create-webdatastream',
				'pivot-report',
				'properties',
				'property',
				'report',
				'webdatastreams',
				'webdatastreams-batch',
				'create-account-ticket',
				'enhanced-measurement-settings',
				'create-custom-dimension',
				'sync-custom-dimensions',
				'custom-dimension-data-available',
				'set-google-tag-id-mismatch',
				'create-audience',
				'sync-audiences',
				'save-resource-data-availability-date',
				'audience-settings',
				'save-audience-settings',
			),
			$this->analytics->get_datapoints()
		);
	}

	public function test_get_datapoints__conversionReporting() {
		$this->enable_feature( 'conversionReporting' );

		$this->assertEqualSets(
			array(
				'account-summaries',
				'accounts',
				'ads-links',
				'adsense-links',
				'container-lookup',
				'container-destinations',
				'google-tag-settings',
				'conversion-events',
				'create-property',
				'create-webdatastream',
				'pivot-report',
				'properties',
				'property',
				'report',
				'webdatastreams',
				'webdatastreams-batch',
				'create-account-ticket',
				'enhanced-measurement-settings',
				'create-custom-dimension',
				'sync-custom-dimensions',
				'custom-dimension-data-available',
				'set-google-tag-id-mismatch',
			),
			$this->analytics->get_datapoints()
		);
	}
	public function test_get_debug_fields() {
		$this->assertEqualSets(
			array(
				'analytics_4_account_id',
				'analytics_4_property_id',
				'analytics_4_web_data_stream_id',
				'analytics_4_measurement_id',
				'analytics_4_use_snippet',
				'analytics_4_available_custom_dimensions',
				'analytics_4_ads_conversion_id',
				'analytics_4_ads_linked',
				'analytics_4_ads_linked_last_synced_at',
			),
			array_keys( $this->analytics->get_debug_fields() )
		);
	}

	public function test_get_debug_fields__audience_segmentation_enabled() {

		$this->assertEqualSets(
			array(
				'analytics_4_account_id',
				'analytics_4_property_id',
				'analytics_4_web_data_stream_id',
				'analytics_4_measurement_id',
				'analytics_4_use_snippet',
				'analytics_4_available_custom_dimensions',
				'analytics_4_ads_conversion_id',
				'analytics_4_ads_linked',
				'analytics_4_ads_linked_last_synced_at',
				'analytics_4_site_kit_audiences',
			),
			array_keys( $this->analytics->get_debug_fields() )
		);
	}

	public function test_get_debug_fields__AdSense_disabled() {
		$this->assertEqualSets(
			array(
				'analytics_4_account_id',
				'analytics_4_ads_conversion_id',
				'analytics_4_available_custom_dimensions',
				'analytics_4_measurement_id',
				'analytics_4_property_id',
				'analytics_4_use_snippet',
				'analytics_4_web_data_stream_id',
				'analytics_4_ads_linked',
				'analytics_4_ads_linked_last_synced_at',
			),
			array_keys( $this->analytics->get_debug_fields() )
		);
	}

	public function test_get_debug_fields__AdSense_enabled() {

		$adsense_settings = new AdSense_Settings( $this->options );
		$adsense_settings->merge(
			array(
				'accountSetupComplete' => true,
				'siteSetupComplete'    => true,
			)
		);

		$this->assertEqualSets(
			array(
				'analytics_4_account_id',
				'analytics_4_ads_conversion_id',
				'analytics_4_available_custom_dimensions',
				'analytics_4_measurement_id',
				'analytics_4_property_id',
				'analytics_4_use_snippet',
				'analytics_4_web_data_stream_id',
				'analytics_4_ads_linked',
				'analytics_4_ads_linked_last_synced_at',
				'analytics_4_adsense_linked',
				'analytics_4_adsense_linked_last_synced_at',
			),
			array_keys( $this->analytics->get_debug_fields() )
		);
	}

	/**
	 * @dataProvider data_google_tag_ids
	 *
	 * @param array $tag_ids_data Tag IDs and expected result.
	 */
	public function test_google_tag_settings_datapoint( $tag_ids_data ) {
		$scopes   = $this->analytics->get_scopes();
		$scopes[] = 'https://www.googleapis.com/auth/tagmanager.readonly';
		$this->authentication->get_oauth_client()->set_granted_scopes( $scopes );

		FakeHttp::fake_google_http_handler(
			$this->analytics->get_client(),
			function ( Request $request ) use ( $tag_ids_data ) {
				$url = parse_url( $request->getUri() );

				if ( 'tagmanager.googleapis.com' !== $url['host'] ) {
					return new Response( 200 );
				}
				switch ( $url['path'] ) {
					case '/tagmanager/v2/accounts/containers:lookup':
						$data = new Container();
						$data->setAccountId( '123' );
						$data->setContainerId( '456' );
						$data->setTagIds( $tag_ids_data[0] );
						return new Response(
							200,
							array(),
							json_encode(
								$data->toSimpleObject()
							)
						);

					default:
						return new Response( 200 );
				}
			}
		);

		$this->analytics->register();

		$data = $this->analytics->get_data(
			'google-tag-settings',
			array(
				'measurementID' => 'A1B2C3D4E5',
			)
		);

		$this->assertNotWPError( $data );

		$this->assertEquals(
			$tag_ids_data[1],
			$data['googleTagID']
		);
	}

	public function data_google_tag_ids() {
		return array(
			'one tag ID'                                 => array(
				array(
					array( 'GT-123' ),
					'GT-123',
				),
			),
			'multiple tag IDs - returns first GT tag ID' => array(
				array(
					array( 'G-123', 'GT-123', 'A1B2C3D4E5' ),
					'GT-123',
				),
			),
			'multiple tag IDs, including the current measurement ID - returns the measurement ID' => array(
				array(
					array( 'G-123', 'A1B2C3D4E5' ),
					'A1B2C3D4E5',
				),
			),
			'multiple tag IDs - no GT or measurement ID' => array(
				array(
					array( 'AW-012', 'G-123' ),
					'G-123',
				),
			),
			'multiple tag IDs - no GT, G or measurement ID - returns first tag ID' => array(
				array(
					array( 'AW-012', 'AW-123' ),
					'AW-012',
				),
			),
		);
	}

	/**
	 * @dataProvider data_access_token
	 *
	 * When an access token is provided, the user will be authenticated for the test.
	 *
	 * @param string $access_token Access token, or empty string if none.
	 */
	public function test_get_report( $access_token ) {
		$this->setup_user_authentication( $access_token );

		$property_id = '123456789';

		$this->analytics->get_settings()->merge(
			array(
				'propertyID' => $property_id,
			)
		);

		// Grant scopes so request doesn't fail.
		$this->authentication->get_oauth_client()->set_granted_scopes(
			$this->analytics->get_scopes()
		);

		FakeHttp::fake_google_http_handler(
			$this->analytics->get_client(),
			$this->create_fake_http_handler( $property_id )
		);

		$this->analytics->register();

		// Fetch a report that exercises all input parameters, barring the alternative date range,
		// metric and dimension formats which are tested separately.
		$data = $this->analytics->get_data(
			'report',
			array(
				// Note, metrics is a required parameter.
				'metrics'          => array(
					// Provide metrics in both string and array formats.
					'sessions',
					array(
						'name'       => 'total',
						'expression' => 'totalUsers',
					),
				),
				// All other parameters are optional.
				'url'              => 'https://example.org/some-page-here/',
				'limit'            => 321,
				'startDate'        => '2022-11-02',
				'endDate'          => '2022-11-04',
				'compareStartDate' => '2022-11-01',
				'compareEndDate'   => '2022-11-02',
				'dimensions'       => array(
					// Provide dimensions in both string and array formats.
					'sessionDefaultChannelGrouping',
					array(
						'name' => 'pageTitle',
					),
				),
				'dimensionFilters' => array(
					// Provide dimension filters with single and multiple values.
					'sessionDefaultChannelGrouping' => 'Organic Search',
					'pageTitle'                     => array( 'Title Foo', 'Title Bar' ),
				),
				'metricFilters'    => array(
					'total' => array(
						'operation' => 'GREATER_THAN_OR_EQUAL',
						'value'     => array(
							'int64Value' => 4,
						),
					),
				),
				'orderby'          => array(
					array(
						'metric' => array(
							'metricName' => 'sessions',
						),
						'desc'   => true,
					),
					array(
						'metric' => array(
							'metricName' => 'total',
						),
						// Omit desc to test default value.
					),
					array(
						'dimension' => array(
							'dimensionName' => 'pageTitle',
						),
						'desc'      => false,
					),
				),
			)
		);

		$this->assertNotWPError( $data );

		// Verify the reports are returned by checking a metric value.
		$this->assertEquals( 'some-value', $data['modelData'][0]['rows'][0]['metricValues'][0]['value'] );

		// Verify the request URL and params were correctly generated.
		$this->assertCount( 1, $this->request_handler_calls );

		$request_url = $this->request_handler_calls[0]['url'];

		$this->assertEquals( 'analyticsdata.googleapis.com', $request_url['host'] );
		$this->assertEquals( '/v1beta/properties/123456789:runReport', $request_url['path'] );

		$request_params = $this->request_handler_calls[0]['params'];

		// Verify the request params that are set by default.
		$this->assertEquals(
			'properties/123456789',
			$request_params['property']
		);

		$this->assertEquals(
			1,
			$request_params['keepEmptyRows']
		);

		$this->assertEquals(
			array(
				'TOTAL',
				'MINIMUM',
				'MAXIMUM',
			),
			$request_params['metricAggregations']
		);

		// Verify the request params that are derived from the input parameters.
		$this->assertEquals(
			array(
				array(
					'name' => 'sessions',
				),
				array(
					'name'       => 'total',
					'expression' => 'totalUsers',
				),
			),
			$request_params['metrics']
		);

		$this->assertEquals(
			array(
				array(
					'startDate' => '2022-11-02',
					'endDate'   => '2022-11-04',
				),
				array(
					'startDate' => '2022-11-01',
					'endDate'   => '2022-11-02',
				),
			),
			$request_params['dateRanges']
		);

		$this->assertEquals(
			321,
			$request_params['limit']
		);

		$this->assertEquals(
			array(
				array(
					'name' => 'sessionDefaultChannelGrouping',
				),
				array(
					'name' => 'pageTitle',
				),
			),
			$request_params['dimensions']
		);

		$this->assertEquals(
			array(
				'andGroup' => array(
					'expressions' => array(
						// Verify the default page filter is correct.
						array(
							'filter' => array(
								'fieldName'    => 'hostName',
								'inListFilter' => array(
									'values' => array(
										'example.org',
										'www.example.org',
									),
								),
							),
						),
						// Verify the URL filter is correct.
						array(
							'filter' => array(
								'fieldName'    => 'pagePath',
								'stringFilter' => array(
									'matchType' => 'EXACT',
									'value'     => 'https://example.org/some-page-here/',
								),
							),
						),
						// Verify the single-value dimension filter is correct.
						array(
							'filter' => array(
								'fieldName'    => 'sessionDefaultChannelGrouping',
								'stringFilter' => array(
									'matchType' => 'EXACT',
									'value'     => 'Organic Search',
								),
							),
						),
						// Verify the multi-value dimension filter is correct.
						array(
							'filter' => array(
								'fieldName'    => 'pageTitle',
								'inListFilter' => array(
									'values' => array( 'Title Foo', 'Title Bar' ),
								),
							),
						),
					),
				),
			),
			$request_params['dimensionFilter']
		);

		$this->assertEquals(
			array(
				'andGroup' => array(
					'expressions' => array(
						array(
							'filter' => array(
								'fieldName'     => 'total',
								'numericFilter' => array(
									'operation' => 'GREATER_THAN_OR_EQUAL',
									'value'     => array(
										'int64Value' => 4,
									),
								),
							),
						),
					),
				),
			),
			$request_params['metricFilter']
		);

		$this->assertEquals(
			array(
				array(
					'metric' => array(
						'metricName' => 'sessions',
					),
					'desc'   => '1',
				),
				array(
					'metric' => array(
						'metricName' => 'total',
					),
					'desc'   => '',
				),
				array(
					'dimension' => array(
						'dimensionName' => 'pageTitle',
					),
					'desc'      => '',
				),
			),
			$request_params['orderBys']
		);
	}

	/**
	 * @dataProvider data_access_token
	 *
	 * When an access token is provided, the user will be authenticated for the test.
	 *
	 * @param string $access_token Access token, or empty string if none.
	 */
	public function test_get_pivot_report( $access_token ) {
		$this->setup_user_authentication( $access_token );

		$property_id = '123456789';

		$this->analytics->get_settings()->merge(
			array(
				'propertyID' => $property_id,
			)
		);

		// Grant scopes so request doesn't fail.
		$this->authentication->get_oauth_client()->set_granted_scopes(
			$this->analytics->get_scopes()
		);

		FakeHttp::fake_google_http_handler(
			$this->analytics->get_client(),
			$this->create_fake_http_handler( $property_id )
		);

		$this->analytics->register();

		// Fetch a pivot report with all input parameters.
		$data = $this->analytics->get_data(
			'pivot-report',
			array(
				'startDate'        => '2022-11-02',
				'endDate'          => '2022-11-04',
				'metrics'          => array(
					array(
						'name' => 'totalUsers',
					),
				),
				'dimensions'       => array(
					'city',
					'operatingSystem',
				),
				'dimensionFilters' => array(
					'operatingSystem' => array(
						'city',
						'operatingSystem',
					),
				),
				'pivots'           => array(
					array(
						'fieldNames' => array( 'operatingSystem' ),
						'limit'      => 3,
					),
					array(
						'fieldNames' => array( 'city' ),
						'limit'      => 2,
						'orderby'    => array(
							array(
								'metric' => array(
									'metricName' => 'totalUsers',
								),
								'desc'   => true,
							),
						),
					),
				),
			)
		);

		$this->assertNotWPError( $data );

		// Verify the reports are returned by checking a metric value.
		$this->assertEquals( 'some-value', $data['modelData'][0]['rows'][0]['metricValues'][0]['value'] );

		// Verify the request URL and params were correctly generated.
		$this->assertCount( 1, $this->request_handler_calls );

		$request_url = $this->request_handler_calls[0]['url'];

		$this->assertEquals( 'analyticsdata.googleapis.com', $request_url['host'] );
		$this->assertEquals( '/v1beta/properties/123456789:runPivotReport', $request_url['path'] );

		$request_params = $this->request_handler_calls[0]['params'];

		// Verify the request params that are set by default.
		$this->assertEquals(
			'properties/123456789',
			$request_params['property']
		);

		$this->assertEquals(
			1,
			$request_params['keepEmptyRows']
		);

		// Verify the request params that are derived from the input parameters.
		$this->assertEquals(
			array(
				array(
					'name' => 'totalUsers',
				),
			),
			$request_params['metrics']
		);

		$this->assertEquals(
			array(
				array(
					'startDate' => '2022-11-02',
					'endDate'   => '2022-11-04',
				),
			),
			$request_params['dateRanges']
		);

		$this->assertEquals(
			array(
				array(
					'name' => 'city',
				),
				array(
					'name' => 'operatingSystem',
				),
				// The hostName dimension will be auto added to every request because
				// we add a dimension filter in Analytics_4/Report/Request to
				// the data to the WordPress site URL.
				array(
					'name' => 'hostName',
				),
			),
			$request_params['dimensions']
		);

		$this->assertEquals(
			array(
				'andGroup' => array(
					'expressions' => array(
						// Site URLs are added as dimension filters as above because
						// we add a dimension filter in Analytics_4/Report/Request to
						// the data to the WordPress site URL.
								array(

									'filter' =>
									array(
										'fieldName'    => 'hostName',
										'inListFilter' =>
										array(
											'values' =>
											array(
												'example.org',
												'www.example.org',
											),
										),

									),
								),
						array(
							'filter' => array(
								'fieldName'    => 'operatingSystem',
								'inListFilter' => array(
									'values' => array(
										'city',
										'operatingSystem',
									),
								),
							),
						),
					),
				),
			),
			$request_params['dimensionFilter']
		);

		$this->assertEquals(
			array(
				array(
					'fieldNames'         => array( 'operatingSystem' ),
					'limit'              => 3,
					'metricAggregations' => array(
						'TOTAL',
						'MINIMUM',
						'MAXIMUM',
					),
				),
				array(
					'fieldNames'         => array( 'city' ),
					'limit'              => 2,
					'orderBys'           => array(
						array(
							'metric' => array(
								'metricName' => 'totalUsers',
							),
							'desc'   => true,
						),
					),
					'metricAggregations' => array(
						'TOTAL',
						'MINIMUM',
						'MAXIMUM',
					),
				),
			),
			$request_params['pivots']
		);
	}

	/**
	 * @dataProvider data_access_token
	 *
	 * When an access token is provided, the user will be authenticated for the test.
	 *
	 * @param string $access_token Access token, or empty string if none.
	 */
	public function test_get_report__default_date_range( $access_token ) {
		$this->setup_user_authentication( $access_token );

		$property_id = '123456789';

		$this->analytics->get_settings()->merge(
			array(
				'propertyID' => $property_id,
			)
		);

		// Grant scopes so request doesn't fail.
		$this->authentication->get_oauth_client()->set_granted_scopes(
			$this->analytics->get_scopes()
		);

		$this->fake_handler_and_invoke_register_method( $property_id );

		$this->analytics->get_data(
			'report',
			array(
				// Note, metrics is a required parameter.
				'metrics' => array(
					array( 'name' => 'sessions' ),
				),
			)
		);

		$request_params = $this->request_handler_calls[0]['params'];

		// Verify the default date range is correct.
		$this->assertEquals(
			array(
				array(
					'startDate' => $this->days_ago_date_string( 28 ),
					'endDate'   => $this->days_ago_date_string( 1 ),
				),
			),
			$request_params['dateRanges']
		);
	}

	/**
	 * @dataProvider data_access_token
	 *
	 * When an access token is provided, the user will be authenticated for the test.
	 *
	 * @param string $access_token Access token, or empty string if none.
	 */
	public function test_get_report__metrics_as_string( $access_token ) {
		$this->setup_user_authentication( $access_token );

		$property_id = '123456789';

		$this->analytics->get_settings()->merge(
			array(
				'propertyID' => $property_id,
			)
		);

		// Grant scopes so request doesn't fail.
		$this->authentication->get_oauth_client()->set_granted_scopes(
			$this->analytics->get_scopes()
		);

		$this->fake_handler_and_invoke_register_method( $property_id );

		$this->analytics->get_data(
			'report',
			array(
				// Note, metrics is a required parameter.
				'metrics' => 'sessions,totalUsers',
			)
		);

		$request_params = $this->request_handler_calls[0]['params'];

		$this->assertEquals(
			array(
				array(
					'name' => 'sessions',
				),
				array(
					'name' => 'totalUsers',
				),
			),
			$request_params['metrics']
		);
	}

	/**
	 * @dataProvider data_access_token
	 *
	 * When an access token is provided, the user will be authenticated for the test.
	 *
	 * @param string $access_token Access token, or empty string if none.
	 */
	public function test_get_report__metrics_as_single_object( $access_token ) {
		$this->setup_user_authentication( $access_token );

		$property_id = '123456789';

		$this->analytics->get_settings()->merge(
			array(
				'propertyID' => $property_id,
			)
		);

		// Grant scopes so request doesn't fail.
		$this->authentication->get_oauth_client()->set_granted_scopes(
			$this->analytics->get_scopes()
		);

		$this->fake_handler_and_invoke_register_method( $property_id );

		$this->analytics->get_data(
			'report',
			array(
				// Note, metrics is a required parameter.
				'metrics' => array(
					'name'       => 'total',
					'expression' => 'totalUsers',
				),
			)
		);

		$request_params = $this->request_handler_calls[0]['params'];

		$this->assertEquals(
			array(
				array(
					'name'       => 'total',
					'expression' => 'totalUsers',
				),
			),
			$request_params['metrics']
		);
	}

	/**
	 * @dataProvider data_access_token
	 *
	 * When an access token is provided, the user will be authenticated for the test.
	 *
	 * @param string $access_token Access token, or empty string if none.
	 */
	public function test_get_report__dimensions_as_string( $access_token ) {
		$this->setup_user_authentication( $access_token );

		$property_id = '123456789';

		$this->analytics->get_settings()->merge(
			array(
				'propertyID' => $property_id,
			)
		);

		// Grant scopes so request doesn't fail.
		$this->authentication->get_oauth_client()->set_granted_scopes(
			$this->analytics->get_scopes()
		);

		$this->fake_handler_and_invoke_register_method( $property_id );

		$this->analytics->get_data(
			'report',
			array(
				// Note, metrics is a required parameter.
				'metrics'    => 'sessions',
				'dimensions' => 'sessionDefaultChannelGrouping,pageTitle',
			)
		);

		$request_params = $this->request_handler_calls[0]['params'];

		$this->assertEquals(
			array(
				array(
					'name' => 'sessionDefaultChannelGrouping',
				),
				array(
					'name' => 'pageTitle',
				),
			),
			$request_params['dimensions']
		);
	}

	/**
	 * @dataProvider data_access_token
	 *
	 * When an access token is provided, the user will be authenticated for the test.
	 *
	 * @param string $access_token Access token, or empty string if none.
	 */
	public function test_get_report__dimensions_as_single_object( $access_token ) {
		$this->setup_user_authentication( $access_token );

		$property_id = '123456789';

		$this->analytics->get_settings()->merge(
			array(
				'propertyID' => $property_id,
			)
		);

		// Grant scopes so request doesn't fail.
		$this->authentication->get_oauth_client()->set_granted_scopes(
			$this->analytics->get_scopes()
		);

		$this->fake_handler_and_invoke_register_method( $property_id );

		$this->analytics->get_data(
			'report',
			array(
				// Note, metrics is a required parameter.
				'metrics'    => 'sessions',
				'dimensions' => array(
					'name' => 'pageTitle',
				),
			)
		);

		$request_params = $this->request_handler_calls[0]['params'];

		$this->assertEquals(
			array(
				array(
					'name' => 'pageTitle',
				),
			),
			$request_params['dimensions']
		);
	}

	/**
	 * @dataProvider data_access_token
	 *
	 * When an access token is provided, the user will be authenticated for the test.
	 *
	 * @param string $access_token Access token, or empty string if none.
	 */
	public function test_report__insufficient_permissions( $access_token ) {
		$this->setup_user_authentication( $access_token );

		$data = $this->analytics->get_data( 'report', array() );

		$this->assertWPErrorWithMessage( 'Site Kit can’t access the relevant data from Analytics because you haven’t granted all permissions requested during setup.', $data );
		$this->assertEquals( 'missing_required_scopes', $data->get_error_code() );
	}

	/**
	 * @dataProvider data_access_token
	 *
	 * When an access token is provided, the user will be authenticated for the test.
	 *
	 * @param string $access_token Access token, or empty string if none.
	 */
	public function test_report__no_metrics( $access_token ) {
		$this->setup_user_authentication( $access_token );

		$property_id = '123456789';

		$this->analytics->get_settings()->merge(
			array(
				'propertyID' => $property_id,
			)
		);

		$this->authentication->get_oauth_client()->set_granted_scopes(
			$this->analytics->get_scopes()
		);

		$data = $this->analytics->get_data( 'report', array() );

		$this->assertWPErrorWithMessage( 'Request parameter is empty: metrics.', $data );
		$this->assertEquals( 'missing_required_param', $data->get_error_code() );
		$this->assertEquals( array( 'status' => 400 ), $data->get_error_data( 'missing_required_param' ) );
	}

	/**
	 * @dataProvider data_access_token
	 *
	 * When an access token is provided, the user will be authenticated for the test.
	 *
	 * @param string $access_token Access token, or empty string if none.
	 */
	public function test_report__metric_validation_invalid_name_singular( $access_token ) {
		$this->setup_user_authentication( $access_token );

		$property_id = '123456789';

		$this->analytics->get_settings()->merge(
			array(
				'propertyID' => $property_id,
			)
		);

		// Grant scopes so request doesn't fail.
		$this->authentication->get_oauth_client()->set_granted_scopes(
			$this->analytics->get_scopes()
		);

		$this->fake_handler_and_invoke_register_method( $property_id );

		// Test the invalid character cases.
		// Please note this is not a comprehensive list of invalid characters, as that would be a very long list. This is just a representative sample.
		$invalid_characters = ' !"#$%&\'()*+,-./:;<=>?@[\\]^`{|}~ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïð';

		$invalid_names = array_map(
			function ( $character ) {
				return "test$character";
			},
			str_split( $invalid_characters )
		);

		// Include the empty string as an invalid name.
		$invalid_name[] = '';

		foreach ( $invalid_names as $invalid_name ) {
			$invalid_name_metrics_singular = array(
				array( 'name' => $invalid_name ),
				array( array( 'name' => $invalid_name ), array( 'name' => 'test' ) ),
				array(
					array(
						'name'       => $invalid_name,
						'expression' => 'test1',
					),
					array(
						'name'       => 'test2',
						'expression' => 'test2',
					),
				),
			);

			foreach ( $invalid_name_metrics_singular as $metrics ) {
				$data = $this->analytics->get_data(
					'report',
					array( 'metrics' => $metrics )
				);

				$this->assertWPErrorWithMessage( "Metric name should match the expression ^[a-zA-Z0-9_]+$: $invalid_name", $data );
				$this->assertEquals( 'invalid_analytics_4_report_metrics', $data->get_error_code() );
			}
		}
	}

	/**
	 * @dataProvider data_access_token
	 *
	 * When an access token is provided, the user will be authenticated for the test.
	 *
	 * @param string $access_token Access token, or empty string if none.
	 */
	public function test_report__metric_validation_invalid_name_plural( $access_token ) {
		$this->setup_user_authentication( $access_token );

		$property_id = '123456789';

		$this->analytics->get_settings()->merge(
			array(
				'propertyID' => $property_id,
			)
		);

		// Grant scopes so request doesn't fail.
		$this->authentication->get_oauth_client()->set_granted_scopes(
			$this->analytics->get_scopes()
		);

		$this->fake_handler_and_invoke_register_method( $property_id );

		// Test the invalid character cases.
		// Please note this is not a comprehensive list of invalid characters, as that would be a very long list. This is just a representative sample.
		$invalid_characters = ' !"#$%&\'()*+,-./:;<=>?@[\\]^`{|}~ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïð';

		$invalid_names = array_map(
			function ( $character ) {
				return "test$character";
			},
			str_split( $invalid_characters )
		);

		// Include the empty string as an invalid name.
		$invalid_name[] = '';

		foreach ( $invalid_names as $invalid_name ) {
			$invalid_name_metrics_plural = array(
				array( array( 'name' => $invalid_name ), array( 'name' => 'test' ), array( 'name' => $invalid_name ) ),
				array(
					array(
						'name'       => $invalid_name,
						'expression' => 'test1',
					),
					array(
						'name'       => 'test2',
						'expression' => 'test2',
					),
					array(
						'name'       => $invalid_name,
						'expression' => 'test3',
					),
				),
			);

			// Validate the string variant of metrics (which can be comma-separated) if $invalid_name does not include a comma.
			if ( false === strpos( $invalid_name, ',' ) ) {
				array_push(
					$invalid_name_metrics_plural,
					"$invalid_name,$invalid_name",
					"$invalid_name,test1,$invalid_name,test2",
					"test1,$invalid_name,test2,$invalid_name"
				);
			}

			foreach ( $invalid_name_metrics_plural as $metrics ) {
				$data = $this->analytics->get_data(
					'report',
					array( 'metrics' => $metrics )
				);

				$this->assertWPErrorWithMessage( "Metric names should match the expression ^[a-zA-Z0-9_]+$: $invalid_name, $invalid_name", $data );
				$this->assertEquals( 'invalid_analytics_4_report_metrics', $data->get_error_code() );
			}
		}
	}

	public function test_report__shared_metric_validation() {
		$property_id = '123456789';

		$this->analytics->get_settings()->merge(
			array(
				'propertyID' => $property_id,
			)
		);

		$this->set_shareable_metrics( 'sessions', 'totalUsers' );

		$this->enable_shared_credentials();
		$this->assertTrue( $this->analytics->is_shareable() );

		$data = $this->analytics->get_data(
			'report',
			array(
				// Note, metrics is a required parameter.
				'metrics' => array(
					array( 'name' => 'sessions' ),
					array( 'name' => 'totalUsers' ),
					array( 'name' => 'invalidMetric' ),
					array( 'name' => 'anotherInvalidMetric' ),
				),
			)
		);

		$this->assertWPErrorWithMessage( 'Unsupported metrics requested: invalidMetric, anotherInvalidMetric', $data );
		$this->assertEquals( 'invalid_analytics_4_report_metrics', $data->get_error_code() );
	}

	public function test_report__shared_dimension_validation() {
		$property_id = '123456789';

		$this->analytics->get_settings()->merge(
			array(
				'propertyID' => $property_id,
			)
		);

		$this->set_shareable_metrics( 'sessions' );
		$this->set_shareable_dimensions( 'date', 'pageTitle' );

		$this->enable_shared_credentials();
		$this->assertTrue( $this->analytics->is_shareable() );

		$data = $this->analytics->get_data(
			'report',
			array(
				// Note, metrics is a required parameter.
				'metrics'    => array(
					array( 'name' => 'sessions' ),
				),
				'dimensions' => array( 'date', 'pageTitle', 'invalidDimension', 'anotherInvalidDimension' ),
			)
		);

		$this->assertWPErrorWithMessage( 'Unsupported dimensions requested: invalidDimension, anotherInvalidDimension', $data );
		$this->assertEquals( 'invalid_analytics_4_report_dimensions', $data->get_error_code() );
	}

	/**
	 * @dataProvider data_access_token
	 *
	 * When an access token is provided, the user will be authenticated for the test.
	 *
	 * @param string $access_token Access token, or empty string if none.
	 */
	public function test_report__no_property_id( $access_token ) {
		$this->setup_user_authentication( $access_token );

		$this->authentication->get_oauth_client()->set_granted_scopes(
			$this->analytics->get_scopes()
		);

		$data = $this->analytics->get_data(
			'report',
			array(
				// Note, metrics is a required parameter.
				'metrics' => array(
					array( 'name' => 'sessions' ),
				),
			)
		);

		$this->assertWPErrorWithMessage( 'No connected Google Analytics property ID.', $data );
		$this->assertEquals( 'missing_required_setting', $data->get_error_code() );
		$this->assertEquals( array( 'status' => 500 ), $data->get_error_data( 'missing_required_setting' ) );
	}

	/**
	 * @dataProvider data_access_token
	 *
	 * When an access token is provided, the user will be authenticated for the test.
	 *
	 * @param string $access_token Access token, or empty string if none.
	 */
	public function test_get_conversion_events( $access_token ) {
		$this->setup_user_authentication( $access_token );

		$property_id = '123456789';

		$this->analytics->get_settings()->merge(
			array(
				'propertyID' => $property_id,
			)
		);

		// Grant scopes so request doesn't fail.
		$this->authentication->get_oauth_client()->set_granted_scopes(
			$this->analytics->get_scopes()
		);

		$this->fake_handler_and_invoke_register_method( $property_id );

		// Fetch conversion events.
		$data = $this->analytics->get_data(
			'conversion-events',
			array(
				'propertyID' => $property_id,
			)
		);

		$this->assertNotWPError( $data );

		// Verify the conversion events are returned by checking an event name.
		$this->assertEquals( 'some-event', $data[0]['eventName'] );

		// Verify the request URL and params were correctly generated.
		$this->assertCount( 1, $this->request_handler_calls );

		$request_url = $this->request_handler_calls[0]['url'];

		$this->assertEquals( 'analyticsadmin.googleapis.com', $request_url['host'] );
		$this->assertEquals( "/v1beta/properties/$property_id/conversionEvents", $request_url['path'] );
	}

	public function test_get_enhanced_measurement_settings__required_params() {
		// Grant READONLY_SCOPE so request doesn't fail.
		$this->grant_scope( Analytics_4::READONLY_SCOPE );

		$data = $this->analytics->get_data(
			'enhanced-measurement-settings',
			array()
		);

		// Verify that the propertyID is required.
		$this->assertWPErrorWithMessage( 'Request parameter is empty: propertyID.', $data );
		$this->assertEquals( 'missing_required_param', $data->get_error_code() );
		$this->assertEquals( array( 'status' => 400 ), $data->get_error_data( 'missing_required_param' ) );

		$data = $this->analytics->get_data(
			'enhanced-measurement-settings',
			array(
				'propertyID' => '123456789',
			)
		);

		// Verify that the webDataStreamID is required.
		$this->assertWPErrorWithMessage( 'Request parameter is empty: webDataStreamID.', $data );
		$this->assertEquals( 'missing_required_param', $data->get_error_code() );
		$this->assertEquals( array( 'status' => 400 ), $data->get_error_data( 'missing_required_param' ) );
	}

	public function test_get_enhanced_measurement_settings() {
		$property_id        = '123456789';
		$web_data_stream_id = '654321';

		$this->analytics->get_settings()->merge(
			array(
				'propertyID'      => $property_id,
				'webDataStreamID' => $web_data_stream_id,
			)
		);

		// Grant READONLY_SCOPE so request doesn't fail.
		$this->grant_scope( Analytics_4::READONLY_SCOPE );

		FakeHttp::fake_google_http_handler(
			$this->analytics->get_client(),
			$this->create_enhanced_measurement_fake_http_handler( $property_id, $web_data_stream_id )
		);
		$this->analytics->register();

		// Fetch enhanced measurement settings.
		$data = $this->analytics->get_data(
			'enhanced-measurement-settings',
			array(
				'propertyID'      => $property_id,
				'webDataStreamID' => $web_data_stream_id,
			)
		);

		$this->assertNotWPError( $data );

		$data_array = (array) $data;

		// Assert that the keys exist.
		$keys = array(
			'fileDownloadsEnabled',
			'name',
			'outboundClicksEnabled',
			'pageChangesEnabled',
			'scrollsEnabled',
			'searchQueryParameter',
			'siteSearchEnabled',
			'streamEnabled',
			'uriQueryParameter',
			'videoEngagementEnabled',
		);

		foreach ( $keys as $key ) {
			$this->assertArrayHasKey( $key, $data_array );
		}

		// Verify the enhanced measurement settings are returned by checking a field value.
		$this->assertEquals( true, $data['streamEnabled'] );

		// Verify the request URL and params were correctly generated.
		$this->assertCount( 1, $this->request_handler_calls );

		$request_url = $this->request_handler_calls[0]['url'];

		$this->assertEquals( 'analyticsadmin.googleapis.com', $request_url['host'] );
		$this->assertEquals( "/v1alpha/properties/$property_id/dataStreams/$web_data_stream_id/enhancedMeasurementSettings", $request_url['path'] );
	}

	public function test_set_enhanced_measurement_settings__required_params() {
		$property_id        = '123456789';
		$web_data_stream_id = '654321';

		FakeHttp::fake_google_http_handler(
			$this->analytics->get_client(),
			$this->create_enhanced_measurement_fake_http_handler( $property_id, $web_data_stream_id )
		);
		$this->analytics->register();

		// Call set_data without EDIT_SCOPE.
		$data = $this->analytics->set_data(
			'enhanced-measurement-settings',
			array(
				'propertyID'                  => $property_id,
				'webDataStreamID'             => $web_data_stream_id,
				'enhancedMeasurementSettings' => array(
					'streamEnabled' => true,
				),
			)
		);

		// Verify that the EDIT_SCOPE is required.
		$this->assertWPErrorWithMessage( 'You’ll need to grant Site Kit permission to update enhanced measurement settings for this Analytics web data stream on your behalf.', $data );
		$this->assertEquals( 'missing_required_scopes', $data->get_error_code() );
		$this->assertEquals(
			array(
				'scopes' => array(
					'https://www.googleapis.com/auth/analytics.edit',
				),
				'status' => 403,
			),
			$data->get_error_data( 'missing_required_scopes' )
		);

		// Grant EDIT_SCOPE so request doesn't fail.
		$this->grant_scope( Analytics_4::EDIT_SCOPE );

		// Call set_data with no parameters.
		$data = $this->analytics->set_data(
			'enhanced-measurement-settings',
			array()
		);

		// Verify that the propertyID is required.
		$this->assertWPErrorWithMessage( 'Request parameter is empty: propertyID.', $data );
		$this->assertEquals( 'missing_required_param', $data->get_error_code() );
		$this->assertEquals( array( 'status' => 400 ), $data->get_error_data( 'missing_required_param' ) );

		// Call set_data with only the propertyID parameter.
		$data = $this->analytics->set_data(
			'enhanced-measurement-settings',
			array(
				'propertyID' => '123456789',
			)
		);

		// Verify that the webDataStreamID is required.
		$this->assertWPErrorWithMessage( 'Request parameter is empty: webDataStreamID.', $data );
		$this->assertEquals( 'missing_required_param', $data->get_error_code() );
		$this->assertEquals( array( 'status' => 400 ), $data->get_error_data( 'missing_required_param' ) );

		// Call set_data with only propertyID and webDataStreamID parameters.
		$data = $this->analytics->set_data(
			'enhanced-measurement-settings',
			array(
				'propertyID'      => '123456789',
				'webDataStreamID' => '654321',
			)
		);

		// Verify that the enhancedMeasurementSettings object is required.
		$this->assertWPErrorWithMessage( 'Request parameter is empty: enhancedMeasurementSettings.', $data );
		$this->assertEquals( 'missing_required_param', $data->get_error_code() );
		$this->assertEquals( array( 'status' => 400 ), $data->get_error_data( 'missing_required_param' ) );

		// Call set_data with invalid enhancedMeasurementSettings fields.
		$data = $this->analytics->set_data(
			'enhanced-measurement-settings',
			array(
				'propertyID'                  => '123456789',
				'webDataStreamID'             => '654321',
				'enhancedMeasurementSettings' => array(
					'invalidField' => 'invalidValue',
				),
			)
		);

		// Verify that the enhancedMeasurementSettings object is required.
		$this->assertWPErrorWithMessage( 'Invalid properties in enhancedMeasurementSettings: invalidField.', $data );
		$this->assertEquals( 'invalid_property_name', $data->get_error_code() );
		$this->assertEquals( array( 'status' => 400 ), $data->get_error_data( 'invalid_property_name' ) );
	}

	public function test_set_enhanced_measurement_settings() {
		$property_id        = '123456789';
		$web_data_stream_id = '654321';

		FakeHttp::fake_google_http_handler(
			$this->analytics->get_client(),
			$this->create_enhanced_measurement_fake_http_handler( $property_id, $web_data_stream_id )
		);
		$this->analytics->register();
		$this->grant_scope( Analytics_4::EDIT_SCOPE );

		$response = $this->analytics->set_data(
			'enhanced-measurement-settings',
			array(
				'propertyID'                  => '123456789',
				'webDataStreamID'             => '654321',
				'enhancedMeasurementSettings' => array(
					'streamEnabled' => true,
				),
			)
		);

		// Assert request was made with expected arguments.
		$this->assertNotWPError( $response );

		$response_array = (array) $response;

		// Assert that the keys exist.
		$keys = array(
			'fileDownloadsEnabled',
			'name',
			'outboundClicksEnabled',
			'pageChangesEnabled',
			'scrollsEnabled',
			'searchQueryParameter',
			'siteSearchEnabled',
			'streamEnabled',
			'uriQueryParameter',
			'videoEngagementEnabled',
		);

		foreach ( $keys as $key ) {
			$this->assertArrayHasKey( $key, $response_array );
		}

		// Verify the enhanced measurement settings are returned by checking a field value.
		$this->assertEquals( true, $response_array['streamEnabled'] );

		// Verify the request URL and params were correctly generated.
		$this->assertCount( 1, $this->request_handler_calls );

		$request_url = $this->request_handler_calls[0]['url'];

		$this->assertEquals( 'analyticsadmin.googleapis.com', $request_url['host'] );
		$this->assertEquals( "/v1alpha/properties/$property_id/dataStreams/$web_data_stream_id/enhancedMeasurementSettings", $request_url['path'] );
	}

	public function test_create_custom_dimension__required_params() {
		$property_id = '123456789';

		$this->fake_handler_and_invoke_register_method( $property_id );

		// Call set_data without EDIT_SCOPE.
		$data = $this->analytics->set_data(
			'create-custom-dimension',
			array(
				'propertyID'      => $property_id,
				'customDimension' => array(
					'description'                => 'Test Custom Dimension Description',
					'disallowAdsPersonalization' => false,
					'displayName'                => 'Test Custom Dimension',
					'parameterName'              => 'googlesitekit_post_author',
					'scope'                      => 'EVENT',
				),
			)
		);

		// Verify that the EDIT_SCOPE is required.
		$this->assertWPErrorWithMessage( 'You’ll need to grant Site Kit permission to create a new Analytics custom dimension on your behalf.', $data );
		$this->assertEquals( 'missing_required_scopes', $data->get_error_code() );
		$this->assertEquals(
			array(
				'scopes' => array(
					'https://www.googleapis.com/auth/analytics.edit',
				),
				'status' => 403,
			),
			$data->get_error_data( 'missing_required_scopes' )
		);

		// Grant EDIT_SCOPE so request doesn't fail.
		$this->grant_scope( Analytics_4::EDIT_SCOPE );

		// Call set_data with no parameters.
		$data = $this->analytics->set_data(
			'create-custom-dimension',
			array()
		);

		// Verify that the propertyID is required.
		$this->assertWPErrorWithMessage( 'Request parameter is empty: propertyID.', $data );
		$this->assertEquals( 'missing_required_param', $data->get_error_code() );
		$this->assertEquals( array( 'status' => 400 ), $data->get_error_data( 'missing_required_param' ) );

		// Call set_data with only the propertyID parameter.
		$data = $this->analytics->set_data(
			'create-custom-dimension',
			array(
				'propertyID' => $property_id,
			)
		);

		// Verify that the customDimension object is required.
		$this->assertWPErrorWithMessage( 'Request parameter is empty: customDimension.', $data );
		$this->assertEquals( 'missing_required_param', $data->get_error_code() );
		$this->assertEquals( array( 'status' => 400 ), $data->get_error_data( 'missing_required_param' ) );

		// Call set_data with invalid customDimension fields.
		$data = $this->analytics->set_data(
			'create-custom-dimension',
			array(
				'propertyID'      => $property_id,
				'customDimension' => array(
					'invalidField' => 'invalidValue',
				),
			)
		);

		// Verify that the keys are valid for the customDimension object.
		$this->assertWPErrorWithMessage( 'Invalid properties in customDimension: invalidField.', $data );
		$this->assertEquals( 'invalid_property_name', $data->get_error_code() );
		$this->assertEquals( array( 'status' => 400 ), $data->get_error_data( 'invalid_property_name' ) );

		// Call set_data with invalid scope.
		$data = $this->analytics->set_data(
			'create-custom-dimension',
			array(
				'propertyID'      => $property_id,
				'customDimension' => array(
					'description'                => 'Test Custom Dimension Description',
					'disallowAdsPersonalization' => false,
					'displayName'                => 'Test Custom Dimension',
					'parameterName'              => 'googlesitekit_post_author',
					'scope'                      => 'invalidValue',
				),
			)
		);

		// Verify that scope has a valid value.
		$this->assertWPErrorWithMessage( 'Invalid scope: invalidValue.', $data );
		$this->assertEquals( 'invalid_scope', $data->get_error_code() );
		$this->assertEquals( array( 'status' => 400 ), $data->get_error_data( 'invalid_scope' ) );
	}

	public function test_create_custom_dimension() {
		$property_id = '123456789';

		$this->fake_handler_and_invoke_register_method( $property_id );

		$this->grant_scope( Analytics_4::EDIT_SCOPE );

		$custom_dimension = array(
			'description'                => 'Test Custom Dimension Description',
			'disallowAdsPersonalization' => false,
			'displayName'                => 'Test Custom Dimension',
			'parameterName'              => 'googlesitekit_post_author',
			'scope'                      => 'EVENT',
		);

		$response = $this->analytics->set_data(
			'create-custom-dimension',
			array(
				'propertyID'      => $property_id,
				'customDimension' => $custom_dimension,
			)
		);

		$this->assertNotWPError( $response );

		$response_array = (array) $response;

		// Assert that the keys exist.
		$keys = array_keys( $custom_dimension );

		foreach ( $keys as $key ) {
			$this->assertArrayHasKey( $key, $response_array );
		}

		// Validate the response against the expected mock value.
		foreach ( $custom_dimension as $key => $value ) {
			$this->assertEquals( $value, $response_array[ $key ] );
		}

		// Verify the request URL and params were correctly generated.
		$this->assertCount( 1, $this->request_handler_calls );

		$request_url = $this->request_handler_calls[0]['url'];

		$this->assertEquals( 'analyticsadmin.googleapis.com', $request_url['host'] );
		$this->assertEquals( "/v1beta/properties/$property_id/customDimensions", $request_url['path'] );
	}

	public function test_create_custom_dimension__without_optional_fields() {
		$property_id = '123456789';

		// Create a custom dimension with only the required fields present.
		$raw_custom_dimension = array(
			'displayName'   => 'Test Custom Dimension',
			'parameterName' => 'googlesitekit_post_author',
			'scope'         => 'EVENT',
		);

		$this->fake_handler_and_invoke_register_method(
			$property_id,
			function ( Request $request ) use ( $raw_custom_dimension, $property_id ) {
				$url = parse_url( $request->getUri() );
				if ( "/v1beta/properties/$property_id/customDimensions" === $url['path'] ) {
					$custom_dimension = new GoogleAnalyticsAdminV1betaCustomDimension( $raw_custom_dimension );
					return new Response(
						200,
						array(),
						json_encode( $custom_dimension )
					);
				}
				return new Response( 200 );
			}
		);

		$this->grant_scope( Analytics_4::EDIT_SCOPE );

		$response = $this->analytics->set_data(
			'create-custom-dimension',
			array(
				'propertyID'      => $property_id,
				'customDimension' => $raw_custom_dimension,
			)
		);

		$this->assertNotWPError( $response );
		$this->assertEquals( $raw_custom_dimension, (array) $response->toSimpleObject() );
	}

	public function test_sync_custom_dimensions() {
		$property_id = 'sync-custom-dimension-property-id';

		$this->analytics->get_settings()->merge(
			array(
				'propertyID' => $property_id,
			)
		);

		FakeHttp::fake_google_http_handler(
			$this->analytics->get_client(),
			$this->create_sync_custom_dimensions_fake_http_handler( $property_id )
		);
		$this->analytics->register();
		$this->grant_scope( Analytics_4::READONLY_SCOPE );

		$response = $this->analytics->set_data(
			'sync-custom-dimensions',
			array()
		);

		$this->assertNotWPError( $response );

		// Verify the response is an array of custom dimension names.
		$this->assertEquals( array( 'googlesitekit_dimension1', 'googlesitekit_dimension2' ), $response );

		// Verify the request URL and params were correctly generated.
		$this->assertCount( 1, $this->request_handler_calls );

		$request_url = $this->request_handler_calls[0]['url'];

		$this->assertEquals( 'analyticsadmin.googleapis.com', $request_url['host'] );
		$this->assertEquals( "/v1beta/properties/$property_id/customDimensions", $request_url['path'] );
	}

	/**
	 * Returns a date string for the given number of days ago.
	 *
	 * @param int $days_ago The number of days ago.
	 * @return string The date string, formatted as YYYY-MM-DD.
	 */
	protected function days_ago_date_string( $days_ago ) {
		return gmdate( 'Y-m-d', strtotime( $days_ago . ' days ago' ) );
	}

	/**
	 * Sets the shareable metrics for the Analytics_4 module.
	 *
	 * @param string[] $metrics The metrics to set.
	 */
	protected function set_shareable_metrics( ...$metrics ) {
		add_filter(
			'googlesitekit_shareable_analytics_4_metrics',
			function () use ( $metrics ) {
				return $metrics;
			}
		);
	}

	/**
	 * Sets the shareable dimensions for the Analytics_4 module.
	 *
	 * @param string[] $dimensions The dimensions to set.
	 */
	protected function set_shareable_dimensions( ...$dimensions ) {
		add_filter(
			'googlesitekit_shareable_analytics_4_dimensions',
			function () use ( $dimensions ) {
				return $dimensions;
			}
		);
	}

	/**
	 * Creates a fake HTTP handler with call tracking.
	 *
	 * @param string $property_id The GA4 property ID to use.
	 * @param Closure $local_request_handler [optional] A handler to use for local requests.
	 * @return Closure The fake HTTP client.
	 */
	protected function create_fake_http_handler( $property_id, $local_request_handler = null ) {
		$this->request_handler_calls = array();

		return function ( Request $request ) use ( $property_id, $local_request_handler ) {
			$url    = parse_url( $request->getUri() );
			$params = json_decode( (string) $request->getBody(), true );

			$this->request_handler_calls[] = array(
				'url'    => $url,
				'params' => $params,
			);

			if (
				! in_array(
					$url['host'],
					array( 'analyticsdata.googleapis.com', 'analyticsadmin.googleapis.com' ),
					true
				)
			) {
				return new Response( 200 );
			}

			if ( is_callable( $local_request_handler ) ) {
				return $local_request_handler( $request );
			}

			switch ( $url['path'] ) {
				case "/v1beta/properties/$property_id:runReport":
					// Return a mock report.
					return new Response(
						200,
						array(),
						json_encode(
							array(
								'kind' => 'analyticsData#runReport',
								array(
									'rows' => array(
										array(
											'metricValues' => array(
												array(
													'value' => 'some-value',
												),
											),
										),
									),
								),
							)
						)
					);

				case "/v1beta/properties/$property_id:runPivotReport":
					// Return a mock pivot report.
					return new Response(
						200,
						array(),
						json_encode(
							array(
								'kind' => 'analyticsData#runPivotReport',
								array(
									'rows' => array(
										array(
											'metricValues' => array(
												array(
													'value' => 'some-value',
												),
											),
										),
									),
								),
							)
						)
					);

				case "/v1beta/properties/$property_id/conversionEvents":
					$conversion_event = new GoogleAnalyticsAdminV1betaConversionEvent();
					$conversion_event->setName( "properties/$property_id/conversionEvents/some-name" );
					$conversion_event->setEventName( 'some-event' );

					$conversion_events = new GoogleAnalyticsAdminV1betaListConversionEventsResponse();
					$conversion_events->setConversionEvents( array( $conversion_event ) );

					return new Response(
						200,
						array(),
						json_encode( $conversion_events )
					);

				case "/v1beta/properties/$property_id/customDimensions":
					$custom_dimension = new GoogleAnalyticsAdminV1betaCustomDimension();
					$custom_dimension->setParameterName( 'googlesitekit_post_author' );
					$custom_dimension->setDisplayName( 'Test Custom Dimension' );
					$custom_dimension->setDescription( 'Test Custom Dimension Description' );
					$custom_dimension->setScope( 'EVENT' );
					$custom_dimension->setDisallowAdsPersonalization( false );

					return new Response(
						200,
						array(),
						json_encode( $custom_dimension )
					);

				case "/v1alpha/properties/$property_id/audiences":
					$fixture = json_decode(
						file_get_contents( GOOGLESITEKIT_PLUGIN_DIR_PATH . 'assets/js/modules/analytics-4/datastore/__fixtures__/audiences.json' ),
						true
					);

					$audiences = new GoogleAnalyticsAdminV1alphaListAudiencesResponse();
					$audiences->setAudiences( $fixture );

					return new Response(
						200,
						array(),
						json_encode( $audiences )
					);

				default:
					return new Response( 200 );
			}
		};
	}

	/**
	 * Creates a fake HTTP handler with call tracking for sync custom dimensions.
	 *
	 * @param string $property_id The GA4 property ID to use.
	 * @return Closure The fake HTTP client.
	 */
	protected function create_sync_custom_dimensions_fake_http_handler( $property_id ) {
		$this->request_handler_calls = array();

		return function ( Request $request ) use ( $property_id ) {
			$url    = parse_url( $request->getUri() );
			$params = json_decode( (string) $request->getBody(), true );

			$this->request_handler_calls[] = array(
				'url'    => $url,
				'params' => $params,
			);

			if (
				! in_array(
					$url['host'],
					array( 'analyticsdata.googleapis.com', 'analyticsadmin.googleapis.com' ),
					true
				)
			) {
				return new Response( 200 );
			}

			switch ( $url['path'] ) {
				case "/v1beta/properties/$property_id/customDimensions":
					$custom_dimension1 = new GoogleAnalyticsAdminV1betaCustomDimension();
					$custom_dimension1->setParameterName( 'googlesitekit_dimension1' );
					$custom_dimension1->setDisplayName( 'Test Custom Dimension' );
					$custom_dimension1->setDescription( 'Test Custom Dimension Description' );
					$custom_dimension1->setScope( 'EVENT' );
					$custom_dimension1->setDisallowAdsPersonalization( false );

					$custom_dimension2 = new GoogleAnalyticsAdminV1betaCustomDimension();
					$custom_dimension2->setParameterName( 'googlesitekit_dimension2' );
					$custom_dimension2->setDisplayName( 'Test Custom Dimension 2' );
					$custom_dimension2->setDescription( 'Test Custom Dimension Description 2' );
					$custom_dimension2->setScope( 'EVENT' );
					$custom_dimension2->setDisallowAdsPersonalization( false );

					$custom_dimensions = new GoogleAnalyticsAdminV1betaListCustomDimensionsResponse();
					$custom_dimensions->setCustomDimensions( array( $custom_dimension1, $custom_dimension2 ) );

					return new Response(
						200,
						array(),
						json_encode( $custom_dimensions )
					);

				default:
					return new Response( 200 );
			}
		};
	}


	/**
	 * Creates a fake HTTP handler with call tracking for enhanced measurement settings.
	 *
	 * @param string $property_id The GA4 property ID to use.
	 * @param string $web_data_stream_id The GA4 web data stream ID to use.
	 * @return Closure The fake HTTP client.
	 */
	public function create_enhanced_measurement_fake_http_handler( $property_id, $web_data_stream_id ) {
		$this->request_handler_calls = array();

		return function ( Request $request ) use ( $property_id, $web_data_stream_id ) {
			$url    = parse_url( $request->getUri() );
			$params = json_decode( (string) $request->getBody(), true );

			$this->request_handler_calls[] = array(
				'url'    => $url,
				'params' => $params,
			);

			if (
				! in_array(
					$url['host'],
					array( 'analyticsdata.googleapis.com', 'analyticsadmin.googleapis.com' ),
					true
				)
			) {
				return new Response( 200 );
			}

			switch ( $url['path'] ) {
				case "/v1alpha/properties/$property_id/dataStreams/$web_data_stream_id/enhancedMeasurementSettings":
					$enhanced_measurement_settings = new EnhancedMeasurementSettingsModel();
					$enhanced_measurement_settings->setStreamEnabled( true );

					return new Response(
						200,
						array(),
						json_encode( $enhanced_measurement_settings )
					);

				default:
					return new Response( 200 );
			}
		};
	}


	/**
	 * Metrics and dimensions are only validated when using shared credentials. This helper method sets up the shared credentials scenario.
	 */
	protected function enable_shared_credentials() {
		// Create a user to set as the Analytics 4 module owner.
		$admin = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );

		$this->set_user_access_token( $admin->ID, 'valid-auth-token' );

		// Ensure the new user has the necessary scopes to make the request.
		$restore_user = $this->user_options->switch_user( $admin->ID );
		$this->authentication->get_oauth_client()->set_granted_scopes(
			$this->analytics->get_scopes()
		);
		$restore_user();

		// Ensure admin user has Permissions::MANAGE_OPTIONS cap regardless of authentication.
		$permssions_callback = function ( $caps, $cap ) {
			if ( Permissions::MANAGE_OPTIONS === $cap ) {
				return array( 'manage_options' );
			}
			return $caps;
		};

		add_filter( 'map_meta_cap', $permssions_callback, 99, 2 );
		wp_set_current_user( $admin->ID );

		// Ensure the Analytics 4 module is connected and the owner ID is set.
		delete_option( Settings::OPTION );

		$analytics_4_settings = new Settings( $this->options );
		$analytics_4_settings->register();
		$analytics_4_settings->merge(
			array(
				'accountID'       => '100',
				'propertyID'      => '123',
				'webDataStreamID' => '456',
				'measurementID'   => 'G-789',
				'ownerID'         => $admin->ID,
			)
		);

		remove_filter( 'map_meta_cap', $permssions_callback, 99, 2 );
		wp_set_current_user( $this->user->ID );

		// Ensure sharing is enabled for the Analytics 4 module.
		add_option(
			Module_Sharing_Settings::OPTION,
			array(
				'analytics-4' => array(
					'sharedRoles' => $this->user->roles,
					'management'  => 'owner',
				),
			)
		);
	}

	/**
	 * Provides data for testing access states.
	 *
	 * @return array
	 */
	public function data_access_token() {
		return array(
			'unauthenticated user' => array( '' ),
			'authenticated user'   => array( 'valid-auth-token' ),
		);
	}

	/**
	 * Sets up user authentication if an access token is provided.
	 *
	 * @param string $access_token The access token to use.
	 * @param int    [$user_id] The user ID to set up authentication for. Will default to the current user.
	 */
	protected function setup_user_authentication( $access_token, $user_id = null ) {
		if ( empty( $access_token ) ) {
			return;
		}

		if ( empty( $user_id ) ) {
			$user_id = $this->user->ID;
		}

		$this->set_user_access_token( $user_id, $access_token );
	}

	/**
	 * @dataProvider tracking_disabled_provider
	 *
	 * @param array $settings
	 * @param bool $logged_in
	 * @param \Closure $assert_opt_out_presence
	 * @param bool $is_content_creator
	 */
	public function test_tracking_opt_out_snippet( $settings, $logged_in, $is_tracking_active, $is_content_creator = false ) {
		wp_scripts()->registered = array();
		wp_scripts()->queue      = array();
		wp_scripts()->done       = array();
		wp_styles(); // Prevent potential ->queue of non-object error.

		// Remove irrelevant script from throwing errors in CI from readfile().
		remove_action( 'wp_head', 'print_emoji_detection_script', 7 );

		// Prevent test from failing in CI with deprecation notice.
		remove_action( 'wp_print_styles', 'print_emoji_styles' );

		// Set the current user (can be 0 for no user)
		$role = $is_content_creator ? 'administrator' : 'subscriber';
		$user = $logged_in ?
			$this->factory()->user->create( array( 'role' => $role ) )
			: 0;
		wp_set_current_user( $user );

		$analytics = new Analytics_4( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$analytics->get_settings()->set( $settings );

		remove_all_actions( 'template_redirect' );
		remove_all_actions( 'googlesitekit_setup_gtag' );
		$analytics->register();
		do_action( 'template_redirect' );

		$head_html = $this->capture_action( 'wp_head' );
		// Confidence check.
		$this->assertNotEmpty( $head_html );

		// Whether or not tracking is disabled should not affect the output of the GA4 snippet.
		if ( $settings['measurementID'] && $settings['googleTagID'] && $settings['useSnippet'] ) {
			$this->assertStringContainsString( "id={$settings['googleTagID']}", $head_html );
		} elseif ( $settings['measurementID'] && ! $settings['googleTagID'] && $settings['useSnippet'] ) {
			$this->assertStringContainsString( "id={$settings['measurementID']}", $head_html );
		} else {
			$this->assertStringNotContainsString( "id={$settings['googleTagID']}", $head_html );
		}

		if ( ! $settings['measurementID'] ) {
			$this->assertStringNotContainsString( 'ga-disable', $head_html );
		}

		if ( $is_tracking_active ) {
			// When tracking is active, the opt out snippet should not be present.
			$this->assertStringNotContainsString( 'ga-disable', $head_html );

			// When tracking is active, the `googlesitekit_analytics_tracking_opt_out` action should not be called.
			$this->assertEquals( 0, did_action( 'googlesitekit_analytics_tracking_opt_out' ) );
		} else {
			if ( empty( $settings['measurementID'] ) ) {
				// When measurementID is not set, the opt out snippet should not be present.
				$this->assertStringNotContainsString( 'ga-disable', $head_html );
			} else {
				// When tracking is disabled and measurementID is set, the opt out snippet should be present.
				// Ensure the opt-out snippet contains the configured measurement ID (not GT tag) when it is set.
				$this->assertStringContainsString( 'window["ga-disable-' . $settings['measurementID'] . '"] = true', $head_html );
			}

			// When tracking is disabled, the `googlesitekit_analytics_tracking_opt_out` action should be called.
			$this->assertEquals( 1, did_action( 'googlesitekit_analytics_tracking_opt_out' ) );
		}
	}

	public function tracking_disabled_provider() {
		$base_settings = array(
			'accountID'        => '12345678',
			'propertyID'       => '987654321',
			'webDataStreamID'  => '1234567890',
			'measurementID'    => 'G-12345678',
			'googleTagID'      => 'GT-12345678',
			'useSnippet'       => true,
			'trackingDisabled' => array( 'loggedinUsers' ),
		);

		return array(
			// Tracking should be active by default for non-logged-in users.
			array(
				$base_settings,
				false,
				true,
			),
			// Tracking is not active for non-logged-in users if snippet is disabled,
			// but opt-out is not added because tracking is not disabled.
			array(
				array_merge( $base_settings, array( 'useSnippet' => false ) ),
				false,
				true,
			),
			// Tracking is not active for logged-in users by default (opt-out expected).
			array(
				$base_settings,
				true,
				false,
			),
			// Tracking is active for logged-in users if enabled via settings.
			array(
				array_merge( $base_settings, array( 'trackingDisabled' => array() ) ),
				true,
				true,
			),
			// Tracking is not active for content creators if disabled via settings.
			array(
				array_merge( $base_settings, array( 'trackingDisabled' => array( 'contentCreators' ) ) ),
				true,
				false,
				true,
			),
			// Tracking is still active for guests if disabled for logged in users.
			array(
				array_merge( $base_settings, array( 'trackingDisabled' => array( 'loggedinUsers' ) ) ),
				false,
				true,
			),
			// Tracking is not active for content creators if disabled for logged-in users (logged-in users setting overrides content creators setting)
			array(
				array_merge( $base_settings, array( 'trackingDisabled' => array( 'loggedinUsers' ) ) ),
				true,
				false,
				true,
			),
			// Analytics is enabled and tracking is disabled for logged-in users but property is not configured
			array(
				array_merge(
					$base_settings,
					array(
						'trackingDisabled' => array( 'loggedinUsers' ),
						'measurementID'    => '',
					)
				),
				true,
				false,
				true,
			),
			// Analytics is enabled but not configured.
			array(
				array_merge( $base_settings, array( 'measurementID' => '' ) ),
				false,
				true,
			),
			// Ensure the opt-out snippet contains the configured measurement ID when it is set and the google tag ID is empty.
			array(
				array_merge( $base_settings, array( 'googleTagID' => '' ) ),
				false,
				true,
			),
		);
	}

	public function test_register_allow_tracking_disabled() {
		remove_all_filters( 'googlesitekit_allow_tracking_disabled' );
		$this->assertFalse( has_filter( 'googlesitekit_allow_tracking_disabled' ) );

		$this->analytics->register();

		$this->assertTrue( has_filter( 'googlesitekit_allow_tracking_disabled' ) );
	}

	public function test_allow_tracking_disabled() {
		remove_all_filters( 'googlesitekit_allow_tracking_disabled' );
		$this->analytics->register();

		// Ensure disabling tracking is allowed when the snippet is used.
		$this->assertTrue( $this->analytics->get_settings()->get()['useSnippet'] );
		$this->assertTrue( apply_filters( 'googlesitekit_allow_tracking_disabled', false ) );

		$settings = array(
			'useSnippet' => false,
		);

		$this->analytics->get_settings()->merge( $settings );

		// Ensure disabling tracking is disallowed when the snippet is not used.
		$this->assertFalse( apply_filters( 'googlesitekit_allow_tracking_disabled', false ) );

		// Ensure disabling tracking does not change if its already allowed.
		$this->assertTrue( apply_filters( 'googlesitekit_allow_tracking_disabled', true ) );
	}

	public function test_get_custom_dimensions_data() {
		global $wp_query;

		$settings = array(
			'availableCustomDimensions' => array(
				'googlesitekit_post_author',
				'googlesitekit_post_type',
				'googlesitekit_post_categories',
				'googlesitekit_post_date',
			),
		);

		$method = new ReflectionMethod( Analytics_4::class, 'get_custom_dimensions_data' );
		$method->setAccessible( true );

		// Returns an empty array if the current page type is not singular.
		$wp_query = new WP_Query();
		$data     = $method->invoke( $this->analytics );
		$this->assertEmpty( $data );

		// Ensure the `'googlesitekit_post_categories'` key is not present
		// if the page does not return categories or encounters an error
		// retrieving categories.
		$this->assertFalse( array_key_exists( 'googlesitekit_post_categories', $data ) );

		// Change the current page to be singular.
		$category1_id = $this->factory()->category->create( array( 'name' => 'Category 1' ) );
		$category3_id = $this->factory()->category->create( array( 'name' => 'Category 3' ) );

		$post_type = 'test-post-type';
		$post_id   = $this->factory()->post->create( array( 'post_type' => $post_type ) );
		wp_set_post_categories( $post_id, array( $category1_id, $category3_id ) );

		$wp_query->is_singular    = true;
		$wp_query->queried_object = get_post( $post_id );

		$hook = function ( $post_types ) use ( $post_type ) {
			return array_merge( $post_types, array( $post_type ) );
		};

		// Returns an empty array if no custom dimensions are added to settings.
		$data = $method->invoke( $this->analytics );
		$this->assertEmpty( $data );

		// Returns only post type if the queried object is not in the allowed post types list.
		$this->analytics->get_settings()->merge( $settings );
		$data = $method->invoke( $this->analytics );
		$this->assertEquals( array( 'googlesitekit_post_type' => $post_type ), $data );

		// Returns correct data when all conditions are met.
		add_filter( 'googlesitekit_custom_dimension_valid_post_types', $hook );
		$data = $method->invoke( $this->analytics );

		$author = wp_get_current_user();

		$this->assertEquals(
			array(
				'googlesitekit_post_author'     => $author->display_name,
				'googlesitekit_post_type'       => $post_type,
				'googlesitekit_post_date'       => get_the_date( 'Ymd', $wp_query->queried_object ),
				'googlesitekit_post_categories' => 'Category 1; Category 3',
			),
			$data
		);
	}

	public function test_inline_custom_dimension_data_initial_state__module_not_connected() {
		$this->analytics->register();

		$inline_modules_data = apply_filters( 'googlesitekit_inline_modules_data', array() );

		$this->assertArrayNotHasKey( 'analytics-4', $inline_modules_data );
	}

	public function test_inline_custom_dimension_data_initial_state__module_connected() {
		$this->analytics->register();

		// Ensure the module is connected.
		$options = new Options( $this->context );
		$options->set(
			Settings::OPTION,
			array(
				'accountID'       => '12345678',
				'propertyID'      => '987654321',
				'webDataStreamID' => '1234567890',
				'measurementID'   => 'A1B2C3D4E5',
			)
		);

		$inline_modules_data = apply_filters( 'googlesitekit_inline_modules_data', array() );

		$this->assertArrayHasKey( 'customDimensionsDataAvailable', $inline_modules_data['analytics-4'] );

		$this->assertEquals(
			array(
				'googlesitekit_post_author'     => false,
				'googlesitekit_post_type'       => false,
				'googlesitekit_post_date'       => false,
				'googlesitekit_post_categories' => false,
			),
			$inline_modules_data['analytics-4']['customDimensionsDataAvailable']
		);
	}

	public function test_inline_module_data__audienceSegmentation() {

		// Ensure the module is connected.
		$this->analytics->get_settings()->merge(
			array(
				'accountID'       => '12345678',
				'webDataStreamID' => '1234567890',
				'propertyID'      => '12345678',
				'measurementID'   => 'A1B2C3D4E5',
			)
		);

		$this->analytics->register();

		$inline_modules_data = apply_filters( 'googlesitekit_inline_modules_data', array() );

		$this->assertArrayHasKey( 'analytics-4', $inline_modules_data );
		$this->assertArrayHasKey( 'resourceAvailabilityDates', $inline_modules_data['analytics-4'] );

		$this->assertEquals(
			array(
				'audience'        => array(),
				'customDimension' => array(),
				'property'        => array(),
			),
			$inline_modules_data['analytics-4']['resourceAvailabilityDates']
		);

		list(
			$test_resource_slug_audience,
			$test_resource_slug_custom_dimension,
			$test_resource_slug_property,
		) = $this->set_test_resource_data_availability_dates();

		$inline_modules_data = apply_filters( 'googlesitekit_inline_modules_data', array() );

		$this->assertEquals(
			array(
				'audience'        => array(
					$test_resource_slug_audience => 20201231,
				),
				'customDimension' => array(
					$test_resource_slug_custom_dimension => 20201231,
				),
				'property'        => array(
					$test_resource_slug_property => 20201231,
				),
			),
			$inline_modules_data['analytics-4']['resourceAvailabilityDates']
		);
	}

	public function test_set_custom_dimension_data_available() {
		$user = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user->ID );
		do_action( 'wp_login', $user->user_login, $user );

		$this->analytics->register();

		// Ensure the module is connected.
		$options = new Options( $this->context );
		$options->set(
			Settings::OPTION,
			array(
				'accountID'       => '12345678',
				'propertyID'      => '987654321',
				'webDataStreamID' => '1234567890',
				'measurementID'   => 'A1B2C3D4E5',
			)
		);

		$this->authentication->get_oauth_client()->set_granted_scopes(
			$this->authentication->get_oauth_client()->get_required_scopes()
		);

		$response = $this->analytics->set_data(
			'custom-dimension-data-available',
			array(
				'customDimension' => 'googlesitekit_post_author',
			)
		);

		$this->assertEquals( true, $response );

		$inline_modules_data = apply_filters( 'googlesitekit_inline_modules_data', array() );

		$this->assertArrayHasKey( 'customDimensionsDataAvailable', $inline_modules_data['analytics-4'] );

		$this->assertEquals(
			array(
				'googlesitekit_post_author'     => true,
				'googlesitekit_post_type'       => false,
				'googlesitekit_post_date'       => false,
				'googlesitekit_post_categories' => false,
			),
			$inline_modules_data['analytics-4']['customDimensionsDataAvailable']
		);
	}

	public function test_custom_dimension_data_available_reset_on_measurement_id_change() {
		$user = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user->ID );
		do_action( 'wp_login', $user->user_login, $user );

		$this->analytics->register();

		// Ensure the module is connected.
		$options = new Options( $this->context );
		$options->set(
			Settings::OPTION,
			array(
				'accountID'       => '12345678',
				'propertyID'      => '987654321',
				'webDataStreamID' => '1234567890',
				'measurementID'   => 'A1B2C3D4E5',
			)
		);

		$this->authentication->get_oauth_client()->set_granted_scopes(
			$this->authentication->get_oauth_client()->get_required_scopes()
		);

		$this->analytics->set_data(
			'custom-dimension-data-available',
			array(
				'customDimension' => 'googlesitekit_post_author',
			)
		);

		$inline_modules_data = apply_filters( 'googlesitekit_inline_modules_data', array() );

		$this->assertArrayHasKey( 'customDimensionsDataAvailable', $inline_modules_data['analytics-4'] );

		$this->assertEquals(
			array(
				'googlesitekit_post_author'     => true,
				'googlesitekit_post_type'       => false,
				'googlesitekit_post_date'       => false,
				'googlesitekit_post_categories' => false,
			),
			$inline_modules_data['analytics-4']['customDimensionsDataAvailable']
		);

		$this->analytics->get_settings()->merge(
			array(
				'measurementID' => 'F6G7H8I9J0',
			)
		);

		$inline_modules_data = apply_filters( 'googlesitekit_inline_modules_data', array() );

		$this->assertArrayHasKey( 'customDimensionsDataAvailable', $inline_modules_data['analytics-4'] );
		$this->assertEquals(
			array(
				'googlesitekit_post_author'     => false,
				'googlesitekit_post_type'       => false,
				'googlesitekit_post_date'       => false,
				'googlesitekit_post_categories' => false,
			),
			$inline_modules_data['analytics-4']['customDimensionsDataAvailable']
		);
	}

	public function test_custom_dimension_data_available_reset_on_deactivation() {
		$user = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user->ID );
		do_action( 'wp_login', $user->user_login, $user );

		$this->analytics->register();

		// Ensure the module is connected.
		$options = new Options( $this->context );
		$options->set(
			Settings::OPTION,
			array(
				'accountID'       => '12345678',
				'propertyID'      => '987654321',
				'webDataStreamID' => '1234567890',
				'measurementID'   => 'A1B2C3D4E5',
			)
		);

		$this->authentication->get_oauth_client()->set_granted_scopes(
			$this->authentication->get_oauth_client()->get_required_scopes()
		);

		$this->analytics->set_data(
			'custom-dimension-data-available',
			array(
				'customDimension' => 'googlesitekit_post_author',
			)
		);

		// In this test, as the inline data won't be available when the module is deactivated,
		// we use a local instance of Custom_Dimensions_Data_Available to verify the state.
		$custom_dimensions_data_available = new Custom_Dimensions_Data_Available( new Transients( $this->context ) );

		$this->assertEquals(
			array(
				'googlesitekit_post_author'     => true,
				'googlesitekit_post_type'       => false,
				'googlesitekit_post_date'       => false,
				'googlesitekit_post_categories' => false,
			),
			$custom_dimensions_data_available->get_data_availability()
		);

		$this->analytics->on_deactivation();

		$this->assertEquals(
			array(
				'googlesitekit_post_author'     => false,
				'googlesitekit_post_type'       => false,
				'googlesitekit_post_date'       => false,
				'googlesitekit_post_categories' => false,
			),
			$custom_dimensions_data_available->get_data_availability()
		);
	}

	public function test_inline_tag_id_mismatch() {
		$this->analytics->register();

		// Ensure the module is connected.
		$options = new Options( $this->context );
		$options->set(
			Settings::OPTION,
			array(
				'accountID'       => '12345678',
				'propertyID'      => '987654321',
				'webDataStreamID' => '1234567890',
				'measurementID'   => 'A1B2C3D4E5',
			)
		);

		$inline_modules_data = apply_filters( 'googlesitekit_inline_modules_data', array() );

		$this->assertEquals( false, $inline_modules_data['analytics-4']['tagIDMismatch'] );
	}

	public function test_inline_tag_id_mismatch__source_correct_value_from_transient() {
		$this->analytics->register();

		// Ensure the module is connected.
		$options = new Options( $this->context );
		$options->set(
			Settings::OPTION,
			array(
				'accountID'       => '12345678',
				'propertyID'      => '987654321',
				'webDataStreamID' => '1234567890',
				'measurementID'   => 'A1B2C3D4E5',
			)
		);

		$inline_modules_data = apply_filters( 'googlesitekit_inline_modules_data', array() );

		$this->assertEquals( false, $inline_modules_data['analytics-4']['tagIDMismatch'] );

		$transients = new Transients( $this->context );
		$transients->set( 'googlesitekit_inline_tag_id_mismatch', true );

		$inline_modules_data = apply_filters( 'googlesitekit_inline_modules_data', array() );

		$this->assertEquals( true, $inline_modules_data['analytics-4']['tagIDMismatch'] );
	}

	public function test_get_data__adsense_links() {
		$user = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user->ID );
		do_action( 'wp_login', $user->user_login, $user );

		$this->authentication->get_oauth_client()->set_granted_scopes(
			$this->analytics->get_scopes()
		);

		FakeHttp::fake_google_http_handler(
			$this->analytics->get_client(),
			function () {
				$mock_adSenseLink = new Google_Service_GoogleAnalyticsAdmin_GoogleAnalyticsAdminV1alphaAdSenseLink();
				$mock_adSenseLink->setName( 'properties/12345/adSenseLinks/12345' );
				$mock_adSenseLink->setAdClientCode( 'ca-pub-12345' );

				$response = new Google_Service_GoogleAnalyticsAdmin_GoogleAnalyticsAdminV1alphaListAdSenseLinksResponse();
				$response->setAdsenseLinks( array( $mock_adSenseLink ) );

				return new Response( 200, array(), json_encode( $response ) );
			}
		);

		// Request without `propertyID` parameter.
		$result = $this->analytics->get_data( 'adsense-links', array() );

		// Should return WP error when `propertyID` is not supplied.
		$this->assertWPErrorWithMessage( 'Request parameter is empty: propertyID.', $result );

		// Request with `propertyID` parameter.
		$result = $this->analytics->get_data( 'adsense-links', array( 'propertyID' => '12345' ) );

		// Should return array with `GoogleAnalyticsAdminV1alphaAdSenseLink` as defined in the mock response.
		$this->assertNotWPError( $result );
		$this->assertContainsOnlyInstancesOf( Google_Service_GoogleAnalyticsAdmin_GoogleAnalyticsAdminV1alphaAdSenseLink::class, $result );
		$adsense_link = $result[0];
		$this->assertEquals( 'properties/12345/adSenseLinks/12345', $adsense_link->getName() );
		$this->assertEquals( 'ca-pub-12345', $adsense_link->getAdClientCode() );
	}

	public function test_set_data__save_resource_data_availability_date() {

		list(
			$test_resource_slug_audience,
			,
			,
			$test_resource_data_availability_transient_audience,
			$test_resource_data_availability_transient_custom_dimension,
			$test_resource_data_availability_transient_property,
		) = $this->set_test_resource_data_availability_dates();

		$this->assertNotFalse( get_transient( $test_resource_data_availability_transient_audience ) );
		$this->assertNotFalse( get_transient( $test_resource_data_availability_transient_custom_dimension ) );
		$this->assertNotFalse( get_transient( $test_resource_data_availability_transient_property ) );

		// Test missing required parameters.
		$data = $this->analytics->set_data(
			'save-resource-data-availability-date',
			array()
		);

		$this->assertWPErrorWithMessage( 'Request parameter is empty: resourceType.', $data );

		$data = $this->analytics->set_data(
			'save-resource-data-availability-date',
			array(
				'resourceType' => Resource_Data_Availability_Date::RESOURCE_TYPE_AUDIENCE,
			)
		);

		$this->assertWPErrorWithMessage( 'Request parameter is empty: resourceSlug.', $data );

		$data = $this->analytics->set_data(
			'save-resource-data-availability-date',
			array(
				'resourceType' => Resource_Data_Availability_Date::RESOURCE_TYPE_AUDIENCE,
				'resourceSlug' => $test_resource_slug_audience,
			)
		);

		$this->assertWPErrorWithMessage( 'Request parameter is empty: date.', $data );

		// Test invalid resource type.
		$data = $this->analytics->set_data(
			'save-resource-data-availability-date',
			array(
				'resourceType' => 'invalid-resource-type',
				'resourceSlug' => $test_resource_slug_audience,
				'date'         => 20201231,
			)
		);

		$this->assertWPErrorWithMessage( 'Invalid parameter: resourceType.', $data );

		// Test invalid resource slug.
		$data = $this->analytics->set_data(
			'save-resource-data-availability-date',
			array(
				'resourceType' => Resource_Data_Availability_Date::RESOURCE_TYPE_AUDIENCE,
				'resourceSlug' => 'invalid-resource-slug',
				'date'         => 20201231,
			)
		);

		$this->assertWPErrorWithMessage( 'Invalid parameter: resourceSlug.', $data );

		// Test invalid date.
		$data = $this->analytics->set_data(
			'save-resource-data-availability-date',
			array(
				'resourceType' => Resource_Data_Availability_Date::RESOURCE_TYPE_AUDIENCE,
				'resourceSlug' => $test_resource_slug_audience,
				'date'         => '20201231',
			)
		);

		$this->assertWPErrorWithMessage( 'Invalid parameter: date.', $data );
	}

	public function test_create_audience__required_scope() {

		$property_id = '123456789';

		$this->fake_handler_and_invoke_register_method( $property_id );

		// Call set_data without EDIT_SCOPE.
		$data = $this->analytics->set_data(
			'create-audience',
			array( 'audience' => $this->get_audience() )
		);

		// Verify that the EDIT_SCOPE is required.
		$this->assertWPErrorWithMessage( 'You’ll need to grant Site Kit permission to create new audiences for your Analytics property on your behalf.', $data );
		$this->assertEquals( 'missing_required_scopes', $data->get_error_code() );
		$this->assertEquals(
			array(
				'scopes' => array(
					'https://www.googleapis.com/auth/analytics.edit',
				),
				'status' => 403,
			),
			$data->get_error_data( 'missing_required_scopes' )
		);
	}

	public function test_create_audience__required_params() {

		$property_id = '123456789';

		$this->fake_handler_and_invoke_register_method( $property_id );

		// Grant EDIT_SCOPE so request doesn't fail.
		$this->grant_scope( Analytics_4::EDIT_SCOPE );

		// Call set_data with no parameters.
		$data = $this->analytics->set_data(
			'create-audience',
			array()
		);

		// Verify that the audience object is required.
		$this->assertWPErrorWithMessage( 'Request parameter is empty: audience.', $data );
		$this->assertEquals( 'missing_required_param', $data->get_error_code() );
		$this->assertEquals( array( 'status' => 400 ), $data->get_error_data( 'missing_required_param' ) );
	}

	public function test_create_audience__valid_audience_keys() {

		$property_id = '123456789';

		$this->fake_handler_and_invoke_register_method( $property_id );

		// Grant EDIT_SCOPE so request doesn't fail.
		$this->grant_scope( Analytics_4::EDIT_SCOPE );

		$audience                             = array( 'audience' => $this->get_audience() );
		$audience['audience']['invalidField'] = 'invalidValue';

		// Call set_data with invalid audience field.
		$data = $this->analytics->set_data(
			'create-audience',
			$audience
		);

		// Verify that the keys are valid for the audience object.
		$this->assertWPErrorWithMessage( 'Invalid properties in audience: invalidField.', $data );
		$this->assertEquals( 'invalid_property_name', $data->get_error_code() );
		$this->assertEquals( array( 'status' => 400 ), $data->get_error_data( 'invalid_property_name' ) );
	}

	public function get_audience() {
		return array(
			'displayName'            => 'Recently active users',
			'description'            => 'Users that have been active in a recent period',
			'membershipDurationDays' => 30,
			'filterClauses'          => array(
				array(
					'clauseType'   => 'INCLUDE',
					'simpleFilter' => array(
						'scope'            => 'AUDIENCE_FILTER_SCOPE_ACROSS_ALL_SESSIONS',
						'filterExpression' => array(
							'andGroup' => array(
								'filterExpressions' => array(
									array(
										'orGroup' => array(
											'filterExpressions' => array(
												array(
													'dimensionOrMetricFilter' => array(
														'atAnyPointInTime' => null,
														'fieldName' => 'newVsReturning',
														'inAnyNDayPeriod' => null,
														'stringFilter' => array(
															'caseSensitive' => null,
															'matchType' => 'EXACT',
															'value' => 'new',
														),
													),
												),
											),
										),
									),
								),
							),
						),
					),
				),
			),
		);
	}

	/**
	 * @dataProvider data_access_token
	 */
	public function data_available_audiences( $access_token ) {
		$raw_audiences = json_decode(
			file_get_contents( GOOGLESITEKIT_PLUGIN_DIR_PATH . 'assets/js/modules/analytics-4/datastore/__fixtures__/audiences.json' ),
			true
		);

		$available_audiences = json_decode(
			file_get_contents( GOOGLESITEKIT_PLUGIN_DIR_PATH . 'assets/js/modules/analytics-4/datastore/__fixtures__/available-audiences.json' ),
			true
		);

		$raw_audience_default_all_users           = $raw_audiences[0];
		$raw_audience_default_purchasers          = $raw_audiences[1];
		$raw_audience_site_kit_new_visitors       = $raw_audiences[2];
		$raw_audience_site_kit_returning_visitors = $raw_audiences[3];
		$raw_audience_user_test                   = $raw_audiences[4];

		$available_audience_default_all_users           = $available_audiences[0];
		$available_audience_default_purchasers          = $available_audiences[1];
		$available_audience_site_kit_new_visitors       = $available_audiences[2];
		$available_audience_site_kit_returning_visitors = $available_audiences[3];
		$available_audience_user_test                   = $available_audiences[4];

		return array(
			'Site Kit audiences in correct order'   => array(
				$access_token,
				array(
					'raw_audiences'                => array(
						$raw_audience_site_kit_new_visitors,
						$raw_audience_site_kit_returning_visitors,
					),
					'expected_available_audiences' => array(
						$available_audience_site_kit_new_visitors,
						$available_audience_site_kit_returning_visitors,
					),
				),
			),
			'Site Kit audiences in incorrect order' => array(
				$access_token,
				array(
					'raw_audiences'                => array(
						$raw_audience_site_kit_returning_visitors,
						$raw_audience_site_kit_new_visitors,
					),
					'expected_available_audiences' => array(
						$available_audience_site_kit_new_visitors,
						$available_audience_site_kit_returning_visitors,
					),
				),
			),
			'default audiences, case 1'             => array(
				$access_token,
				array(
					'raw_audiences'                => array(
						$raw_audience_default_all_users,
						$raw_audience_default_purchasers,
					),
					// As the audiences are of the same type, and not Site Kit-created audiences, they should be returned in the order returned by the API.
					'expected_available_audiences' => array(
						$available_audience_default_all_users,
						$available_audience_default_purchasers,
					),
				),
			),
			'default audiences, case 2'             => array(
				$access_token,
				array(
					'raw_audiences'                => array(
						$raw_audience_default_purchasers,
						$raw_audience_default_all_users,
					),
					'expected_available_audiences' => array(
						$available_audience_default_purchasers,
						$available_audience_default_all_users,
					),
				),
			),
			'all audiences, case 1'                 => array(
				$access_token,
				array(
					'raw_audiences'                => array(
						$raw_audience_user_test,
						$raw_audience_site_kit_new_visitors,
						$raw_audience_site_kit_returning_visitors,
						$raw_audience_default_all_users,
						$raw_audience_default_purchasers,
					),
					'expected_available_audiences' => array(
						$available_audience_user_test,
						$available_audience_site_kit_new_visitors,
						$available_audience_site_kit_returning_visitors,
						$available_audience_default_all_users,
						$available_audience_default_purchasers,
					),
				),
			),
			'all audiences, case 2'                 => array(
				$access_token,
				array(
					'raw_audiences'                => array(
						$raw_audience_site_kit_returning_visitors,
						$raw_audience_user_test,
						$raw_audience_default_purchasers,
						$raw_audience_site_kit_new_visitors,
						$raw_audience_default_all_users,
					),
					'expected_available_audiences' => array(
						$available_audience_user_test,
						$available_audience_site_kit_new_visitors,
						$available_audience_site_kit_returning_visitors,
						$available_audience_default_purchasers,
						$available_audience_default_all_users,
					),
				),
			),
			'all audiences, case 3'                 => array(
				$access_token,
				array(
					'raw_audiences'                => array(
						$raw_audience_default_purchasers,
						$raw_audience_default_all_users,
						$raw_audience_site_kit_returning_visitors,
						$raw_audience_site_kit_new_visitors,
						$raw_audience_user_test,
					),
					'expected_available_audiences' => array(
						$available_audience_user_test,
						$available_audience_site_kit_new_visitors,
						$available_audience_site_kit_returning_visitors,
						$available_audience_default_purchasers,
						$available_audience_default_all_users,
					),
				),
			),
		);
	}

	public function test_sync_audiences_unauthenticated() {

		$property_id = '12345';

		$this->analytics->get_settings()->merge(
			array(
				'propertyID' => $property_id,
			)
		);

		// Grant scopes so request doesn't fail with `missing_required_scopes` error.
		$this->authentication->get_oauth_client()->set_granted_scopes(
			$this->analytics->get_scopes()
		);

		$this->fake_handler_and_invoke_register_method( $property_id );

		$data = $this->analytics->set_data( 'sync-audiences', array() );
		$this->assertWPError( $data );
		$this->assertEquals( 'forbidden', $data->get_error_code() );
		$this->assertEquals( 'User must be authenticated to sync audiences.', $data->get_error_message() );
		$this->assertEquals( array( 'status' => 403 ), $data->get_error_data() );
	}

	/**
	 * @dataProvider data_available_audiences
	 */
	public function test_sync_audiences( $access_token, $available_audiences ) {
		$raw_audiences                = $available_audiences['raw_audiences'];
		$expected_available_audiences = $available_audiences['expected_available_audiences'];

		$this->setup_user_authentication( $access_token );

		$property_id = '12345';

		$this->analytics->get_settings()->merge(
			array(
				'propertyID' => $property_id,
			)
		);

		// Grant scopes so request doesn't fail.
		$this->authentication->get_oauth_client()->set_granted_scopes(
			$this->analytics->get_scopes()
		);

		$this->fake_handler_and_invoke_register_method(
			$property_id,
			function ( Request $request ) use ( $raw_audiences, $property_id ) {
				$url = parse_url( $request->getUri() );

				if ( "/v1alpha/properties/$property_id/audiences" === $url['path'] ) {
					$audiences = new GoogleAnalyticsAdminV1alphaListAudiencesResponse();
					$audiences->setAudiences( $raw_audiences );

					return new Response(
						200,
						array(),
						json_encode( $audiences )
					);
				}

				return new Response( 200 );
			}
		);

		// Verify that the module setting is not set yet.
		$this->assertEquals(
			$this->analytics->get_settings()->get()['availableAudiences'],
			null
		);

		// Verify that a sync timestamp has not been set yet.
		$this->assertEquals(
			$this->analytics->get_settings()->get()['availableAudiencesLastSyncedAt'],
			0
		);

		$data = $this->analytics->set_data( 'sync-audiences', array() );

		$this->assertNotWPError( $data );

		// Verify that the response has the correct structure.
		$this->assertEqualSets(
			array(
				'name',
				'displayName',
				'description',
				'audienceType',
				'audienceSlug',
			),
			array_keys( $data[0] )
		);

		// Verify that the module setting is updated with correct values
		// including various audience types and slugs.
		$this->assertEquals(
			$this->analytics->get_settings()->get()['availableAudiences'],
			$expected_available_audiences
		);

		// Verify that a sync timestamp has been set.
		$this->assertGreaterThan(
			0,
			$this->analytics->get_settings()->get()['availableAudiencesLastSyncedAt']
		);
	}

	/**
	 * @dataProvider data_access_token
	 */
	public function test_site_kit_audiences_returned_in_debug_fields( $access_token ) {

		$this->setup_user_authentication( $access_token );

		$property_id = '12345';

		$this->analytics->get_settings()->merge(
			array(
				'propertyID' => $property_id,
			)
		);

		// Grant scopes so request doesn't fail.
		$this->authentication->get_oauth_client()->set_granted_scopes(
			$this->analytics->get_scopes()
		);

		$this->fake_handler_and_invoke_register_method( $property_id );

		$this->analytics->set_data( 'sync-audiences', array() );
		$debug_fields = $this->analytics->get_debug_fields();

		$this->assertArrayHasKey( 'analytics_4_site_kit_audiences', $debug_fields );

		$audience_field = $debug_fields['analytics_4_site_kit_audiences'];

		$this->assertEquals( 'Analytics: Site created audiences', $audience_field['label'] );

		if ( $this->authentication->is_authenticated() ) {
			$this->assertEquals( 'New visitors, Returning visitors', $audience_field['value'] );
			$this->assertEquals( 'New visitors, Returning visitors', $audience_field['debug'] );
		} else {
			$this->assertEquals( 'None', $audience_field['value'] );
			$this->assertEquals( 'none', $audience_field['debug'] );
		}
	}

	public function test_register_template_redirect_amp() {
		$context   = $this->get_amp_primary_context();
		$analytics = new Analytics_4( $context );

		remove_all_actions( 'template_redirect' );
		$analytics->register();

		remove_all_actions( 'amp_print_analytics' );
		remove_all_actions( 'wp_footer' );
		remove_all_actions( 'amp_post_template_footer' );
		remove_all_actions( 'web_stories_print_analytics' );
		remove_all_filters( 'amp_post_template_data' );

		do_action( 'template_redirect' );
		$this->assertFalse( has_action( 'amp_print_analytics' ) );
		$this->assertFalse( has_action( 'wp_footer' ) );
		$this->assertFalse( has_action( 'amp_post_template_footer' ) );
		$this->assertFalse( has_action( 'web_stories_print_analytics' ) );
		$this->assertFalse( has_filter( 'amp_post_template_data' ) );

		$analytics->get_settings()->merge(
			array(
				'propertyID'      => '12345678',
				'webDataStreamID' => '1234567890',
				'measurementID'   => 'A1B2C3D4E5',
				'useSnippet'      => true,
			)
		);

		do_action( 'template_redirect' );
		$this->assertTrue( has_action( 'amp_print_analytics' ) );
		$this->assertTrue( has_action( 'wp_footer' ) );
		$this->assertTrue( has_action( 'amp_post_template_footer' ) );
		$this->assertTrue( has_action( 'web_stories_print_analytics' ) );
		$this->assertTrue( has_filter( 'amp_post_template_data' ) );

		remove_all_actions( 'amp_print_analytics' );
		remove_all_actions( 'wp_footer' );
		remove_all_actions( 'amp_post_template_footer' );
		remove_all_actions( 'web_stories_print_analytics' );
		remove_all_filters( 'amp_post_template_data' );

		// Tag not hooked when blocked.
		add_filter( 'googlesitekit_analytics-4_tag_amp_blocked', '__return_true' );
		do_action( 'template_redirect' );
		$this->assertFalse( has_action( 'amp_print_analytics' ) );
		$this->assertFalse( has_action( 'wp_footer' ) );
		$this->assertFalse( has_action( 'amp_post_template_footer' ) );
		$this->assertFalse( has_action( 'web_stories_print_analytics' ) );
		$this->assertFalse( has_filter( 'amp_post_template_data' ) );

		// Tag not hooked when only AMP blocked
		add_filter( 'googlesitekit_analytics-4_tag_blocked', '__return_false' );
		add_filter( 'googlesitekit_analytics-4_tag_amp_blocked', '__return_true' );
		do_action( 'template_redirect' );
		$this->assertFalse( has_action( 'amp_print_analytics' ) );
		$this->assertFalse( has_action( 'wp_footer' ) );
		$this->assertFalse( has_action( 'amp_post_template_footer' ) );
		$this->assertFalse( has_action( 'web_stories_print_analytics' ) );
		$this->assertFalse( has_filter( 'amp_post_template_data' ) );
	}

	public function test_register_template_redirect_non_amp() {
		$context   = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$analytics = new Analytics_4( $context );

		remove_all_actions( 'template_redirect' );
		$analytics->register();

		remove_all_actions( 'googlesitekit_setup_gtag' );

		do_action( 'template_redirect' );
		$this->assertFalse( has_action( 'googlesitekit_setup_gtag' ) );

		$analytics->get_settings()->merge(
			array(
				'propertyID'      => '12345678',
				'webDataStreamID' => '1234567890',
				'measurementID'   => 'A1B2C3D4E5',
				'useSnippet'      => true,
			)
		);

		do_action( 'template_redirect' );
		$this->assertTrue( has_action( 'googlesitekit_setup_gtag' ) );

		// Tag not hooked when blocked.
		remove_all_actions( 'googlesitekit_setup_gtag' );
		add_filter( 'googlesitekit_analytics-4_tag_blocked', '__return_true' );
		do_action( 'template_redirect' );
		$this->assertFalse( has_action( 'googlesitekit_setup_gtag' ) );

		// Tag hooked when only AMP blocked.
		add_filter( 'googlesitekit_analytics-4_tag_blocked', '__return_false' );
		add_filter( 'googlesitekit_analytics-4_tag_amp_blocked', '__return_true' );
		do_action( 'template_redirect' );
		$this->assertTrue( has_action( 'googlesitekit_setup_gtag' ) );
	}

	/**
	 * @dataProvider block_on_consent_provider_non_amp
	 * @param array $test_parameters {
	 *     Parameters for the test.
	 *
	 *     @type bool $block_on_consent_filter_enabled Whether the block on consent filter is enabled.
	 *     @type bool $expected_block_on_consent Whether the block on consent attributes are expected to be present.
	 * }
	 */
	public function test_block_on_consent_non_amp( $test_parameters ) {
		$analytics = new Analytics_4( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$analytics->get_settings()->merge(
			array(
				'propertyID'      => '12345678',
				'webDataStreamID' => '1234567890',
				'measurementID'   => 'A1B2C3D4E5',
				'useSnippet'      => true,
			)
		);

		wp_scripts()->registered = array();
		wp_scripts()->queue      = array();
		wp_scripts()->done       = array();
		remove_all_actions( 'template_redirect' );
		$analytics->register();

		// Hook `wp_print_head_scripts` on placeholder action for capturing.
		add_action( '__test_print_scripts', 'wp_print_head_scripts' );

		if ( $test_parameters['block_on_consent_filter_enabled'] ) {
			$this->setExpectedDeprecated( 'googlesitekit_analytics-4_tag_block_on_consent' );
			add_filter( 'googlesitekit_analytics-4_tag_block_on_consent', '__return_true' );
		}

		do_action( 'template_redirect' );
		do_action( 'wp_enqueue_scripts' );

		$output = $this->capture_action( '__test_print_scripts' );

		$this->assertStringContainsString( 'https://www.googletagmanager.com/gtag/js?id=A1B2C3D4E5', $output );

		if ( $test_parameters['expected_block_on_consent'] ) {
			$this->assertMatchesRegularExpression( '/\sdata-block-on-consent\b/', $output );
		} else {
			$this->assertDoesNotMatchRegularExpression( '/\sdata-block-on-consent\b/', $output );
		}
	}

	public function block_on_consent_provider_non_amp() {
		return array(
			'default (disabled)' => array(
				array(
					'block_on_consent_filter_enabled' => false,
					'expected_block_on_consent'       => false,
				),
			),
			'enabled'            => array(
				array(
					'block_on_consent_filter_enabled' => true,
					'expected_block_on_consent'       => true,
				),
			),
		);
	}

	/**
	 * @dataProvider block_on_consent_provider_amp
	 * @param bool $enabled
	 */
	public function test_block_on_consent_amp( $enabled ) {
		$analytics = new Analytics_4( $this->get_amp_primary_context() );
		$analytics->get_settings()->merge(
			array(
				'propertyID'      => '12345678',
				'webDataStreamID' => '1234567890',
				'measurementID'   => 'A1B2C3D4E5',
				'useSnippet'      => true,
			)
		);

		remove_all_actions( 'template_redirect' );
		remove_all_actions( 'wp_footer' );
		$analytics->register();

		if ( $enabled ) {
			add_filter( 'googlesitekit_analytics-4_tag_amp_block_on_consent', '__return_true' );
		}

		do_action( 'template_redirect' );

		$output = $this->capture_action( 'wp_footer' );

		$this->assertStringContainsString( '<amp-analytics', $output );

		if ( $enabled ) {
			$this->assertMatchesRegularExpression( '/\sdata-block-on-consent\b/', $output );
		} else {
			$this->assertDoesNotMatchRegularExpression( '/\sdata-block-on-consent\b/', $output );
		}
	}

	public function test_module_level_audience_settings_reset__on_property_change() {
		$this->analytics->register();

		$this->analytics->get_settings()->merge(
			array(
				'propertyID' => 'UA-111111',
			),
		);

		$default_audience_segmentation_settings = array(
			'availableAudiences'                   => null,
			'availableAudiencesLastSyncedAt'       => 0,
			'audienceSegmentationSetupCompletedBy' => null,
		);

		$activated_audience_segmentation_settings = array(
			'availableAudiences'                   => array(
				array(
					'name' => 'properties/12345678/audiences/12345',
				),
				array(
					'name' => 'properties/12345678/audiences/67890',
				),
			),
			'availableAudiencesLastSyncedAt'       => time(),
			'audienceSegmentationSetupCompletedBy' => 1,
		);

		// Set module level audience settings.
		$this->analytics->get_settings()->merge(
			$activated_audience_segmentation_settings
		);
		$analytics_settings = $this->analytics->get_settings()->get();
		foreach ( array_keys( $default_audience_segmentation_settings ) as $key ) {
			$this->assertEquals( $activated_audience_segmentation_settings[ $key ], $analytics_settings[ $key ] );
		}

		// Update the propertyID to trigger reset.
		$this->analytics->get_settings()->merge(
			array(
				'propertyID' => 'UA-222222',
			)
		);

		// Confirm the module level audience settings have been reset.
		$analytics_settings = $this->analytics->get_settings()->get();
		foreach ( array_keys( $default_audience_segmentation_settings ) as $key ) {
			$this->assertEquals( $default_audience_segmentation_settings[ $key ], $analytics_settings[ $key ] );
		}
	}

	public function test_module_level_audience_settings_reset__on_deactivation() {
		$default_audience_segmentation_settings = array(
			'availableAudiences'                   => null,
			'availableAudiencesLastSyncedAt'       => 0,
			'audienceSegmentationSetupCompletedBy' => null,
		);

		$activated_audience_segmentation_settings = array(
			'availableAudiences'                   => array(
				array(
					'name' => 'properties/12345678/audiences/12345',
				),
				array(
					'name' => 'properties/12345678/audiences/67890',
				),
			),
			'availableAudiencesLastSyncedAt'       => time(),
			'audienceSegmentationSetupCompletedBy' => 1,
		);

		// Set module level audience settings.
		$this->analytics->get_settings()->merge(
			$activated_audience_segmentation_settings
		);
		$analytics_settings = $this->analytics->get_settings()->get();
		foreach ( array_keys( $default_audience_segmentation_settings ) as $key ) {
			$this->assertEquals( $activated_audience_segmentation_settings[ $key ], $analytics_settings[ $key ] );
		}

		// Simulate deactivation effect.
		$this->analytics->on_deactivation();

		// Confirm the module level audience settings have been reset.
		$analytics_settings = $this->analytics->get_settings()->get();
		foreach ( array_keys( $default_audience_segmentation_settings ) as $key ) {
			$this->assertEquals( $default_audience_segmentation_settings[ $key ], $analytics_settings[ $key ] );
		}
	}

	public function block_on_consent_provider_amp() {
		return array(
			'default (disabled)' => array(
				false,
			),
			'enabled'            => array(
				true,
			),
		);
	}

	public function fake_handler_and_invoke_register_method( $property_id, $local_request_handler = null ) {
		FakeHttp::fake_google_http_handler(
			$this->analytics->get_client(),
			$this->create_fake_http_handler( $property_id, $local_request_handler )
		);
		$this->analytics->register();
	}

	public function grant_scope( $scope ) {
		$this->authentication->get_oauth_client()->set_granted_scopes(
			array_merge(
				$this->authentication->get_oauth_client()->get_required_scopes(),
				(array) $scope
			)
		);
	}

	protected function set_test_resource_data_availability_dates() {

		$test_resource_slug_audience         = 'properties/12345678/audiences/12345';
		$test_resource_slug_custom_dimension = 'googlesitekit_post_type';
		$test_resource_slug_property         = '12345678';

		$test_resource_data_availability_transient_audience         = 'googlesitekit_' . Resource_Data_Availability_Date::RESOURCE_TYPE_AUDIENCE . "_{$test_resource_slug_audience}_data_availability_date";
		$test_resource_data_availability_transient_custom_dimension = 'googlesitekit_' . Resource_Data_Availability_Date::RESOURCE_TYPE_CUSTOM_DIMENSION . "_{$test_resource_slug_custom_dimension}_data_availability_date";
		$test_resource_data_availability_transient_property         = 'googlesitekit_' . Resource_Data_Availability_Date::RESOURCE_TYPE_PROPERTY . "_{$test_resource_slug_property}_data_availability_date";

		$this->analytics->get_settings()->merge(
			array(
				'propertyID'         => $test_resource_slug_property,
				'measurementID'      => 'A1B2C3D4E5',
				'availableAudiences' => array(
					array(
						'name' => $test_resource_slug_audience,
					),
				),
			)
		);

		$this->analytics->register();

		$this->grant_scope( Analytics_4::READONLY_SCOPE );

		$this->analytics->set_data(
			'save-resource-data-availability-date',
			array(
				'resourceType' => Resource_Data_Availability_Date::RESOURCE_TYPE_AUDIENCE,
				'resourceSlug' => $test_resource_slug_audience,
				'date'         => 20201231,
			)
		);

		$this->analytics->set_data(
			'save-resource-data-availability-date',
			array(
				'resourceType' => Resource_Data_Availability_Date::RESOURCE_TYPE_CUSTOM_DIMENSION,
				'resourceSlug' => $test_resource_slug_custom_dimension,
				'date'         => 20201231,
			)
		);

		$this->analytics->set_data(
			'save-resource-data-availability-date',
			array(
				'resourceType' => Resource_Data_Availability_Date::RESOURCE_TYPE_PROPERTY,
				'resourceSlug' => $test_resource_slug_property,
				'date'         => 20201231,
			)
		);

		// Return the resource slugs and transient names for testing.
		return array(
			$test_resource_slug_audience,
			$test_resource_slug_custom_dimension,
			$test_resource_slug_property,
			$test_resource_data_availability_transient_audience,
			$test_resource_data_availability_transient_custom_dimension,
			$test_resource_data_availability_transient_property,
		);
	}

	/**
	 * @return Module_With_Scopes
	 */
	protected function get_module_with_scopes() {
		return $this->analytics;
	}

	/**
	 * @return Module_With_Settings
	 */
	protected function get_module_with_settings() {
		return $this->analytics;
	}

	/**
	 * @return Module_With_Owner
	 */
	protected function get_module_with_owner() {
		return $this->analytics;
	}

	/**
	 * @return Module_With_Service_Entity
	 */
	protected function get_module_with_service_entity() {
		return $this->analytics;
	}

	protected function set_up_check_service_entity_access( Module $module ) {
		$module->get_settings()->merge(
			array(
				'propertyID' => '123456789',
			)
		);
	}

	/**
	 * @return Module_With_Data_Available_State
	 */
	protected function get_module_with_data_available_state() {
		return $this->analytics;
	}
}
