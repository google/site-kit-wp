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

class GoogleAnalyticsAdminV1betaConversionEvent extends \Google\Model
{
  /**
   * @var string
   */
  public $countingMethod;
  /**
   * @var string
   */
  public $createTime;
  /**
   * @var bool
   */
  public $custom;
  protected $defaultConversionValueType = GoogleAnalyticsAdminV1betaConversionEventDefaultConversionValue::class;
  protected $defaultConversionValueDataType = '';
  /**
   * @var bool
   */
  public $deletable;
  /**
   * @var string
   */
  public $eventName;
  /**
   * @var string
   */
  public $name;

  /**
   * @param string
   */
  public function setCountingMethod($countingMethod)
  {
    $this->countingMethod = $countingMethod;
  }
  /**
   * @return string
   */
  public function getCountingMethod()
  {
    return $this->countingMethod;
  }
  /**
   * @param string
   */
  public function setCreateTime($createTime)
  {
    $this->createTime = $createTime;
  }
  /**
   * @return string
   */
  public function getCreateTime()
  {
    return $this->createTime;
  }
  /**
   * @param bool
   */
  public function setCustom($custom)
  {
    $this->custom = $custom;
  }
  /**
   * @return bool
   */
  public function getCustom()
  {
    return $this->custom;
  }
  /**
   * @param GoogleAnalyticsAdminV1betaConversionEventDefaultConversionValue
   */
  public function setDefaultConversionValue(GoogleAnalyticsAdminV1betaConversionEventDefaultConversionValue $defaultConversionValue)
  {
    $this->defaultConversionValue = $defaultConversionValue;
  }
  /**
   * @return GoogleAnalyticsAdminV1betaConversionEventDefaultConversionValue
   */
  public function getDefaultConversionValue()
  {
    return $this->defaultConversionValue;
  }
  /**
   * @param bool
   */
  public function setDeletable($deletable)
  {
    $this->deletable = $deletable;
  }
  /**
   * @return bool
   */
  public function getDeletable()
  {
    return $this->deletable;
  }
  /**
   * @param string
   */
  public function setEventName($eventName)
  {
    $this->eventName = $eventName;
  }
  /**
   * @return string
   */
  public function getEventName()
  {
    return $this->eventName;
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
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(GoogleAnalyticsAdminV1betaConversionEvent::class, 'Google_Service_GoogleAnalyticsAdmin_GoogleAnalyticsAdminV1betaConversionEvent');
