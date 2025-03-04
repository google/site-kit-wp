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

namespace Google\Service\GoogleAnalyticsAdmin;

class GoogleAnalyticsAdminV1alphaAccessOrderByDimensionOrderBy extends \Google\Model
{
  /**
   * @var string
   */
  public $dimensionName;
  /**
   * @var string
   */
  public $orderType;

  /**
   * @param string
   */
  public function setDimensionName($dimensionName)
  {
    $this->dimensionName = $dimensionName;
  }
  /**
   * @return string
   */
  public function getDimensionName()
  {
    return $this->dimensionName;
  }
  /**
   * @param string
   */
  public function setOrderType($orderType)
  {
    $this->orderType = $orderType;
  }
  /**
   * @return string
   */
  public function getOrderType()
  {
    return $this->orderType;
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(GoogleAnalyticsAdminV1alphaAccessOrderByDimensionOrderBy::class, 'Google_Service_GoogleAnalyticsAdmin_GoogleAnalyticsAdminV1alphaAccessOrderByDimensionOrderBy');
