<?php
/**
 * Class Google\Site_Kit\Modules\AdSense
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules;

use Google\Site_Kit\Core\Modules\Module;
use Google\Site_Kit\Core\Modules\Module_With_Screen;
use Google\Site_Kit\Core\Modules\Module_With_Screen_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Scopes;
use Google\Site_Kit\Core\Modules\Module_With_Scopes_Trait;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit_Dependencies\Google_Client;
use Google\Site_Kit_Dependencies\Google_Service_AdSense;
use Google\Site_Kit_Dependencies\Google_Service_AdSense_Alert;
use Google\Site_Kit_Dependencies\Psr\Http\Message\RequestInterface;
use WP_Error;

/**
 * Class representing the AdSense module.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
final class AdSense extends Module implements Module_With_Screen, Module_With_Scopes {
	use Module_With_Screen_Trait, Module_With_Scopes_Trait;

	const OPTION = 'googlesitekit_adsense_settings';

	/**
	 * Internal flag for whether the AdSense tag has been printed.
	 *
	 * @since 1.0.0
	 * @var bool
	 */
	private $adsense_tag_printed = false;

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.0.0
	 */
	public function register() {
		$this->register_scopes_hook();

		$this->register_screen_hook();

		add_filter(
			'option_' . self::OPTION,
			function( $option ) {
				$option = (array) $option;

				/**
				 * Filters the AdSense account ID to use.
				 *
				 * @since 1.0.0
				 *
				 * @param string $account_id Empty by default, will fall back to the option value if not set.
				 */
				$account_id = apply_filters( 'googlesitekit_adsense_account_id', '' );

				if ( ! empty( $account_id ) ) {
					$option['accountID'] = $account_id;
				}

				/**
				 * Migrate 'adsenseTagEnabled' to 'useSnippet'.
				 */
				if ( ! isset( $option['useSnippet'] ) && isset( $option['adsenseTagEnabled'] ) ) {
					$option['useSnippet'] = (bool) $option['adsenseTagEnabled'];
				}
				// Ensure the old key is removed regardless. No-op if not set.
				unset( $option['adsenseTagEnabled'] );

				/**
				 * Enable the snippet by default.
				 */
				if ( ! isset( $option['useSnippet'] ) ) {
					$option['useSnippet'] = true;
				}

				return $option;
			}
		);

		add_action( // For non-AMP, plus AMP Native and Transitional.
			'wp_head',
			function() {
				$this->output_adsense_script();
			}
		);

		add_filter( // For AMP Reader, and AMP Native and Transitional (as fallback).
			'the_content',
			function( $content ) {
				return $this->amp_content_add_auto_ads( $content );
			}
		);

		add_filter( // Load amp-auto-ads component for AMP Reader.
			'amp_post_template_data',
			function( $data ) {
				return $this->amp_data_load_auto_ads_component( $data );
			}
		);

		if ( $this->is_connected() ) {
			remove_filter( 'option_googlesitekit_analytics_adsense_linked', '__return_false' );
		}
	}

	/**
	 * Gets required Google OAuth scopes for the module.
	 *
	 * @since 1.0.0
	 *
	 * @return array List of Google OAuth scopes.
	 */
	public function get_scopes() {
		return array(
			'https://www.googleapis.com/auth/adsense',
		);
	}

	/**
	 * Returns all module information data for passing it to JavaScript.
	 *
	 * @since 1.0.0
	 *
	 * @return array Module information data.
	 */
	public function prepare_info_for_js() {
		$info = parent::prepare_info_for_js();

		$info['provides'] = array(
			__( 'Monetize your website', 'google-site-kit' ),
			__( 'Intelligent, automatic ad placement', 'google-site-kit' ),
		);

		$info['settings'] = $this->options->get( self::OPTION );

		// Clear datapoints that don't need to be localized.
		$idenfifier_args = array(
			'source' => 'site-kit',
			'url'    => rawurlencode( $this->context->get_reference_site_url() ),
		);

		$signup_args = array(
			'utm_source' => 'site-kit',
			'utm_medium' => 'wordpress_signup',
		);

		$info['accountURL'] = add_query_arg( $idenfifier_args, $this->get_data( 'account-url' ) );
		$info['signupURL']  = add_query_arg( $signup_args, $info['accountURL'] );
		$info['rootURL']    = add_query_arg( $idenfifier_args, 'https://www.google.com/adsense/' );

		return $info;
	}

	/**
	 * Checks whether the module is connected.
	 *
	 * A module being connected means that all steps required as part of its activation are completed.
	 *
	 * @since 1.0.0
	 *
	 * @return bool True if module is connected, false otherwise.
	 */
	public function is_connected() {
		$settings = (array) $this->options->get( self::OPTION );

		// TODO: Remove the latter at some point as it's here for back-compat.
		if ( empty( $settings['setupComplete'] ) && empty( $settings['setup_complete'] ) ) {
			return false;
		}

		return parent::is_connected();
	}

	/**
	 * Cleans up when the module is deactivated.
	 *
	 * @since 1.0.0
	 */
	public function on_deactivation() {
		$this->options->delete( self::OPTION );
	}

	/**
	 * Adds the AdSense script tag as soon as the client id is available.
	 *
	 * Used for account verification and ad display.
	 *
	 * @since 1.0.0
	 */
	protected function output_adsense_script() {

		// Bail early if we are checking for the tag presence from the back end.
		if ( $this->context->input()->filter( INPUT_GET, 'tagverify', FILTER_VALIDATE_BOOLEAN ) ) {
			return;
		}

		// Bail if we don't have a client ID.
		$client_id = $this->get_data( 'client-id' );
		if ( is_wp_error( $client_id ) || ! $client_id ) {
			return;
		}

		$tag_enabled = $this->get_data( 'use-snippet' );

		// If we have client id default behaviour should be placing the tag unless the user has opted out.
		if ( false === $tag_enabled ) {
			return;
		}

		// On AMP, preferably use the new 'wp_body_open' hook, falling back to 'the_content' below.
		if ( $this->context->is_amp() ) {
			add_action(
				'wp_body_open',
				function() use ( $client_id ) {
					if ( $this->adsense_tag_printed ) {
						return;
					}

					?>
					<amp-auto-ads type="adsense" data-ad-client="<?php echo esc_attr( $client_id ); ?>"></amp-auto-ads>
					<?php
					$this->adsense_tag_printed = true;
				},
				-9999
			);
			return;
		}

		if ( $this->adsense_tag_printed ) {
			return;
		}

		// If we haven't completed the account connection yet, we still insert the AdSense tag
		// because it is required for account verification.
		?>
<script async src="//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script> <?php // phpcs:ignore WordPress.WP.EnqueuedResources.NonEnqueuedScript ?>
<script>
(adsbygoogle = window.adsbygoogle || []).push({
google_ad_client: "<?php echo esc_attr( $client_id ); ?>",
enable_page_level_ads: true,
tag_partner: "site_kit"
});
</script>
		<?php
		$this->adsense_tag_printed = true;
	}

	/**
	 * Adds AMP auto ads script if opted in.
	 *
	 * This only affects AMP Reader mode, the others are automatically covered.
	 *
	 * @since 1.0.0
	 *
	 * @param array $data AMP template data.
	 * @return array Filtered $data.
	 */
	protected function amp_data_load_auto_ads_component( $data ) {
		if ( ! $this->is_connected() ) {
			return $data;
		}

		$tag_enabled = $this->get_data( 'use-snippet' );
		if ( is_wp_error( $tag_enabled ) || ! $tag_enabled ) {
			return $data;
		}

		$client_id = $this->get_data( 'client-id' );
		if ( is_wp_error( $client_id ) || ! $client_id ) {
			return $data;
		}

		$data['amp_component_scripts']['amp-auto-ads'] = 'https://cdn.ampproject.org/v0/amp-auto-ads-0.1.js';
		return $data;
	}

	/**
	 * Adds the AMP auto ads tag if opted in.
	 *
	 * @since 1.0.0
	 *
	 * @param string $content The page content.
	 * @return string Filtered $content.
	 */
	protected function amp_content_add_auto_ads( $content ) {
		if ( ! $this->context->is_amp() ) {
			return $content;
		}

		if ( ! $this->is_connected() ) {
			return $content;
		}

		$tag_enabled = $this->get_data( 'use-snippet' );
		if ( is_wp_error( $tag_enabled ) || ! $tag_enabled ) {
			return $content;
		}

		$client_id = $this->get_data( 'client-id' );
		if ( is_wp_error( $client_id ) || ! $client_id ) {
			return $content;
		}

		if ( $this->adsense_tag_printed ) {
			return $content;
		}

		$this->adsense_tag_printed = true;
		return '<amp-auto-ads type="adsense" data-ad-client="' . esc_attr( $client_id ) . '"></amp-auto-ads> ' . $content;
	}

	/**
	 * Returns the mapping between available datapoints and their services.
	 *
	 * @since 1.0.0
	 *
	 * @return array Associative array of $datapoint => $service_identifier pairs.
	 */
	protected function get_datapoint_services() {
		return array(
			// GET / POST.
			'connection'     => '',
			'account-id'     => '',
			'client-id'      => '',
			'use-snippet'    => '',
			'account-status' => '',
			// GET.
			'account-url'    => '',
			'reports-url'    => '',
			'notifications'  => '',
			'accounts'       => 'adsense',
			'alerts'         => 'adsense',
			'clients'        => 'adsense',
			'urlchannels'    => 'adsense',
			'earnings'       => 'adsense',
			// POST.
			'setup-complete' => '',
		);
	}

	/**
	 * Creates a request object for the given datapoint.
	 *
	 * @since 1.0.0
	 *
	 * @param Data_Request $data Data request object.
	 *
	 * @return RequestInterface|callable|WP_Error Request object or callable on success, or WP_Error on failure.
	 */
	protected function create_data_request( Data_Request $data ) {
		$method    = $data->method;
		$datapoint = $data->datapoint;

		if ( 'GET' === $method ) {
			switch ( $datapoint ) {
				case 'connection':
					return function() {
						$option = (array) $this->options->get( self::OPTION );
						// TODO: Remove this at some point (migration of old options).
						if ( isset( $option['account_id'] ) || isset( $option['client_id'] ) || isset( $option['account_status'] ) ) {
							if ( isset( $option['account_id'] ) ) {
								if ( ! isset( $option['accountID'] ) ) {
									$option['accountID'] = $option['account_id'];
								}
								unset( $option['account_id'] );
							}
							if ( isset( $option['client_id'] ) ) {
								if ( ! isset( $option['clientID'] ) ) {
									$option['clientID'] = $option['client_id'];
								}
								unset( $option['client_id'] );
							}
							if ( isset( $option['account_status'] ) ) {
								if ( ! isset( $option['accountStatus'] ) ) {
									$option['accountStatus'] = $option['account_status'];
								}
								unset( $option['account_status'] );
							}
							$this->options->set( self::OPTION, $option );
						}
						// TODO: Remove this at some point (migration of old 'accountId' option).
						if ( isset( $option['accountId'] ) ) {
							if ( ! isset( $option['accountID'] ) ) {
								$option['accountID'] = $option['accountId'];
							}
							unset( $option['accountId'] );
						}

						// TODO: Remove this at some point (migration of old 'clientId' option).
						if ( isset( $option['clientId'] ) ) {
							if ( ! isset( $option['clientID'] ) ) {
								$option['clientID'] = $option['clientId'];
							}
							unset( $option['clientId'] );
						}

						$defaults = array(
							'accountID'     => '',
							'clientID'      => '',
							'accountStatus' => '',
						);
						return array_intersect_key( array_merge( $defaults, $option ), $defaults );
					};
				case 'account-id':
					return function() {
						$option = (array) $this->options->get( self::OPTION );
						// TODO: Remove this at some point (migration of old option).
						if ( isset( $option['account_id'] ) ) {
							if ( ! isset( $option['accountID'] ) ) {
								$option['accountID'] = $option['account_id'];
							}
							unset( $option['account_id'] );
							$this->options->set( self::OPTION, $option );
						}
						if ( empty( $option['accountID'] ) ) {
							return new WP_Error( 'account_id_not_set', __( 'AdSense account ID not set.', 'google-site-kit' ), array( 'status' => 404 ) );
						}
						return $option['accountID'];
					};
				case 'client-id':
					return function() {
						$option = (array) $this->options->get( self::OPTION );
						// TODO: Remove this at some point (migration of old option).
						if ( isset( $option['client_id'] ) ) {
							if ( ! isset( $option['clientID'] ) ) {
								$option['clientID'] = $option['client_id'];
							}
							unset( $option['client_id'] );
							$this->options->set( self::OPTION, $option );
						}
						if ( empty( $option['clientID'] ) ) {
							return new WP_Error( 'client_id_not_set', __( 'AdSense client ID not set.', 'google-site-kit' ), array( 'status' => 404 ) );
						}
						return $option['clientID'];
					};
				case 'use-snippet':
					return function() {
						$option = (array) $this->options->get( self::OPTION );

						return ! empty( $option['useSnippet'] );
					};
				case 'account-status':
					return function() {
						$option = (array) $this->options->get( self::OPTION );
						// TODO: Remove this at some point (migration of old option).
						if ( isset( $option['account_status'] ) ) {
							if ( ! isset( $option['accountStatus'] ) ) {
								$option['accountStatus'] = $option['account_status'];
							}
							unset( $option['account_status'] );
							$this->options->set( self::OPTION, $option );
						}
						if ( empty( $option['accountStatus'] ) ) {
							return new WP_Error( 'account_status_not_set', __( 'AdSense account status not set.', 'google-site-kit' ), array( 'status' => 404 ) );
						}
						return $option['accountStatus'];
					};
				case 'account-url':
					return function() {
						$account_id = $this->get_data( 'account-id' );
						if ( ! is_wp_error( $account_id ) && $account_id ) {
							return sprintf( 'https://www.google.com/adsense/new/%s/home', $account_id );
						}
						return 'https://www.google.com/adsense/signup/new';
					};
				case 'reports-url':
					return function() {
						$account_id = $this->get_data( 'account-id' );
						if ( ! is_wp_error( $account_id ) && $account_id ) {
							return sprintf( 'https://www.google.com/adsense/new/u/0/%s/main/viewreports', $account_id );
						}
						return 'https://www.google.com/adsense/start';
					};
				case 'notifications':
					return function() {
						$alerts = $this->get_data( 'alerts' );
						if ( is_wp_error( $alerts ) || empty( $alerts ) ) {
							return array();
						}
						$alerts = array_filter(
							$alerts,
							function( Google_Service_AdSense_Alert $alert ) {
								return 'SEVERE' === $alert->getSeverity();
							}
						);

						// There is no SEVERE alert, return empty.
						if ( empty( $alerts ) ) {
							return array();
						}

						/**
						 * First Alert
						 *
						 * @var Google_Service_AdSense_Alert $alert
						 */
						$alert = array_shift( $alerts );
						return array(
							array(
								'id'            => 'adsense-notification',
								'description'   => $alert->getMessage(),
								'isDismissible' => true,
								'winImage'      => 'sun-small.png',
								'format'        => 'large',
								'severity'      => 'win-info',
								'ctaURL'        => $this->get_data( 'account-url' ),
								'ctaLabel'      => __( 'Go to AdSense', 'google-site-kit' ),
								'ctaTarget'     => '_blank',
							),
						);
					};
				case 'accounts':
					$service = $this->get_service( 'adsense' );
					return $service->accounts->listAccounts();
				case 'alerts':
					if ( ! isset( $data['accountID'] ) ) {
						$data['accountID'] = $this->get_data( 'account-id' );
						if ( is_wp_error( $data['accountID'] ) || ! $data['accountID'] ) {
							/* translators: %s: Missing parameter name */
							return new WP_Error( 'missing_required_param', sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'accountID' ), array( 'status' => 400 ) );
						}
					}
					$service = $this->get_service( 'adsense' );
					return $service->accounts_alerts->listAccountsAlerts( $data['accountID'] );
				case 'clients':
					$service = $this->get_service( 'adsense' );
					return $service->adclients->listAdclients();
				case 'urlchannels':
					if ( ! isset( $data['clientID'] ) ) {
						/* translators: %s: Missing parameter name */
						return new WP_Error( 'missing_required_param', sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'clientID' ), array( 'status' => 400 ) );
					}
					$service = $this->get_service( 'adsense' );
					return $service->urlchannels->listUrlchannels( $data['clientID'] );
				case 'earnings':
					$dates = $this->date_range_to_dates( $data['dateRange'] ?: 'last-28-days' );

					if ( is_wp_error( $dates ) ) {
						return $dates;
					}

					list ( $start_date, $end_date ) = $dates;

					$dimensions = (array) $data['dimensions'];
					$args       = compact( 'start_date', 'end_date', 'dimensions' );

					if ( isset( $data['limit'] ) ) {
						$args['row_limit'] = $data['limit'];
					}

					return $this->create_adsense_earning_data_request( $args );
			}
		} elseif ( 'POST' === $method ) {
			switch ( $datapoint ) {
				case 'connection':
					return function() use ( $data ) {
						$option = (array) $this->options->get( self::OPTION );
						$keys   = array( 'accountID', 'clientID', 'accountStatus' );
						foreach ( $keys as $key ) {
							if ( isset( $data[ $key ] ) ) {
								$option[ $key ] = $data[ $key ];
							}
						}
						$this->options->set( self::OPTION, $option );
						return true;
					};
				case 'account-id':
					if ( ! isset( $data['accountID'] ) ) {
						/* translators: %s: Missing parameter name */
						return new WP_Error( 'missing_required_param', sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'accountID' ), array( 'status' => 400 ) );
					}
					return function() use ( $data ) {
						$option              = (array) $this->options->get( self::OPTION );
						$option['accountID'] = $data['accountID'];
						$this->options->set( self::OPTION, $option );
						return true;
					};
				case 'client-id':
					if ( ! isset( $data['clientID'] ) ) {
						/* translators: %s: Missing parameter name */
						return new WP_Error( 'missing_required_param', sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'clientID' ), array( 'status' => 400 ) );
					}
					return function() use ( $data ) {
						$option             = (array) $this->options->get( self::OPTION );
						$option['clientID'] = $data['clientID'];
						$this->options->set( self::OPTION, $option );
						return true;
					};
				case 'use-snippet':
					if ( ! isset( $data['useSnippet'] ) ) {
						return new WP_Error(
							'missing_required_param',
							sprintf(
								/* translators: %s: Missing parameter name */
								__( 'Request parameter is empty: %s.', 'google-site-kit' ),
								'useSnippet'
							),
							array( 'status' => 400 )
						);
					}

					return function() use ( $data ) {
						$option               = (array) $this->options->get( self::OPTION );
						$option['useSnippet'] = (bool) $data['useSnippet'];

						$this->options->set( self::OPTION, $option );

						return true;
					};
				case 'account-status':
					if ( ! isset( $data['accountStatus'] ) ) {
						/* translators: %s: Missing parameter name */
						return new WP_Error( 'missing_required_param', sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'accountStatus' ), array( 'status' => 400 ) );
					}
					return function() use ( $data ) {
						$option                  = (array) $this->options->get( self::OPTION );
						$option['accountStatus'] = $data['accountStatus'];
						$this->options->set( self::OPTION, $option );
						return true;
					};
				case 'setup-complete':
					if ( ! isset( $data['clientID'] ) ) {
						/* translators: %s: Missing parameter name */
						return new WP_Error( 'missing_required_param', sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'clientID' ), array( 'status' => 400 ) );
					}
					return function() use ( $data ) {
						$option                  = (array) $this->options->get( self::OPTION );
						$option['setupComplete'] = true;
						$option['clientID']      = $data['clientID'];
						$option['useSnippet']    = isset( $option['useSnippet'] ) ? true : $data['useSnippet'];

						// Set useSnippet explicitly using $data param, otherwise default to true if not set in option.
						if ( isset( $data['useSnippet'] ) ) {
							$option['useSnippet'] = $data['useSnippet'];
						} elseif ( ! isset( $option['useSnippet'] ) ) {
							$option['useSnippet'] = true;
						}

						$this->options->set( self::OPTION, $option );

						return true;
					};
			}
		}

		return new WP_Error( 'invalid_datapoint', __( 'Invalid datapoint.', 'google-site-kit' ) );
	}

	/**
	 * Parses a response for the given datapoint.
	 *
	 * @since 1.0.0
	 *
	 * @param Data_Request $data Data request object.
	 * @param mixed        $response Request response.
	 *
	 * @return mixed Parsed response data on success, or WP_Error on failure.
	 */
	protected function parse_data_response( Data_Request $data, $response ) {
		$method    = $data->method;
		$datapoint = $data->datapoint;

		if ( 'GET' === $method ) {
			switch ( $datapoint ) {
				case 'accounts':
					// Store the matched account as soon as we have it.
					$accounts = $response->getItems();
					if ( ! empty( $accounts ) ) {
						$account_id = $this->get_data( 'account-id' );
						if ( is_wp_error( $account_id ) || ! $account_id ) {
							$this->set_data( 'account-id', array( 'accountID' => $accounts[0]->id ) );
						}
					}
					// TODO: Parse this response to a regular array.
					return $accounts;
				case 'alerts':
					// TODO: Parse this response to a regular array.
					return $response->getItems();
				case 'clients':
					// TODO: Parse this response to a regular array.
					return $response->getItems();
				case 'urlchannels':
					// TODO: Parse this response to a regular array.
					return $response->getItems();
				case 'earnings':
					return $response;
			}
		}

		return $response;
	}

	/**
	 * Gets an array of dates for the given named date range.
	 *
	 * @param string $date_range Named date range.
	 *                           E.g. 'last-28-days'.
	 *
	 * @return array|WP_Error Array of [startDate, endDate] or WP_Error if invalid named range.
	 */
	private function date_range_to_dates( $date_range ) {
		switch ( $date_range ) {
			case 'today':
				return array(
					date( 'Y-m-d', strtotime( 'today' ) ),
					date( 'Y-m-d', strtotime( 'today' ) ),
				);
			case 'yesterday':
				return array(
					date( 'Y-m-d', strtotime( 'yesterday' ) ),
					date( 'Y-m-d', strtotime( 'yesterday' ) ),
				);
			case 'same-day-last-week':
				return array(
					date( 'Y-m-d', strtotime( '7 days ago' ) ),
					date( 'Y-m-d', strtotime( '7 days ago' ) ),
				);
			case 'this-month':
				return array(
					date( 'Y-m-01' ),
					date( 'Y-m-d', strtotime( 'today' ) ),
				);
			case 'this-month-last-year':
				$last_year          = intval( date( 'Y' ) ) - 1;
				$last_date_of_month = date( 't', strtotime( $last_year . '-' . date( 'm' ) . '-01' ) );

				return array(
					date( $last_year . '-m-01' ),
					date( $last_year . '-m-' . $last_date_of_month ),
				);
			case 'prev-7-days':
				return array(
					date( 'Y-m-d', strtotime( '14 days ago' ) ),
					date( 'Y-m-d', strtotime( '8 days ago' ) ),
				);
			case 'prev-28-days':
				return array(
					date( 'Y-m-d', strtotime( '56 days ago' ) ),
					date( 'Y-m-d', strtotime( '29 days ago' ) ),
				);
			// Intentional fallthrough.
			case 'last-7-days':
			case 'last-14-days':
			case 'last-28-days':
			case 'last-90-days':
				return $this->parse_date_range( $date_range );
		}

		return new WP_Error( 'invalid_date_range', __( 'Invalid date range.', 'google-site-kit' ) );
	}

	/**
	 * Creates a new AdSense earning request for the current account, site and given arguments.
	 *
	 * @since 1.0.0
	 *
	 * @param array $args {
	 *     Optional. Additional arguments.
	 *
	 *     @type array  $dimensions List of request dimensions. Default empty array.
	 *     @type string $start_date Start date in 'Y-m-d' format. Default empty string.
	 *     @type string $end_date   End date in 'Y-m-d' format. Default empty string.
	 *     @type int    $row_limit  Limit of rows to return. Default none (will be skipped).
	 * }
	 * @return RequestInterface|WP_Error AdSense earning request instance.
	 */
	protected function create_adsense_earning_data_request( array $args = array() ) {
		$args = wp_parse_args(
			$args,
			array(
				'dimensions' => array(),
				'start_date' => '',
				'end_date'   => '',
				'row_limit'  => '',
			)
		);

		$account_id = $this->get_data( 'account-id' );
		if ( is_wp_error( $account_id ) ) {
			return $account_id;
		}

		$opt_params = array(
			'locale' => get_locale(),
			'metric' => array( 'EARNINGS', 'PAGE_VIEWS_RPM', 'IMPRESSIONS' ),
		);

		if ( ! empty( $args['dimensions'] ) ) {
			$opt_params['dimension'] = (array) $args['dimensions'];
		}

		if ( ! empty( $args['row_limit'] ) ) {
			$opt_params['maxResults'] = (int) $args['row_limit'];
		}

		$host = wp_parse_url( $this->context->get_reference_site_url(), PHP_URL_HOST );
		if ( ! empty( $host ) ) {
			$opt_params['filter'] = 'DOMAIN_NAME==' . $host;
		}

		$service = $this->get_service( 'adsense' );
		return $service->accounts_reports->generate( $account_id, $args['start_date'], $args['end_date'], $opt_params );
	}

	/**
	 * Sets up information about the module.
	 *
	 * @since 1.0.0
	 *
	 * @return array Associative array of module info.
	 */
	protected function setup_info() {
		$idenfifier_args = array(
			'source' => 'site-kit',
			'url'    => $this->context->get_reference_site_url(),
		);

		return array(
			'slug'        => 'adsense',
			'name'        => _x( 'AdSense', 'Service name', 'google-site-kit' ),
			'description' => __( 'Earn money by placing ads on your website. It’s free and easy.', 'google-site-kit' ),
			'cta'         => __( 'Monetize Your Site.', 'google-site-kit' ),
			'order'       => 2,
			'homepage'    => add_query_arg( $idenfifier_args, $this->get_data( 'reports-url' ) ),
			'learn_more'  => __( 'https://www.google.com/intl/en_us/adsense/start/', 'google-site-kit' ),
			'group'       => __( 'Additional Google Services', 'google-site-kit' ),
			'tags'        => array( 'monetize' ),
		);
	}

	/**
	 * Sets up the Google services the module should use.
	 *
	 * This method is invoked once by {@see Module::get_service()} to lazily set up the services when one is requested
	 * for the first time.
	 *
	 * @since 1.0.0
	 *
	 * @param Google_Client $client Google client instance.
	 * @return array Google services as $identifier => $service_instance pairs. Every $service_instance must be an
	 *               instance of Google_Service.
	 */
	protected function setup_services( Google_Client $client ) {
		return array(
			'adsense' => new Google_Service_AdSense( $client ),
		);
	}
}
