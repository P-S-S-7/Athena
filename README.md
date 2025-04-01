# **Freshdesk API**
## **List All Tickets**

### **Endpoint**  
```http
GET https://966aryanraj.freshdesk.com/api/v2/tickets
```

### **Authentication**  
Use **Basic Authentication** with your API key.

### **Headers**
```http
Authorization: Basic YOUR_API_KEY:X
```

### **cURL Request**  
```sh
curl -v -u YOUR_API_KEY:X -X GET "https://966aryanraj.freshdesk.com/api/v2/tickets"
```
- This will only fetch a maximum of 30 tickets.To fetch more tickets in a single API request use per_page and page.

### **cURL Request**  
```sh
curl -v -u YOUR_API_KEY:X -X GET "https://966aryanraj.freshdesk.com/api/v2/tickets?per_page=100&page=1"
```

- This can fetch a maximum of 100 tickets.

---

## **Filters**  

### **Predefined Filters**
Retrieve specific tickets using filters:  
```http
GET /api/v2/tickets?filter=[filter_name]
```
**Available filters:**
- `new_and_my_open`
- `watching`
- `spam`
- `deleted`

### **Filter by Last Updated**
```http
GET /api/v2/tickets?updated_since=YYYY-MM-DDTHH:MM:SSZ
```
**Example:**
```http
GET /api/v2/tickets?updated_since=2015-01-19T02:00:00Z
```
- As 'created_since' filter is not available.

### **Query for Last Created**
```http
GET /api/v2/search/tickets?query=%22created_at:%3E%27YYYY-MM-DD%27%22
```
**Example:**
```http
GET /api/v2/search/tickets?query=%22created_at:%3E%272025-03-31%27%22
```

---

## **Sorting**  
### **Sort by Fields**
```http
GET /api/v2/tickets?order_by=[created_at|due_by|updated_at|status]
```
**Example:**
```http
GET /api/v2/tickets?order_by=created_at
```

### **Sort Order**
```http
GET /api/v2/tickets?order_type=[asc|desc]
```
**Example:**
```http
GET /api/v2/tickets?order_by=created_at&order_type=asc
```

---


## **Response**
```json
[
  {
    "cc_emails": ["966aryanraj@gmail.com"],
    "fwd_emails": [],
    "reply_cc_emails": ["966aryanraj@gmail.com"],
    "ticket_cc_emails": [],
    "ticket_bcc_emails": [],
    "fr_escalated": false,
    "spam": false,
    "email_config_id": 1070000112341,
    "group_id": null,
    "priority": 1,
    "requester_id": 1070040306628,
    "responder_id": null,
    "source": 1,
    "company_id": 1070000567392,
    "status": 2,
    "subject": "Please recheck the webhook settings in your account",
    "association_type": null,
    "support_email": "support@966aryanraj.freshdesk.com",
    "to_emails": ["966aryanraj@gmail.com"],
    "product_id": 1070000100197,
    "id": 125,
    "type": null,
    "due_by": "2025-04-04T07:10:23Z",
    "fr_due_by": "2025-04-02T07:10:23Z",
    "is_escalated": false,
    "custom_fields": {
      "cf_abc": null
    },
    "created_at": "2025-04-01T07:10:23Z",
    "updated_at": "2025-04-01T07:10:23Z",
    "associated_tickets_count": null,
    "tags": []
  },
  {
    "cc_emails": ["966aryanraj@gmail.com"],
    "fwd_emails": [],
    "reply_cc_emails": ["966aryanraj@gmail.com"],
    "ticket_cc_emails": [],
    "ticket_bcc_emails": [],
    "fr_escalated": false,
    "spam": false,
    "email_config_id": 1070000112341,
    "group_id": 1070000347970,
    "priority": 1,
    "requester_id": 1070041318356,
    "responder_id": null,
    "source": 1,
    "company_id": null,
    "status": 2,
    "subject": "Welcome to Your EA Account",
    "association_type": null,
    "support_email": "support@966aryanraj.freshdesk.com",
    "to_emails": ["966aryanraj@gmail.com"],
    "product_id": 1070000100197,
    "id": 124,
    "type": null,
    "due_by": "2025-04-03T17:58:57Z",
    "fr_due_by": "2025-04-01T17:58:57Z",
    "is_escalated": false,
    "custom_fields": {
      "cf_abc": null
    },
    "created_at": "2025-03-31T17:49:21Z",
    "updated_at": "2025-04-01T05:44:23Z",
    "associated_tickets_count": null,
    "tags": []
  }
]
```

- /tickets API do not include attachments of tickets.To fetch attachments, we need to call /tickets/:id API.

---

## **View a Ticket**

### **Endpoint**

```http
GET https://966aryanraj.freshdesk.com/api/v2/tickets/[id]
```

### **Authentication**
Use **Basic Authentication** with your API key.

### **Headers**

```http
Authorization: Basic YOUR_API_KEY:X
```

### **cURL Request**

```sh
curl -v -u YOUR_API_KEY:X -H "Content-Type: application/json" -X GET 'https://966aryanraj.freshdesk.com/api/v2/tickets/20'
```

---

## **Include Additional Details**

Each include will consume an additional API credit. For example, if you embed the requester and company information, you will be charged a total of 3 API credits for the call.

### **Available Includes**

| Embed | URL | Description |
|-------|-----|-------------|
| conversations | `/api/v2/tickets/[id]?include=conversations` | Returns up to ten conversations sorted by "created_at" in ascending order. Consumes two API calls. For more than ten conversations, use the List All Conversations of a Ticket API. |
| requester | `/api/v2/tickets/[id]?include=requester` | Returns the requester's email, id, mobile, name, and phone. |
| company | `/api/v2/tickets/[id]?include=company` | Returns the company's id and name. |
| stats | `/api/v2/tickets/[id]?include=stats` | Returns the ticket's closed_at, resolved_at and first_responded_at times. |

### **cURL Examples**

1. Get the associated conversations along with the ticket response:

```sh
curl -v -u YOUR_API_KEY:X -X GET 'https://966aryanraj.freshdesk.com/api/v2/tickets/20?include=conversations'
```

2. Get the associated company and requester information along with the ticket response:

```sh
curl -v -u YOUR_API_KEY:X -X GET 'https://966aryanraj.freshdesk.com/api/v2/tickets/20?include=company,requester'
```

3. Get the associated stats information along with the ticket response:

```sh
curl -v -u YOUR_API_KEY:X -X GET 'https://966aryanraj.freshdesk.com/api/v2/tickets/20?include=stats'
```

---

## **Response**

```json
{
  "cc_emails": ["user@cc.com"],
  "fwd_emails": [],
  "reply_cc_emails": ["user@cc.com"],
  "email_config_id": null,
  "fr_escalated": false,
  "group_id": null,
  "priority": 1,
  "requester_id": 1,
  "responder_id": null,
  "source": 2,
  "spam": false,
  "status": 2,
  "subject": "",
  "company_id": 1,
  "id": 20,
  "type": null,
  "to_emails": null,
  "product_id": null,
  "created_at": "2015-08-24T11:56:51Z",
  "updated_at": "2015-08-24T11:59:05Z",
  "due_by": "2015-08-27T11:30:00Z",
  "fr_due_by": "2015-08-25T11:30:00Z",
  "is_escalated": false,
  "association_type": null,
  "description_text": "Not given.",
  "description": "<div>Not given.</div>",
  "custom_fields": {
    "category": "Primary"
  },
  "tags": [],
  "attachments": []
}
```

**Note**: By default, certain fields such as conversations, company name, and requester email will not be included in the response. They can be retrieved using the embedding functionality described above.

---

## **Create a Ticket**

### **Endpoint**

```http
POST https://966aryanraj.freshdesk.com/api/v2/tickets
```

### **Authentication**
Use **Basic Authentication** with your API key.

### **Headers**

```http
Authorization: Basic YOUR_API_KEY:X
Content-Type: application/json
```

## **Examples**

### **Basic Ticket Creation**

#### **cURL Request**

```sh
curl -v -u YOUR_API_KEY:X -H "Content-Type: application/json" -d '{
  "description": "Details about the issue...",
  "subject": "Support Needed...",
  "email": "tom@outerspace.com",
  "priority": 1,
  "status": 2,
  "cc_emails": ["ram@freshdesk.com","diana@freshdesk.com"]
}' -X POST 'https://966aryanraj.freshdesk.com/api/v2/tickets'
```

#### **Response**

```json
{
  "cc_emails": ["ram@freshdesk.com", "diana@freshdesk.com"],
  "fwd_emails": [],
  "reply_cc_emails": ["ram@freshdesk.com", "diana@freshdesk.com"],
  "email_config_id": null,
  "group_id": null,
  "priority": 1,
  "requester_id": 129,
  "responder_id": null,
  "source": 2,
  "status": 2,
  "subject": "Support needed..",
  "company_id": 1,
  "id": 1,
  "type": "Question",
  "to_emails": null,
  "product_id": null,
  "fr_escalated": false,
  "spam": false,
  "urgent": false,
  "is_escalated": false,
  "created_at": "2015-07-09T13:08:06Z",
  "updated_at": "2015-07-23T04:41:12Z",
  "due_by": "2015-07-14T13:08:06Z",
  "fr_due_by": "2015-07-10T13:08:06Z",
  "description_text": "Some details on the issue ...",
  "description": "<div>Some details on the issue ..</div>",
  "tags": [],
  "attachments": []
}
```

---

### **Create a Ticket With Custom Fields**

#### **cURL Request**

```sh
curl -v -u YOUR_API_KEY:X -H "Content-Type: application/json" -d '{
  "description": "Details about the issue...",
  "subject": "Support Needed...",
  "email": "tom@outerspace.com",
  "priority": 1,
  "status": 2,
  "cc_emails": ["ram@freshdesk.com","diana@freshdesk.com"],
  "custom_fields": {
    "category": "Primary"
  }
}' -X POST 'https://966aryanraj.freshdesk.com/api/v2/tickets'
```

#### **Response**

```json
{
  "cc_emails": ["ram@freshdesk.com", "diana@freshdesk.com"],
  "fwd_emails": [],
  "reply_cc_emails": ["ram@freshdesk.com", "diana@freshdesk.com"],
  "email_config_id": null,
  "group_id": null,
  "priority": 1,
  "requester_id": 129,
  "responder_id": null,
  "source": 2,
  "status": 2,
  "subject": "Support needed..",
  "company_id": 1,
  "id": 1,
  "type": "Question",
  "to_emails": null,
  "product_id": null,
  "fr_escalated": false,
  "spam": false,
  "urgent": false,
  "is_escalated": false,
  "created_at": "2015-07-09T13:08:06Z",
  "updated_at": "2015-07-23T04:41:12Z",
  "due_by": "2015-07-14T13:08:06Z",
  "fr_due_by": "2015-07-10T13:08:06Z",
  "description_text": "Some details on the issue ...",
  "description": "<div>Some details on the issue ..</div>",
  "custom_fields": {
    "category": "Primary"
  },
  "tags": [],
  "attachments": []
}
```
---

### **Create a Ticket With Attachment**

**Notes:**
1. This API request must have its Content-Type set to multipart/form-data.

#### **cURL Request**

```sh
curl -v -u YOUR_API_KEY:X -F "attachments[]=@/path/to/attachment1.ext" -F "attachments[]=@/path/to/attachment2.ext" -F "email=example@example.com" -F "subject=Ticket Title" -F "description=this is a sample ticket" -X POST 'https://966aryanraj.freshdesk.com/api/v2/tickets'
```

#### **Response**

```json
{
  "cc_emails": ["ram@freshdesk.com", "diana@freshdesk.com"],
  "fwd_emails": [],
  "reply_cc_emails": ["ram@freshdesk.com", "diana@freshdesk.com"],
  "email_config_id": null,
  "group_id": null,
  "priority": 1,
  "requester_id": 129,
  "responder_id": null,
  "source": 2,
  "status": 2,
  "subject": "Ticket Title",
  "id": 1,
  "type": "Question",
  "to_emails": null,
  "product_id": null,
  "fr_escalated": false,
  "spam": false,
  "urgent": false,
  "is_escalated": false,
  "created_at": "2015-07-09T13:08:06Z",
  "updated_at": "2015-07-23T04:41:12Z",
  "due_by": "2015-07-14T13:08:06Z",
  "fr_due_by": "2015-07-10T13:08:06Z",
  "description_text": "this is a sample ticket",
  "description": "<div>this is a sample ticket</div>",
  "custom_fields": {
    "category": null
  },
  "tags": [],
  "attachments": [
    {
      "id": 4004881085,
      "content_type": "image/jpeg",
      "file_size": 44115,
      "name": "attachment1.jpg",
      "attachment_url": "https://cdn.freshdesk.com/data/helpdesk/attachments/production/4004881085/original/attachment.jpg",
      "created_at": "2014-07-28T16:20:03+05:30",
      "updated_at": "2014-07-28T16:20:03+05:30"
    },
    {
      "id": 4004881086,
      "content_type": "image/jpeg",
      "file_size": 44134,
      "name": "attachment2.jpg",
      "attachment_url": "https://cdn.freshdesk.com/data/helpdesk/attachments/production/4004881085/original/attachment2.jpg",
      "created_at": "2014-07-28T16:20:03+05:30",
      "updated_at": "2014-07-28T16:20:03+05:30"
    }
  ]
}
```
---

## Update a ticket

### **Endpoint**

```http
PUT https://966aryanraj.freshdesk.com/api/v2/tickets/:id
```

### **Authentication**
Use **Basic Authentication** with your API key.

### **Headers**

```http
Authorization: Basic YOUR_API_KEY:X
Content-Type: application/json
```

### cURL Request

```sh
curl -v -u czkLIPycy4eiGJLob5wi:X -H "Content-Type: application/json" -X PUT -d '{ "priority":2, "status":3 }' 'https://966aryanraj.freshdesk.com/api/v2/tickets/1'
```

### Response

```json
{
  "cc_emails" : [ ],
  "fwd_emails" : [ ],
  "reply_cc_emails" : [ ],
  "description_text" : "Not given.",
  "description" : "<div>Not given.</div>",
  "spam" : false,
  "email_config_id" : null,
  "fr_escalated" : false,
  "group_id" : null,
  "priority" : 2,
  "requester_id" : 1,
  "responder_id" : null,
  "source" : 3,
  "status" : 3,
  "subject" : "",
  "id" : 20,
  "type" : null,
  "to_emails" : null,
  "product_id" : null,
  "attachments" : [ ],
  "is_escalated" : false,
  "tags" : [ ],
  "created_at" : "2015-08-24T11:56:51Z",
  "updated_at" : "2015-08-24T11:59:05Z",
  "due_by" : "2015-08-27T11:30:00Z",
  "fr_due_by" : "2015-08-25T11:30:00Z"
}
```
---

## Update Multiple Tickets

### **Endpoint**

```http
PUT https://966aryanraj.freshdesk.com/api/v2/tickets/bulk_update
```

### **Authentication**
Use **Basic Authentication** with your API key.

### **Headers**

```http
Authorization: Basic YOUR_API_KEY:X
Content-Type: application/json
```

### cURL Request

```sh
curl -v -u czkLIPycy4eiGJLob5wi:X -H "Content-Type: application/json" -X POST -d '{"bulk_action": {"ids": [20,21,22],"properties":{"from_email":"support@freshdesk.com","status":2,"group_id":1234,"type":"Question","priority":4},"reply":{"body":"Please check this ticket"}}}' 'https://966aryanraj.freshdesk.com/api/v2/tickets/bulk_update'
```

### Response

```json
{ 
"job_id": "e4d18654f60b5204513155b26c6cb",
 "href":"https://966aryanraj.freshdesk.com/api/v2/jobs/e4d18654f60b5204513155b26c6cb"
 }
```

- Using bulk_update, we can only perform update on multiple tickets with same changes.Not different changes on different tickets.

---

## Delete a Ticket

### **Endpoint**

```http
DELETE https://966aryanraj.freshdesk.com/api/v2/tickets/[id]
```

### **Authentication**
Use **Basic Authentication** with your API key.

### **Headers**

```http
Authorization: Basic YOUR_API_KEY:X
Content-Type: application/json
```

### cURL Request

```sh
curl -v -u czkLIPycy4eiGJLob5wi:X -X DELETE 'https://966aryanraj.freshdesk.com/api/v2/tickets/1'
```

### Response

```json
HTTP Status: 204 No Content
```
---

## Delete Multiple Tickets

### **Endpoint**

```http
DELETE https://966aryanraj.freshdesk.com/api/v2/tickets/bulk_delete 
```

### **Authentication**
Use **Basic Authentication** with your API key.

### **Headers**

```http
Authorization: Basic YOUR_API_KEY:X
Content-Type: application/json
```

### cURL Request

```sh
curl -v -u czkLIPycy4eiGJLob5wi:X -H "Content-Type: application/json" -X POST -d '{"bulk_action": {"ids": [20,21,22]}}' 'https://966aryanraj.freshdesk.com/api/v2/tickets/bulk_delete'
```

### Response

```json
{ 
"job_id": "e4d18654f60b5204513155b26c6cb630",
 "href":"https://966aryanraj.freshdesk.com/api/v2/jobs/e4d18654f60b5204513155b26c6cb630"
}
```
---

## Delete an attachment

### **Endpoint**

```http
DELETE https://966aryanraj.freshdesk.com/api/v2/attachments/[id]
```

### **Authentication**
Use **Basic Authentication** with your API key.

### **Headers**

```http
Authorization: Basic YOUR_API_KEY:X
Content-Type: application/json
```

### cURL Request

```sh
curl -v -u czkLIPycy4eiGJLob5wi:X -X DELETE 'https://966aryanraj.freshdesk.com/api/v2/attachments/1'
```

### Response

```json
HTTP Status: 204 No Content
```

---

## List All Conversations of a Ticket

### **Endpoint**

```http
GET https://966aryanraj.freshdesk.com/api/v2/tickets/[id]/conversations
```

### **Authentication**
Use **Basic Authentication** with your API key.

### **Headers**

```http
Authorization: Basic YOUR_API_KEY:X
Content-Type: application/json
```

### cURL Request

```sh
curl -v -u czkLIPycy4eiGJLob5wi:X -H "Content-Type: application/json" -X GET 'https://966aryanraj.freshdesk.com/api/v2/tickets/20/conversations'
```

### Response

```json
[
  {
    "body_text" : "Please reply as soon as possible.",
    "body" : "<div>Please reply as soon as possible.</div>",
    "id" : 3,
    "incoming" : false,
    "private" : true,
    "user_id" : 1,
    "support_email" : null,
    "source" : 2,
    "ticket_id" : 20,
    "created_at" : "2015-08-24T11:59:05Z",
    "updated_at" : "2015-08-24T11:59:05Z",
    "from_email" : "agent2@yourcompany.com",
    "to_emails" : ["agent1@yourcompany.com"],
    "cc_emails": ["example@ccemail.com"],
    "bcc_emails": ["example@bccemail.com"],
    "attachments" : [ ],
    "last_edited_at" : "2015-08-24T11:59:59Z",
    "last_edited_user_id" : 2
  }
]
```

- The maximum of 30 conversations can be fetched via above API.If a ticket has more than 30 conversations, they can be fetched via

```sh
curl -v -u czkLIPycy4eiGJLob5wi:X -X GET 'https://966aryanraj.freshdesk.com/api/v2/tickets/1/conversations?page=2'
```

- and so on.

## Create a Conversation

### Create a Reply

#### **Endpoint**

```http
POST https://966aryanraj.freshdesk.com/api/v2/tickets/[id]/reply
```

#### **Authentication**
Use **Basic Authentication** with your API key.

#### **Headers**

```http
Authorization: Basic YOUR_API_KEY:X
Content-Type: application/json
```

#### cURL Request

```sh
curl -v -u czkLIPycy4eiGJLob5wi:X -H "Content-Type: application/json" -X POST -d '{ "body":"We are working on this issue. Will keep you posted." }' 'https://966aryanraj.freshdesk.com/api/v2/tickets/141/reply'
```

#### Response

```json
{
  "body_text" : "We are working on this issue. Will keep you posted.",
  "body" : "<div>We are working on this issue. Will keep you posted.</div>",
  "id" : 4,
  "user_id" : 1,
  "from_email" : "support@yourcompany.com",
  "cc_emails" : [ ],
  "bcc_emails" : [ ],
  "ticket_id" : 141,
  "replied_to" : [
    "sample@yourcustomer.com"
  ],
  "attachments" : [ ],
  "created_at" : "2015-08-24T13:36:42Z",
  "updated_at" : "2015-08-24T13:36:42Z"
}
```

#### Reply to a Ticket with Attachment

- This API request must have its Content-Type set to multipart/form-data.

##### cURL Request

```sh
curl -v -u czkLIPycy4eiGJLob5wi:X -F "attachments[]=@/path/to/attachment1.txt" -F "body=this is a sample reply" -X POST 'https://966aryanraj.freshdesk.com/api/v2/tickets/27/reply'
```

##### Response

```json
{
  "body_text": "this is a sample reply",
  "body": "<div>this is a sample reply</div>",
  "id": 125,
  "user_id": 1,
  "from_email": "support@yourcompany.com",
  "cc_emails": [],
  "bcc_emails": [],
  "ticket_id": 27,
  "replied_to": ["sample@yourcustomer.com"],
  "attachments": [
    {
      "id": 6013284906,
      "content_type": "text/plain",
      "size": 98,
      "name": "data.txt",
      "attachment_url": "https://cdn.freshdesk.com/data/helpdesk/attachments/production/6013284906/original/attachment1.txt",
      "created_at": "2016-01-13T07:07:41Z",
      "updated_at": "2016-01-13T07:07:41Z"
    }
  ],
  "created_at": "2016-01-13T07:07:41Z",
  "updated_at": "2016-01-13T07:07:41Z"
}
```

---

### Create a Note

#### **Endpoint**

```http
POST https://966aryanraj.freshdesk.com/api/v2/tickets/[ticket_id]/notes
```

#### **Authentication**
Use **Basic Authentication** with your API key.

#### **Headers**

```http
Authorization: Basic YOUR_API_KEY:X
Content-Type: application/json
```

#### cURL Request

```sh
curl -v -u czkLIPycy4eiGJLob5wi:X -H "Content-Type: application/json" -X POST -d '{ "body":"Hi tom, Still Angry", "private":false, "notify_emails":["tom@yourcompany.com"] }' 'https://966aryanraj.freshdesk.com/api/v2/tickets/3/notes'
```

#### Response

```json
{
  "body_text": "Hi tom, Still Angry",
  "body": "<div>Hi tom, Still Angry</div>",
  "id": 5,
  "incoming": false,
  "private": false,
  "user_id": 1,
  "support_email": null,
  "ticket_id": 3,
  "notified_to": ["tom@yourcompany.com"],
  "attachments": [],
  "created_at": "2015-08-24T13:49:37Z",
  "updated_at": "2015-08-24T13:49:37Z"
}
```

#### Create a Note with Attachment

- This API request must have its Content-Type set to multipart/form-data.

##### cURL Request

```sh
curl -v -u czkLIPycy4eiGJLob5wi:X -F "attachments[]=@/path/to/attachment1.ext" -F "body=Hi tom, Still Angry" -F "notify_emails[]=tom@yourcompany.com" -X POST 'https://966aryanraj.freshdesk.com/api/v2/tickets/20/notes'
```

##### Response

```json
{
  "body_text": "Hi tom, Still Angry",
  "body": "<div>Hi tom, Still Angry</div>",
  "id": 5,
  "incoming": false,
  "private": false,
  "user_id": 1,
  "support_email": null,
  "ticket_id": 20,
  "notified_to": ["tom@yourcompany.com"],
  "attachments": [
    {
      "id": 4004881085,
      "content_type": "image/jpeg",
      "file_size": 44115,
      "name": "attachment1.jpg",
      "attachment_url": "https://cdn.freshdesk.com/data/helpdesk/attachments/production/4004881085/original/attachment1.jpg",
      "created_at": "2014-07-28T16:20:03+05:30",
      "updated_at": "2014-07-28T16:20:03+05:30"
    }
  ],
  "created_at": "2015-08-24T13:49:37Z",
  "updated_at": "2015-08-24T13:49:37Z"
}
```

---

### Create a Forward

#### **Endpoint**

```http
POST https://966aryanraj.freshdesk.com/api/v2/tickets/[ticket_id]/forward 
```

#### **Authentication**
Use **Basic Authentication** with your API key.

#### **Headers**

```http
Authorization: Basic YOUR_API_KEY:X
Content-Type: application/json
```

#### cURL Request

```sh
curl -v -u czkLIPycy4eiGJLob5wi:X -H "Content-Type: application/json" -X POST -d '{ "body":"Hi tom, Still Angry", "to_emails": ["user@company.com"]}' 'https://966aryanraj.freshdesk.com/api/v2/tickets/3/forward'
```

#### Response

```json
{
  "body":"<div>Hi tom, Still Angry</div>",
  "body_text":"Hi tom, Still Angry",
  "id":35131396111,
  "incoming":false,
  "private":true,
  "user_id":35008297863,
  "support_email":"support@966aryanraj.freshdesk.com",
  "source":8,
  "category":2,
  "ticket_id":3,
  "to_emails":["user@company..com"],
  "from_email":"\"Agent Bob\" <support@966aryanraj.freshdesk.com>",
  "cc_emails":[],
  "bcc_emails":[],
  "email_failure_count":null,
  "outgoing_failures":null,
  "created_at":"2020-08-24T05:53:09Z",
  "updated_at":"2020-08-24T05:53:09Z",
  "attachments":[],
  "deleted":false,
  "last_edited_at":null,
  "last_edited_user_id":null,
  "cloud_files":[],
  "has_quoted_text":true
}
```

---

## Update a Conversation

- Only public & private notes can be edited.

### **Endpoint**

```http
PUT https://966aryanraj.freshdesk.com/api/v2/conversations/[id] 
```

### **Authentication**
Use **Basic Authentication** with your API key.

### **Headers**

```http
Authorization: Basic YOUR_API_KEY:X
Content-Type: application/json
```

### cURL Request

```sh
curl -v -u czkLIPycy4eiGJLob5wi:X -H "Content-Type: application/json" -X PUT -d '{ "body":"Can you provide some screenshots?" }' 'https://966aryanraj.freshdesk.com/api/v2/conversations/5'
```

### Response

```json
{
  "body_text" : "Can you provide some screenshots?",
  "body" : "<div>Can you provide some screenshots?</div>",
  "id" : 5,
  "incoming" : false,
  "private" : false,
  "user_id" : 1,
  "support_email" : null,
  "ticket_id" : 20,
  "notified_to" : ["tom@yourcompany.com"],
  "attachments" : [ ],
  "created_at" : "2015-08-24T13:49:37Z",
  "updated_at" : "2015-08-24T13:49:37Z"
}
```

### Update a conversation With Attachment

- This API request must have its Content-Type set to multipart/form-data.

#### cURL Request

```sh
curl -v -u czkLIPycy4eiGJLob5wi:X -F "attachments[]=@/path/to/attachment1.txt" -F "body=updated conversation" -X PUT 'https://966aryanraj.freshdesk.com/api/v2/conversations/6'
```

#### Response

```json
{
  "body_text" : "updated conversation",
  "body" : "updated conversation",
  "id" : 6,
  "incoming" : false,
  "private" : false,
  "user_id" : 1,
  "support_email" : null,
  "ticket_id" : 20,
  "attachments" : [  
          { 
            "id":4004881085,
            "content_type":"image/jpeg",
            "file_size":44115,
            "name":"attachment1.jpg",
            "attachment_url":"https://cdn.freshdesk.com/data/helpdesk/attachments/production/4004881085/original/attachment1.txt"
            "created_at":"2014-07-28T16:20:03+05:30",
            "updated_at":"2014-07-28T16:20:03+05:30",
          }
      ],
  "created_at" : "2015-08-24T13:49:37+05:30",
  "updated_at" : "2014-07-28T16:20:03+05:30"
}
```

---

## Delete a Conversation

- Only notes and replies can be deleted.

### **Endpoint**

```http
DELETE https://966aryanraj.freshdesk.com/api/v2/conversations/[id] 
```

### **Authentication**
Use **Basic Authentication** with your API key.

### **Headers**

```http
Authorization: Basic YOUR_API_KEY:X
Content-Type: application/json
```

### cURL Request

```sh
curl -v -u czkLIPycy4eiGJLob5wi:X -X DELETE 'https://966aryanraj.freshdesk.com/api/v2/conversations/5'
```

### Response

```json
HTTP Status: 204 No Content
```

---

## Merge Tickets

### **Endpoint**

```http
PUT https://966aryanraj.freshdesk.com/api/v2/tickets/merge
```

### **Authentication**
Use **Basic Authentication** with your API key.

### **Headers**

```http
Authorization: Basic YOUR_API_KEY:X
Content-Type: application/json
```

### cURL Request

```sh
curl -v -u czkLIPycy4eiGJLob5wi:X -H "Content-Type: application/json" -X PUT -d '{"primary_id":20,"ticket_ids":[20,21,22],"convert_recepients_to_cc":true,"note_in_primary":{"body":"Sample note","private":true}}' 'https://966aryanraj.freshdesk.com/api/v2/tickets/merge
```

### Response

```json
HTTP Status: 204 No Content
```

---

## List All Ticket Fields

### **Endpoint**

```http
GET https://966aryanraj.freshdesk.com/api/v2/admin/ticket_fields
```

### **Authentication**
Use **Basic Authentication** with your API key.

### **Headers**

```http
Authorization: Basic YOUR_API_KEY:X
Content-Type: application/json
```

### cURL Request

```sh
curl -v -u czkLIPycy4eiGJLob5wi:X -X GET 'https://966aryanraj.freshdesk.com/api/v2/admin/ticket_fields'
```

### Response

```json
[ 
   { 
      "id":21,
      "name":"cf_issue_type",
      "label":"Issue Type",
      "label_for_customers":"Issue Type",
      "position":1,
      "type":"custom_dropdown",
      "default":false,
      "customers_can_edit":true,
      "required_for_closure":false,
      "required_for_agents":false,
      "required_for_customers":false,
      "displayed_to_customers":true,
      "created_at":"2019-12-16T09:35:26Z",
      "updated_at":"2019-12-16T09:35:27Z"
   },
   { 
      "id":20,
      "name":"cf_product_category",
      "label":"Product Category",
      "label_for_customers":"Product Category",
      "position":3,
      "type":"custom_dropdown",
      "default":false,
      "customers_can_edit":true,
      "required_for_closure":false,
      "required_for_agents":false,
      "required_for_customers":false,
      "displayed_to_customers":true,
      "created_at":"2019-12-16T07:12:07Z",
      "updated_at":"2019-12-16T09:35:26Z",
      "has_section":true
   },
   { 
      "id":12,
      "name":"cf_duplicate",
      "label":"Duplicate",
      "label_for_customers":"Duplicate",
      "position":5,
      "type":"custom_checkbox",
      "default":false,
      "customers_can_edit":true,
      "required_for_closure":false,
      "required_for_agents":false,
      "required_for_customers":false,
      "displayed_to_customers":true,
      "created_at":"2019-12-03T12:23:58Z",
      "updated_at":"2019-12-16T09:35:26Z"
   }
]
```

---


## List All Contacts

### **Endpoint**

```http
GET https://966aryanraj.freshdesk.com/api/v2/contacts
```

### **Authentication**
Use **Basic Authentication** with your API key.

### **Headers**

```http
Authorization: Basic YOUR_API_KEY:X
Content-Type: application/json
```

### cURL Request

```sh
curl -v -u czkLIPycy4eiGJLob5wi:X -X GET 'https://966aryanraj.freshdesk.com/api/v2/contacts'
```

### Response

```json
[
  {
    "active":false,
    "address":null,
    "company_id":null,
    "description":null,
    "email":"rachel@freshdesk.com",
    "id":2,
    "job_title":null,
    "language":"en",
    "mobile":null,
    "name":"Rachel",
    "phone":null,
    "time_zone":"Chennai",
    "twitter_id":null,
    "created_at":"2015-08-18T16:18:14Z",
    "updated_at":"2015-08-24T09:25:19Z",
    "other_companies": [
        4,
        9,
        10
    ],
    "custom_fields":{
      "department": "Admin"
      "fb_profile": null,
      "permanent": true
    }
  },
  {
    "active":false,
    "address":null,
    "company_id":null,
    "deleted":false,
    "description":null,
    "email":"superman@freshdesk.com",
    "id":432,
    "job_title":null,
    "language":"en",
    "mobile":null,
    "name":"Super Man",
    "phone":null,
    "time_zone":"Chennai",
    "twitter_id":null,
    "created_at":"2015-08-28T09:08:16Z",
    "updated_at":"2015-08-28T09:08:16Z",
    "other_companies": [
        29,
        30
    ],
    "custom_fields":{
      "department": "Production",
      "fb_profile": "https://www.facebook.com/superman.567384",
      "permanent": true
    },
  },
  {
    "active":false,
    "address":null,
    "company_id":null,
    "description":null,
    "email":"greenlantern@freshdesk.com",
    "id":434,
    "job_title":null,
    "language":"en",
    "mobile":null,
    "name":"Green Lantern",
    "phone":null,
    "time_zone":"Chennai",
    "twitter_id":null,
    "created_at":"2015-08-28T10:27:58Z",
    "updated_at":"2015-08-28T10:27:58Z",
    "custom_fields":{
      "department": "Operations"
      "fb_profile": null,
      "permanent": false
    }
  },
  ...
]
```

- Similar like tickets by default, maximum of 30 contacts can be fetched in a API call.To fetch more use per_page and page.

---

## View a Contact

### **Endpoint**

```http
GET https://966aryanraj.freshdesk.com/api/v2/contacts/[id] 
```

### **Authentication**
Use **Basic Authentication** with your API key.

### **Headers**

```http
Authorization: Basic YOUR_API_KEY:X
Content-Type: application/json
```

### cURL Request

```sh
curl -v -u czkLIPycy4eiGJLob5wi:X -H 'Content-Type: application/json' -X GET 'https://966aryanraj.freshdesk.com/api/v2/contacts/434'
```

### Response

```json
{
  "active": false,
  "address": null,
  "company_id":23,
  "view_all_tickets":false,
  "description": null,
  "email": "greenlantern@freshdesk.com",
  "id": 434,
  "job_title": null,
  "language": "en",
  "mobile": null,
  "name": "Green Lantern",
  "phone": null,
  "time_zone": "Chennai",
  "twitter_id": null,
  "other_emails": [],
  "other_companies":[
    { "company_id":25, "view_all_tickets":true },
    { "company_id":26, "view_all_tickets":false }
  ],
  "created_at": "2015-08-28T10:27:58Z",
  "updated_at": "2015-08-28T10:27:58Z",
  "custom_fields": {
    "department": "Operations"
    "fb_profile": null,
    "permanent": false
  },
  "tags": [],
  "avatar": {
    "avatar_url": "<AVATAR_URL>",
    "content_type": "application/octet-stream",
    "id": 4,
    "name": "rails.png",
    "size": 13036,
    "created_at": "2015-08-28T10:27:58Z",
    "updated_at": "2015-08-28T10:27:58Z"
  }
}
```

---

## Create a Contact

### **Endpoint**

```http
POST https://966aryanraj.freshdesk.com/api/v2/contacts
```

### **Authentication**
Use **Basic Authentication** with your API key.

### **Headers**

```http
Authorization: Basic YOUR_API_KEY:X
Content-Type: application/json
```

### cURL Request

```sh
curl -v -u czkLIPycy4eiGJLob5wi:X -H 'Content-Type: application/json' -X POST -d '{ "name":"Super Man", "email":"superman@freshdesk.com", "other_emails": ["lex@freshdesk.com", "louis@freshdesk.com"] }' 'https://966aryanraj.freshdesk.com/api/v2/contacts'
```

### Response

```json
{
  "active": false,
  "address": null,
  "company_id":23,
  "view_all_tickets":false,
  "deleted": false,
  "description": null,
  "email": "superman@freshdesk.com",
  "id": 432,
  "job_title": null,
  "language": "en",
  "mobile": null,
  "name": "Super Man",
  "phone": null,
  "time_zone": "Chennai",
  "twitter_id": null,
  "other_emails":["lex@freshdesk.com","louis@freshdesk.com"],
  "other_companies":[
    { "company_id":25, "view_all_tickets":true },
    { "company_id":26, "view_all_tickets":false }
  ],
  "created_at": "2015-08-28T09:08:16Z",
  "updated_at": "2015-08-28T09:08:16Z",
  "tags": [ ],
  "avatar": null
}
```

### Create a Contact With Avatar

- This API request must have its content-type set to multipart/form-data.

#### cURL Request

```sh
curl -v -u czkLIPycy4eiGJLob5wi:X -F 'avatar=@/path/to/image.ext' -F 'name=Green Lantern' -F 'email=greenlantern@freshdesk.com' -X POST 'https://966aryanraj.freshdesk.com/api/v2/contacts'
```

#### Response

```json
{
  "active":false,
  "address":null,
  "company_id":23,
  "view_all_tickets":false,
  "deleted":false,
  "description":null,
  "email":"greenlantern@freshdesk.com",
  "id":434,
  "job_title":null,
  "language":"en",
  "mobile":null,
  "name":"Green Lantern",
  "phone":null,
  "time_zone":"Chennai",
  "twitter_id":null,
  "other_emails":[ ],
  "other_companies":[
    { "company_id":25, "view_all_tickets":true },
    { "company_id":26, "view_all_tickets":false }
  ],
  "created_at":"2015-08-28T10:27:58Z",
  "updated_at":"2015-08-28T10:27:58Z",
  "tags":[ ],
  "avatar":{
    "avatar_url":"<AVATAR_URL>",
    "content_type":"application/octet-stream",
    "id":4,
    "name":"lantern.png",
    "size":13036,
    "created_at":"2015-08-28T10:27:58Z",
    "updated_at":"2015-08-28T10:27:58Z"
  }
}
```

---

## Update a Contact

### **Endpoint**

```http
PUT https://966aryanraj.freshdesk.com/api/v2/contacts/[id] 
```

### **Authentication**
Use **Basic Authentication** with your API key.

### **Headers**

```http
Authorization: Basic YOUR_API_KEY:X
Content-Type: application/json
```

### cURL Request

```sh
curl -v -u czkLIPycy4eiGJLob5wi:X -H 'Content-Type: application/json' -X PUT -d '{ "name":"Clark Kent", "job_title":"Journalist", "other_emails": ["louis@freshdesk.com", "jonathan.kent@freshdesk.com"] }' 'https://966aryanraj.freshdesk.com/api/v2/contacts/432'
```

### Response

```json
{
  "active":false,
  "address":null,
  "company_id":23,
  "view_all_tickets":false,
  "deleted":false,
  "description":null,
  "email":"superman@freshdesk.com",
  "id":432,
  "job_title":"Journalist",
  "language":"en",
  "mobile":null,
  "name":"Clark Kent",
  "phone":null,
  "time_zone":"Chennai",
  "twitter_id":null,
  "other_emails":["louis@freshdesk.com","jonathan.kent@freshdesk.com"],
  "other_companies":[
    { "company_id":25, "view_all_tickets":true },
    { "company_id":26, "view_all_tickets":false }
  ],
  "created_at":"2015-08-28T09:08:16Z",
  "updated_at":"2015-08-28T11:37:05Z",
  "tags":[],
  "avatar":null
}
```

### Update a Contact With Avatar

- This API request must have its content-type set to multipart/form-data.

#### cURL Request

```sh
curl -v -u czkLIPycy4eiGJLob5wi:X -F 'avatar=@/path/to/image.ext' -F 'job_title=Superhero' -X PUT 'https://966aryanraj.freshdesk.com/api/v2/contacts/434
```

#### Response

```json
{
  "active":false,
  "address":null,
  "company_id":23,
  "view_all_tickets":false,
  "deleted":false,
  "description":null,
  "email":"greenlantern@freshdesk.com",
  "id":434,
  "job_title":'Superhero',
  "language":"en",
  "mobile":null,
  "name":"Green Lantern",
  "phone":null,
  "time_zone":"Chennai",
  "twitter_id":null,
  "created_at":"2015-08-28T10:27:58Z",
  "updated_at":"2015-08-28T10:27:58Z",
  "tags":[],
  "other_companies":[
    { "company_id":25, "view_all_tickets":true },
    { "company_id":26, "view_all_tickets":false }
  ],
  "avatar":{
    "avatar_url":"<AVATAR_URL>",
    "content_type":"application/octet-stream",
    "id":4,
    "name":"lantern.png",
    "size":13036,
    "created_at":"2015-08-28T10:27:58Z",
    "updated_at":"2015-08-28T10:27:58Z"
  }
}
```

---

## Delete a Contact

### **Endpoint**

```http
DELETE https://966aryanraj.freshdesk.com/api/v2/contacts/[id]
```

### **Authentication**
Use **Basic Authentication** with your API key.

### **Headers**

```http
Authorization: Basic YOUR_API_KEY:X
Content-Type: application/json
```

### cURL Request

```sh
curl -v -u czkLIPycy4eiGJLob5wi:X -X DELETE 'https://966aryanraj.freshdesk.com/api/v2/contacts/432'
```

### Response

```json
HTTP Status: 204 No Content
```

---

## Merge Contacts

### **Endpoint**

```http
POST https://966aryanraj.freshdesk.com/api/v2/contacts/merge 
```

### **Authentication**
Use **Basic Authentication** with your API key.

### **Headers**

```http
Authorization: Basic YOUR_API_KEY:X
Content-Type: application/json
```

### cURL Request

```sh
curl -v -u czkLIPycy4eiGJLob5wi:X -H 'Content-Type: application/json' -X POST -d '{ "primary_contact_id":132, "secondary_contact_ids":[133,134,135], "contact": { "email": "rachel@freshdesk.com", "other_emails": ["louis@freshdesk.com", "jonathan.kent@freshdesk.com"], "company_ids": [1] }' 'https://966aryanraj.freshdesk.com/api/v2/contacts/merge'
```

### Response

```json
HTTP Status: 204 No Content
```

---

## List all contact fields

### **Endpoint**

```http
GET https://966aryanraj.freshdesk.com/api/v2/contact_fields
```

### **Authentication**
Use **Basic Authentication** with your API key.

### **Headers**

```http
Authorization: Basic YOUR_API_KEY:X
Content-Type: application/json
```

### cURL Request

```sh
 curl -v -u czkLIPycy4eiGJLob5wi:X -X GET 'https://966aryanraj.freshdesk.com/api/v2/contact_fields'
```

### Response

```json
[
    {
        "editable_in_signup": true,
        "id": 1,
        "name": "name",
        "label": "Full name",
        "position": 1,
        "required_for_agents": true,
        "type": "default_name",
        "default": true,
        "customers_can_edit": true,
        "label_for_customers": "Full name",
        "required_for_customers": true,
        "displayed_for_customers": true,
        "created_at": "2023-01-20T06:48:42Z",
        "updated_at": "2023-01-20T06:48:42Z"
    },
    {
        "editable_in_signup": false,
        "id": 2,
        "name": "job_title",
        "label": "Title",
        "position": 2,
        "required_for_agents": false,
        "type": "default_job_title",
        "default": true,
        "customers_can_edit": true,
        "label_for_customers": "Title",
        "required_for_customers": false,
        "displayed_for_customers": true,
        "created_at": "2023-01-20T06:48:42Z",
        "updated_at": "2023-01-20T06:48:42Z"
    },
    ...
]
```

---

## List All Companies

### **Endpoint**

```http
GET https://966aryanraj.freshdesk.com/api/v2/companies
```

### **Authentication**
Use **Basic Authentication** with your API key.

### **Headers**

```http
Authorization: Basic YOUR_API_KEY:X
Content-Type: application/json
```

### cURL Request

```sh
curl -v -u czkLIPycy4eiGJLob5wi:X -X GET 'https://966aryanraj.freshdesk.com/api/v2/companies'
```

### Response

```json
[
   {
      "id":8,
      "name":"Super Nova",
      "description":"Space Shuttle Manufacturing",
      "domains":["supernova","nova","super"],
      "note":null,
      "created_at":"2014-01-08T09:08:53+05:30",
      "updated_at":"2014-01-08T09:08:53+05:30",
      "custom_fields" : {
         "website": "https://www.supernova.org",
         "address": "123, Baker Street,\r\nNew York"
      },
      "health_score": "Happy",
      "account_tier": "Premium",
      "renewal_date": "2020-12-31T00:00:00Z",
      "industry": null
   },
   {
      "id":9,
      "name":"Poseidon",
      "description":"Ship Building Company",
      "domains":["poseidon"],
      "note":null,
      "created_at":"2014-01-08T09:08:53+05:30",
      "updated_at":"2014-01-08T09:08:53+05:30",
      "custom_fields" : {
         "website": "https://www.poseidoncorp.org",
         "address": null
      },
      "health_score": null,
      "account_tier": "Premium",
      "renewal_date": null,
      "industry": "Marine"
   }
]
```

- Similar like tickets by default, maximum of 30 companies can be fetched in a API call.To fetch more use per_page and page.

---


## List All Agents

### **Endpoint**

```http
GET https://966aryanraj.freshdesk.com/api/v2/agents
```

### **Authentication**
Use **Basic Authentication** with your API key.

### **Headers**

```http
Authorization: Basic YOUR_API_KEY:X
Content-Type: application/json
```

### cURL Request

```sh
curl -v -u czkLIPycy4eiGJLob5wi:X -X GET 'https://966aryanraj.freshdesk.com/api/v2/agents'
```

### Response

```json
[
   {
      "available":true,
      "occasional":false,
      "signature":null,
      "id":1,
      "ticket_scope":1,
      "created_at":"2015-08-18T16:18:05Z",
      "updated_at":"2015-08-18T16:18:05Z",
      "available_since":null,
      "type": "support_agent",
      "contact":{
         "active":true,
         "email":"sample@freshdesk.com",
         "job_title":null,
         "language":"en",
         "last_login_at":"2015-08-21T14:54:46+05:30",
         "mobile":null,
         "name":"Support",
         "phone":null,
         "time_zone":"Chennai",
         "created_at":"2015-08-18T16:18:05Z",
         "updated_at":"2015-08-25T08:50:20Z"
      },
      "focus_mode": true
   },
   {
      "available":true,
      "occasional":false,
      "signature":null,
      "signature":null,
      "id":432,
      "ticket_scope":1,
      "created_at":"2015-08-28T11:47:58Z",
      "updated_at":"2015-08-28T11:47:58Z",
      "available_since":null,
      "type": "support_agent",
      "contact":{
         "active":false,
         "email":"superman@freshdesk.com",
         "job_title":"Journalist",
         "language":"en",
         "last_login_at":null,
         "mobile":null,
         "name":"Clark Kent",
         "phone":null,
         "time_zone":"Chennai",
         "created_at":"2015-08-28T09:08:16Z",
         "updated_at":"2015-08-28T11:47:58Z"
      },
      "focus_mode": true
   },
   ...
]
```

- Similar like tickets by default, maximum of 30 agents can be fetched in a API call.To fetch more use per_page and page.

---

## List All Groups

### **Endpoint**

```http
GET https://966aryanraj.freshdesk.com/api/v2/groups
```

### **Authentication**
Use **Basic Authentication** with your API key.

### **Headers**

```http
Authorization: Basic YOUR_API_KEY:X
Content-Type: application/json
```

### cURL Request

```sh
curl -v -u czkLIPycy4eiGJLob5wi:X -X GET 'https://966aryanraj.freshdesk.com/api/v2/groups'
```

### Response

```json
[
  {
     "id":1,
     "name":"Entertainers",
     "description":"Singers dancers and stand up comedians",
     "business_hour_id":null
     "escalate_to":1,
     "unassigned_for":"30m",
     "auto_ticket_assign":0,
     "created_at":"2014-01-08T07:53:41+05:30",
     "updated_at":"2014-01-08T07:53:41+05:30"
  }
]
```

- Similar like tickets by default, maximum of 30 groups can be fetched in a API call.To fetch more use per_page and page.

---

## View a Group

### **Endpoint**

```http
GET https://966aryanraj.freshdesk.com/api/v2/groups/[id] 
```

### **Authentication**
Use **Basic Authentication** with your API key.

### **Headers**

```http
Authorization: Basic YOUR_API_KEY:X
Content-Type: application/json
```

### cURL Request

```sh
curl -v -u czkLIPycy4eiGJLob5wi:X -X GET 'https://966aryanraj.freshdesk.com/api/v2/groups/1'
```

### Response

```json
{
     "id":1,
     "name":"Entertainers",
     "description":"Singers dancers and stand up comedians",
     "business_hour_id":null
     "escalate_to":1,
     "unassigned_for":"30m",
     "agent_ids":[2,15],
     "auto_ticket_assign":0,
     "created_at":"2014-01-08T07:53:41+05:30",
     "updated_at":"2014-01-08T07:53:41+05:30"
}
```

---

## Canned Response APIs

### List All Folders

#### **Endpoint**

```http
GET https://966aryanraj.freshdesk.com/api/v2/canned_response_folders 
```

### **Authentication**
Use **Basic Authentication** with your API key.

#### **Headers**

```http
Authorization: Basic YOUR_API_KEY:X
Content-Type: application/json
```

#### cURL Request

```sh
curl -v -u czkLIPycy4eiGJLob5wi:X -X GET 'https://966aryanraj.freshdesk.com/api/v2/canned_response_folders'
```

#### Response

```json
[
   {
      "id":1,
      "name":"My folder",
      "personal":false,
      "responses_count":3,
      "created_at":"2018-08-16T09:08:53+05:30",
      "updated_at":"2018-08-16T09:08:53+05:30"
   }
]
```

### List All Canned Responses in a Folder

#### **Endpoint**

```http
GET https://966aryanraj.freshdesk.com/api/v2/canned_response_folders/[id] 
```

### **Authentication**
Use **Basic Authentication** with your API key.

#### **Headers**

```http
Authorization: Basic YOUR_API_KEY:X
Content-Type: application/json
```

#### cURL Request

```sh
curl -v -u czkLIPycy4eiGJLob5wi:X -X GET 'https://966aryanraj.freshdesk.com/api/v2/canned_response_folders/1'
```

#### Response

```json
{
      "id":1,
      "name":"My folder",
      "canned_responses" : [
        {
          "id": 1,
          "title": "Canned response 1"
        }
   	],
      "created_at":"2018-08-16T09:08:53+05:30",
      "updated_at":"2018-08-16T09:08:53+05:30"
}
```

### Get details of Canned Responses in a Folder

#### **Endpoint**

```http
GET https://966aryanraj.freshdesk.com/api/v2/canned_response_folders/[id]/responses 
```

### **Authentication**
Use **Basic Authentication** with your API key.

#### **Headers**

```http
Authorization: Basic YOUR_API_KEY:X
Content-Type: application/json
```

#### cURL Request

```sh
curl -v -u czkLIPycy4eiGJLob5wi:X -X GET 'https://966aryanraj.freshdesk.com/api/v2/canned_response_folders/1/responses'
```

#### Response

```json
[
   {
      "id":1,
      "title":"Canned Response title 1",
      "folder_id":1,
      "content":"Canned response sample content",
      "content_html":"<div dir=\"ltr\">Canned response sample content<div>"
      "attachments": [
      	{
      		"id":1,
			"name":"attachment_cr_1",
			"content_type":"image/jpeg",
			"size": 19127,
			"created_at":"2018-07-19T09:08:53+05:30",
			"updated_at":"2018-08-19T09:08:53+05:30",
			"attachment_url":"attachment_url",
			"thumb_url":"attachment_thumb_url"
      	}
      ],
      "created_at":"2018-08-16T09:08:53+05:30",
      "updated_at":"2018-08-16T09:08:53+05:30"
   }
]
```

- The Freshdesk API for retrieving canned responses does not specify an exact hard limit in the official documentation, but generally, the default limit is 30 records per page.

### View a Canned Response

#### **Endpoint**

```http
GET https://966aryanraj.freshdesk.com/api/v2/canned_responses/[id] 
```

### **Authentication**
Use **Basic Authentication** with your API key.

#### **Headers**

```http
Authorization: Basic YOUR_API_KEY:X
Content-Type: application/json
```

#### cURL Request

```sh
curl -v -u czkLIPycy4eiGJLob5wi:X -H "Content-Type: application/json" -X GET 'https://966aryanraj.freshdesk.com/api/v2/canned_responses/82000005490’
```

#### Response

```json
{ 
"id": 82000005490,
 "title": "We’ve received your request",
 "folder_id": 82000010465, 
"content": "Thank you for reaching out to us. Our team will look into your request and get back to you shortly. \n       \n       \n      You can check the status of your request and add comments here:\n       \n      {{ticket.url}}\n       \n       \n      Regards, \n      {{ticket.agent.name}}",
 "content_html": "<div dir=\"ltr\">\n      Thank you for reaching out to us. Our team will look into your request and get back to you shortly. \n      <br>\n      <br>\n      You can check the status of your request and add comments here:\n      <br>\n      {{ticket.url}}\n      <br>\n      <br>\n      Regards,<br>\n      {{ticket.agent.name}}\n    </div>\n  ", 
"attachments": [], 
"created_at": "2020-09-08T11:08:10Z",
 "updated_at": "2020-09-08T11:08:10Z"
}
```

---

## Routes and Mappings

1. **GET /api/tickets**  
    `Api::TicketsController#index` ➞ `Freshdesk::TicketService#list_tickets` ➞ `GET /api/v2/tickets`
    
2. **GET /api/tickets/:id**  
    `Api::TicketsController#show` ➞ `Freshdesk::TicketService#get_ticket` ➞ `GET /api/v2/tickets/:id`
    
3. **POST /api/tickets**  
    `Api::TicketsController#create` ➞ `Freshdesk::TicketService#create_ticket` ➞ `POST /api/v2/tickets`
    
4. **PUT /api/tickets/:id**  
    `Api::TicketsController#update` ➞ `Freshdesk::TicketService#update_ticket` ➞ `PUT /api/v2/tickets/:id`
    
5. **DELETE /api/tickets/:id**  
    `Api::TicketsController#destroy` ➞ `Freshdesk::TicketService#delete_ticket` ➞ `DELETE /api/v2/tickets/:id`
    
6. **GET /api/tickets/fields**  
    `Api::TicketsController#fields` ➞ `Freshdesk::TicketService#get_ticket_fields` ➞ `GET /api/v2/admin/ticket_fields`
    
7. **GET /api/tickets/count**  
    `Api::TicketsController#count` ➞ `Freshdesk::TicketService#list_tickets` ➞ `GET /api/v2/tickets`
    
8. **GET /api/tickets/:id/conversations**  
    `Api::TicketsController#conversations` ➞ `Freshdesk::TicketService#get_conversations` ➞ `GET /api/v2/tickets/:id/conversations`
    
9. **POST /api/tickets/:id/reply**  
    `Api::TicketsController#reply` ➞ `Freshdesk::TicketService#add_reply` ➞ `POST /api/v2/tickets/:id/reply`
    
10. **POST /api/tickets/:id/note**  
    `Api::TicketsController#note` ➞ `Freshdesk::TicketService#add_note` ➞ `POST /api/v2/tickets/:id/notes`
    
11. **POST /api/tickets/:id/forward**  
    `Api::TicketsController#forward` ➞ `Freshdesk::TicketService#forward_ticket` ➞ `POST /api/v2/tickets/:id/forward`
    
12. **PUT /api/tickets/:id/merge**  
    `Api::TicketsController#merge` ➞ `Freshdesk::TicketService#merge_tickets` ➞ `PUT /api/v2/tickets/merge`
    
13. **DELETE /api/conversations/:id**  
    `Api::TicketsController#delete_conversation` ➞ `Freshdesk::TicketService#delete_conversation` ➞ `DELETE /api/v2/conversations/:id`
    
14. **PUT /api/conversations/:id**  
    `Api::TicketsController#update_conversation` ➞ `Freshdesk::TicketService#update_conversation` ➞ `PUT /api/v2/conversations/:id`
    
15. **GET /api/contacts**  
    `Api::ContactsController#index` ➞ `Freshdesk::ContactService#list_contacts` ➞ `GET /api/v2/contacts`

16. **GET /api/contacts/:id**  
    `Api::ContactsController#show` ➞ `Freshdesk::ContactService#get_contact ➞ `GET /api/v2/contacts/:id`
    
17. **POST /api/contacts**  
    `Api::ContactsController#create` ➞ `Freshdesk::ContactService#create_contact` ➞ `POST /api/v2/contacts
    
18. **PUT /api/contacts/:id**  
    `Api::ContactsController#update` ➞ `Freshdesk::ContactService#update_contact` ➞ `PUT /api/v2/contacts/:id`
    
19. **DELETE /api/contacts/:id**  
    `Api::ContactsController#destroy` ➞ `Freshdesk::ContactService#delete_contact` ➞ `DELETE /api/v2/contacts/:id`
    
20. **GET /api/contacts/fields**  
    `Api::ContactsController#fields` ➞ `Freshdesk::ContactService#get_contact_fields` ➞ `GET /api/v2/contact_fields`
    
21. **GET /api/contacts/count**  
    `Api::ContactsController#count` ➞ `Freshdesk::ContactService#list_contacts` ➞ `GET /api/v2/contacts`
    
22. **POST /api/contacts/merge**  
    `Api::ContactsController#merge` ➞ `Freshdesk::ContactService#merge_contacts` ➞ `POST /api/v2/contacts/merge`
    
23. **GET /api/contacts/companies**  
    `Api::ContactsController#companies` ➞ `Freshdesk::ContactService#get_companies` ➞ `GET /api/v2/companies`
    
24. **GET /api/groups**  
    `Api::GroupsController#index` ➞ `Freshdesk::GroupService#list_groups` ➞ `GET /api/v2/groups`
    
25. **GET /api/groups/:id**  
    `Api::GroupsController#show` ➞ `Freshdesk::GroupService#get_group` ➞ `GET /api/v2/groups/:id`
    
26. **GET /api/agents**  
    `Api::AgentsController#index` ➞ `Freshdesk::AgentService#list_agents` ➞ `GET /api/v2/agents`
    
27. **GET /api/agents/:id**  
    `Api::AgentsController#show` ➞ `Freshdesk::AgentService#get_agent` ➞ `GET /api/v2/agents/:id`
    
28. **GET /api/canned_response_folders**  
    `Api::CannedResponseFoldersController#index` ➞ `Freshdesk::CannedResponseService#list_folders` ➞ `GET /api/v2/canned_response_folders`
    
29. **GET /api/canned_response_folders/:id**  
    `Api::CannedResponseFoldersController#show` ➞ `Freshdesk::CannedResponseService#get_folder` ➞ `GET /api/v2/canned_response_folders/:id`
    
30. **GET /api/canned_responses/:id**  
    `Api::CannedResponsesController#show` ➞ `Freshdesk::CannedResponseService#get_response` ➞ `GET /api/v2/canned_responses/:id`


---
