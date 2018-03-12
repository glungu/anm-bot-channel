# anm-bot-channel

##Settings:

**1) 10.anm.dictionaries.json**
```
  {
    "classname": "com.jnetx.app.ngw.dal.gemfire.entity.ChannelTypeEntity",
    "region": "dictionaries",
    "entity": {
      "code": 15,
      "title": "CHAT_BOT",
      "deliveryReportSupported": false,
      "metaProperties": [
        {
          "key": "toAddress",
          "title": "Address",
          "storageType": "channel",
          "typeID": 10
        }
      ],
      "properties": {
        "channelType/subjectCanBeEdited": true
      },
      "typeID": 4
    }
  },
  {
    "classname": "com.jnetx.app.ngw.dal.gemfire.entity.NMProtocolEntity",
    "region": "dictionaries",
    "entity": {
      "id": 12,
      "channelType": 15,
      "name": "default",
      "typeID": 8
    }
  }
```

**2) 20.anm.operators.json in "channelTypeMap"**
```
  "15": {
    "channelType": 15,
    "defaultProtocol": 12,
    "channels": {
      "12": {
        "defaultSourceAddress": "",
        "roamingRestricted": true,
        "deferredRate": 10,
        "enabled": true,
        "properties": {}
      }
    },
    "online": false,
    "fifoUsed": true,
    "properties": {},
    "typeID": 0
  }
```
**3) Move:** 
      **_chat-bot-rest-api.war_** to ../runtime/ANM_1.1/slee/webapp/
      **_anm-nm-delivery-chat-bot.du.290.jar_**  to ../runtime/ANM_1.1/slee/deploy/

**4) Create event with id 'bot_event' and default delivery channels CHAT_BOT and template:
example:** 
```
{
  title: "Up to 75 Mbps Download Speeds Up to 75 Mbps Download Speeds Up to 75 Mbps Download Speeds",
  type: data,
  description: "Limited time - FREE Professional InstallationAdd X1 DVR free for 12 monthsTalk as much as you want to nearly half the world",
  url: "http://aaaa",
  expired: "2018/04/01 21:02:44"
}
```

**5) Create any subscriber for example id 123:**


**6) Send soup via SOUP UI**

Example: Direct addressing request for subscriber '123':
```
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
    <soap:Body>
        <ns2:pushRequest xmlns:ns2="http://amdocs.com/wsdl/service/nm/triggering/v3_0"
            xmlns:ns3="http://amdocs.com/schema/service/asmfw/types/v2_0">
            <ns2:sourceId>sId</ns2:sourceId>
            <ns2:event xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                xmlns:ns5="http://amdocs.com/schema/service/nm/types/v3_0"
                xsi:type="ns5:NotificationEventIdentifier">
                <eventId>bot_event</eventId>
            </ns2:event>
            <ns2:target xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                xmlns:ns5="http://amdocs.com/schema/service/nm/types/v3_0"
                xsi:type="ns5:NotificationTargetIdentifier">
                <targetId>123</targetId>
                <overrideTarget>
                    <address>200501</address>
                    <channelType>CHAT_BOT</channelType>
                    <protocol>default</protocol>
                    <languageId>en-US</languageId>
                </overrideTarget>
            </ns2:target>
        </ns2:pushRequest>
    </soap:Body>
</soap:Envelope>
```

**Table in Oracle**
```
create table NM_BOT_RECORD
(
  ID NUMBER not null
    primary key,
  TITLE VARCHAR2(255),
  TYPE VARCHAR2(10),
  DESCRIPTION VARCHAR2(255),
  URL VARCHAR2(255),
  EXPIRED DATE,
  STATUS VARCHAR2(10),
  USERID NUMBER(19) default 0 not null
)
```
