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

namespace Google\Service\WebContentPublisher;

class RrmProduct extends \Google\Model
{
  /**
   * Optional. Whether the RRM product is enabled for the publication.
   *
   * @var bool
   */
  public $enabled;
  /**
   * Output only. The URL to the product-specific Terms of Service.
   *
   * @var string
   */
  public $productTosUrl;
  protected $tosAcceptanceType = TosAcceptance::class;
  protected $tosAcceptanceDataType = '';

  /**
   * Optional. Whether the RRM product is enabled for the publication.
   *
   * @param bool $enabled
   */
  public function setEnabled($enabled)
  {
    $this->enabled = $enabled;
  }
  /**
   * @return bool
   */
  public function getEnabled()
  {
    return $this->enabled;
  }
  /**
   * Output only. The URL to the product-specific Terms of Service.
   *
   * @param string $productTosUrl
   */
  public function setProductTosUrl($productTosUrl)
  {
    $this->productTosUrl = $productTosUrl;
  }
  /**
   * @return string
   */
  public function getProductTosUrl()
  {
    return $this->productTosUrl;
  }
  /**
   * Optional. The details of the TOS acceptance.
   *
   * @param TosAcceptance $tosAcceptance
   */
  public function setTosAcceptance(TosAcceptance $tosAcceptance)
  {
    $this->tosAcceptance = $tosAcceptance;
  }
  /**
   * @return TosAcceptance
   */
  public function getTosAcceptance()
  {
    return $this->tosAcceptance;
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(RrmProduct::class, 'Google_Service_WebContentPublisher_RrmProduct');
