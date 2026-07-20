package com.codedna.ai.model;

import jakarta.persistence.*;

@Entity
@Table(name = "system_settings")
public class SystemSetting {

    @Id
    @Column(name = "key_name")
    private String keyName;

    @Column(name = "key_value", length = 1000)
    private String keyValue;

    public SystemSetting() {}

    public SystemSetting(String keyName, String keyValue) {
        this.keyName = keyName;
        this.keyValue = keyValue;
    }

    public String getKeyName() { return keyName; }
    public void setKeyName(String keyName) { this.keyName = keyName; }

    public String getKeyValue() { return keyValue; }
    public void setKeyValue(String keyValue) { this.keyValue = keyValue; }
}
