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

class GoogleAnalyticsAdminV1alphaSKAdNetworkConversionValueSchema extends \Google\Model
{
  /**
   * @var bool
   */
  public $applyConversionValues;
  /**
   * @var string
   */
  public $name;
  protected $postbackWindowOneType = GoogleAnalyticsAdminV1alphaPostbackWindow::class;
  protected $postbackWindowOneDataType = '';
  protected $postbackWindowThreeType = GoogleAnalyticsAdminV1alphaPostbackWindow::class;
  protected $postbackWindowThreeDataType = '';
  protected $postbackWindowTwoType = GoogleAnalyticsAdminV1alphaPostbackWindow::class;
  protected $postbackWindowTwoDataType = '';

  /**
   * @param bool
   */
  public function setApplyConversionValues($applyConversionValues)
  {
    $this->applyConversionValues = $applyConversionValues;
  }
  /**
   * @return bool
   */
  public function getApplyConversionValues()
  {
    return $this->applyConversionValues;
  }
  /**
   * @param string
   */
  public function setName($name)
  {
    $this->name = $name;
  }
  /**
   * @return string
   */
  public function getName()
  {
    return $this->name;
  }
  /**
   * @param GoogleAnalyticsAdminV1alphaPostbackWindow
   */
  public function setPostbackWindowOne(GoogleAnalyticsAdminV1alphaPostbackWindow $postbackWindowOne)
  {
    $this->postbackWindowOne = $postbackWindowOne;
  }
  /**
   * @return GoogleAnalyticsAdminV1alphaPostbackWindow
   */
  public function getPostbackWindowOne()
  {
    return $this->postbackWindowOne;
  }
  /**
   * @param GoogleAnalyticsAdminV1alphaPostbackWindow
   */
  public function setPostbackWindowThree(GoogleAnalyticsAdminV1alphaPostbackWindow $postbackWindowThree)
  {
    $this->postbackWindowThree = $postbackWindowThree;
  }
  /**
   * @return GoogleAnalyticsAdminV1alphaPostbackWindow
   */
  public function getPostbackWindowThree()
  {
    return $this->postbackWindowThree;
  }
  /**
   * @param GoogleAnalyticsAdminV1alphaPostbackWindow
   */
  public function setPostbackWindowTwo(GoogleAnalyticsAdminV1alphaPostbackWindow $postbackWindowTwo)
  {
    $this->postbackWindowTwo = $postbackWindowTwo;
  }
  /**
   * @return GoogleAnalyticsAdminV1alphaPostbackWindow
   */
  public function getPostbackWindowTwo()
  {
    return $this->postbackWindowTwo;
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(GoogleAnalyticsAdminV1alphaSKAdNetworkConversionValueSchema::class, 'Google_Service_GoogleAnalyticsAdmin_GoogleAnalyticsAdminV1alphaSKAdNetworkConversionValueSchema');
