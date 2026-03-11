<?php
/*
 * Copyright 2014 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

namespace Google\Service\SubscribewithGoogle;

class PaymentAddress extends \Google\Model
{
  /**
   * Top-level administrative subdivision of this country. Examples: US state,
   * IT region, UK constituent nation, JP prefecture.
   *
   * @var string
   */
  public $administrativeArea;
  /**
   * Two-letter country code (in ISO 3166-1-alpha-2) of the user payment
   * profile's legal address.
   *
   * @var string
   */
  public $countryCode;
  /**
   * Despite the name, postal_code_number values are frequently alphanumeric.
   * Examples: "94043", "SW1W", "SW1W 9TQ".
   *
   * @var string
   */
  public $postalCode;

  /**
   * Top-level administrative subdivision of this country. Examples: US state,
   * IT region, UK constituent nation, JP prefecture.
   *
   * @param string $administrativeArea
   */
  public function setAdministrativeArea($administrativeArea)
  {
    $this->administrativeArea = $administrativeArea;
  }
  /**
   * @return string
   */
  public function getAdministrativeArea()
  {
    return $this->administrativeArea;
  }
  /**
   * Two-letter country code (in ISO 3166-1-alpha-2) of the user payment
   * profile's legal address.
   *
   * @param string $countryCode
   */
  public function setCountryCode($countryCode)
  {
    $this->countryCode = $countryCode;
  }
  /**
   * @return string
   */
  public function getCountryCode()
  {
    return $this->countryCode;
  }
  /**
   * Despite the name, postal_code_number values are frequently alphanumeric.
   * Examples: "94043", "SW1W", "SW1W 9TQ".
   *
   * @param string $postalCode
   */
  public function setPostalCode($postalCode)
  {
    $this->postalCode = $postalCode;
  }
  /**
   * @return string
   */
  public function getPostalCode()
  {
    return $this->postalCode;
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(PaymentAddress::class, 'Google_Service_SubscribewithGoogle_PaymentAddress');
